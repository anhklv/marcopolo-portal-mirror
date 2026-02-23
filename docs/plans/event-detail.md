# イベント詳細ページ (`/admin/events/[id]`) 実装計画

## Context

イベント一覧から個別イベントをクリックした際の詳細ページが未実装。モックアップ (`_archive/mockup/app/admin/events/[id]/page.tsx`) のUIを踏襲しつつ、顧客詳細ページ (`customers/[id]`) と同じプロダクションパターンで実装する。

**モックとの意図的差分**:
- アンケート結果タブ: 今回スコープ外のため非表示（アンケート機能が未実装のため）
- アンケート関連のサンプルリンク（会員向け/非会員向け）: 同上の理由で非表示
- ドロップダウンの「アンケート管理」メニュー: 遷移先（/survey/create）が未実装のため非表示
- ドロップダウンの「未回答者に再送」メニュー: 遷移先（/remind）が未実装のため非表示
- 右カラムの「参加回答フォームサンプルリンク」: 遷移先（/events/[id]/rsvp）が未実装のため非表示
- 上記は各ページの実装時に順次有効化する

---

## 変更ファイル一覧

| ファイル | 操作 | 内容 |
|---|---|---|
| `lib/types/serialized.ts` | 変更 | `SerializedEventDetail`, `SerializedRsvpForEventDetail` 追加 |
| `lib/constants/event.ts` | 変更 | `AFTER_PARTY_STATUS_CONFIG` 追加 |
| `lib/utils/event.ts` | 変更 | `formatDateTime` 追加 |
| `lib/repositories/event.repository.ts` | 変更 | `EventForDetail` 型 + `findEventByIdForDetail()` + `softDeleteEvent()` + `toggleEventPause()` 追加 |
| `lib/serializers/event.ts` | 変更 | `serializeEventForDetail()` 追加 |
| `lib/helpers/event-detail.ts` | **新規** | 参加者フィルタ・集計ロジック（純粋関数） |
| `lib/actions/event.actions.ts` | 変更 | `deleteEventAction()`, `togglePauseEventAction()` 追加 |
| `app/admin/(authenticated)/events/[id]/page.tsx` | **新規** | Server Component |
| `app/admin/(authenticated)/events/[id]/_components/event-detail.tsx` | **新規** | Client Component（メインUI） |
| `__tests__/lib/helpers/event-detail.test.ts` | **新規** | ヘルパーテスト |
| `__tests__/lib/utils/event.test.ts` | 変更 | `formatDateTime` テスト追記 |
| `__tests__/lib/actions/event.actions.test.ts` | 変更 | delete/togglePause テスト追記 |
| `__tests__/lib/serializers/event.test.ts` | **新規** | `serializeEventForDetail` テスト |

---

## 実装ステップ

### Phase 1: データ層（並列実行可能）

#### Step 1: 型定義 (`lib/types/serialized.ts`)
```typescript
export interface SerializedRsvpForEventDetail {
  id: number;
  status: string;              // 既存パターンに合わせてstring（SerializedCustomerDetailのrsvps.statusと同様）
  afterPartyStatus: string | null;
  comment: string | null;
  respondedAt: string | null;
  customer: {
    id: number;
    lastName: string;
    firstName: string;
    company: string | null;
  };
}

export interface SerializedEventDetail {
  id: number;
  title: string;
  date: string;
  location: string | null;
  description: string | null;
  timetable: string | null;
  note: string | null;
  isPaused: boolean;
  allowsOnline: boolean;
  hasAfterParty: boolean;
  responseDeadline: string | null;
  community: CommunityOption;  // 既存型を再利用
  rsvps: SerializedRsvpForEventDetail[];
}
```

#### Step 2: 定数追加 (`lib/constants/event.ts`)
- `AFTER_PARTY_STATUS_CONFIG` を追加（attending→"参加", not_attending→"不参加"）

#### Step 3: ユーティリティ (`lib/utils/event.ts`)
- `formatDateTime()` 追加 — 回答日時の表示用（曜日なし「2024年12月1日 23:59」形式）

### Phase 2: バックエンド層

#### Step 4: Repository (`lib/repositories/event.repository.ts`)
- `EventForDetail` 型定義（Event + Community + Rsvps with Customer）
- `findEventByIdForDetail()` — Event + community + rsvps(customer含む) をJOIN取得
- `softDeleteEvent(eventId)` — 論理削除（deletedAt設定）
- `toggleEventPause(eventId)` — isPaused トグル、更新後のイベントを返却

#### Step 5: Serializer (`lib/serializers/event.ts`)
- `serializeEventForDetail()` — Date→string変換、rsvps含むシリアライズ

#### Step 6: ヘルパー (`lib/helpers/event-detail.ts`) ※新規ファイル
純粋関数で以下を実装（テスト容易性のため）:
- `toAttendeeRows()` — RSVPデータ → 表示用行への変換
- `filterAttendees()` — キーワード検索 + ステータスフィルタ
- `computeEventSummary()` — 集計（現地参加/オンライン/懇親会/不参加/未回答）

**設計判断**: モックでは`attendanceType`で現地/オンラインを区別しているが、DBスキーマでは`RsvpStatus`が`attending`/`online`に分離済みのため、status値をそのまま使用。

#### Step 7: Server Actions (`lib/actions/event.actions.ts`)
既存パターン（認証→権限→検証→repository→revalidate）に準拠:

**`deleteEventAction(eventId)`**:
1. `requireAuth()` でセッション取得
2. `getAdminForPermission()` で管理者情報取得
3. `canAccessEvent(admin, eventId)` でアクセス権チェック
4. `softDeleteEvent(eventId)` (repository) で論理削除
5. `revalidatePath("/admin/events")` でキャッシュ無効化
6. `redirect("/admin/events")` で一覧へ遷移

**`togglePauseEventAction(eventId)`**:
1. `requireAuth()` でセッション取得
2. `getAdminForPermission()` で管理者情報取得
3. `canAccessEvent(admin, eventId)` でアクセス権チェック
4. `toggleEventPause(eventId)` (repository) でisPausedトグル
5. `revalidatePath("/admin/events/${eventId}")` + `revalidatePath("/admin/events")` でキャッシュ無効化
6. 成功: `{ success: true, isPaused: boolean }` を返却

### Phase 3: UI層

#### Step 8: Server Component (`app/admin/(authenticated)/events/[id]/page.tsx`)
顧客詳細と同じパターン:
```
getAuthenticatedAdmin() → canAccessEvent(admin, eventId) → notFound()
→ findEventByIdForDetail(eventId) → notFound()
→ serializeEventForDetail(event) → <EventDetail event={...} />
```

#### Step 9: Client Component (`app/admin/(authenticated)/events/[id]/_components/event-detail.tsx`)

**モックアップ準拠のUI構造**:
- **ヘッダー**: PageHeader + コミュニティBadge + DropdownMenu
  - 編集 (`/admin/events/${id}/edit`) — 常に表示
  - 案内 (`/admin/events/${id}/invite`) — 受付中のみ表示（実装済みページ）
  - 一時停止/再開 — `togglePauseEventAction`、受付中のみ表示
  - ※「未回答者に再送」「アンケート管理」は遷移先ページ未実装のため今回は非表示。各ページ実装時に追加
- **2カラムレイアウト** (grid md:grid-cols-7):
  - 左 (col-span-5): Tabs
    - 「参加状況」: 検索 + ステータスPopoverフィルタ + 参加者Table（氏名、会社名、ステータスBadge、懇親会Badge、回答日時、メッセージ）
    - 「詳細」: DataItemでイベント情報表示 + 削除Dialog
  - 右 (col-span-2): 集計サマリCard
    - 色付きカウントカード（現地参加/オンライン/懇親会/不参加/未回答）
    - イベントステータスBadge (`getEventDisplayStatus` → `EVENT_STATUS_CONFIG`)
    - 回答受付期限
    - ※サンプルリンク（参加回答フォーム等）は遷移先未実装のため今回は非表示。各ページ実装時に追加

**使用する既存UIコンポーネント**: PageHeader, Badge, DataItem, SectionHeading, Stack, Card, Table, Dialog, DropdownMenu, Popover, CheckboxItem, Tabs

---

## テスト計画

### 新規: `__tests__/lib/helpers/event-detail.test.ts`
- `toAttendeeRows`: RSVPデータ変換の正確性
- `filterAttendees`: キーワード検索（氏名/会社名）、ステータスフィルタ、組み合わせ、空フィルタ
- `computeEventSummary`: 各ステータスのカウント、空配列、懇親会カウント

### 新規: `__tests__/lib/serializers/event.test.ts`
- `serializeEventForDetail`: Date→stringの変換正確性、rsvps含むシリアライズ、null値の処理

### 追記: `__tests__/lib/utils/event.test.ts`
- `formatDateTime`: 正常系、Date型引数、エラー時フォールバック

### 追記: `__tests__/lib/actions/event.actions.test.ts`
- `deleteEventAction`: 認証チェック、権限チェック、論理削除成功、削除済みイベント、DB失敗時エラー
- `togglePauseEventAction`: 認証チェック、権限チェック、true→false、false→true、存在しないイベント、削除済みイベント

---

## 検証手順

1. `npm run tsc && npm run lint` — 型チェック・Lint
2. `npm run test:run` — 全テスト
3. `npm run build` — ビルド確認
4. 手動検証:
   - イベント一覧 → 行クリック → 詳細ページ遷移
   - 参加状況タブ: 検索・フィルタの動作
   - 詳細タブ: 情報表示、削除操作
   - 右カラム: 集計サマリ数値の正確性
   - ドロップダウンメニュー: 編集/案内/一時停止操作
   - 一時停止→再開のステータス遷移

## codex AIレビュー

実装完了後、tmuxのcodexでレビューを依頼し承認を得る:
- 型安全性（Server/Client間の整合性）
- 既存パターン準拠（顧客詳細との一貫性）
- ヘルパーの純粋性・テスト可能性
- モックアップとの差異確認
- セキュリティ（権限チェックの漏れ）
- エッジケース（RSVP 0件、全員未回答等）
