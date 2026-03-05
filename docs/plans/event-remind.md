# 未回答者リマインドメール送信 (`/admin/events/[id]/remind`) 実装計画

## Context

イベント案内メール送信後、未回答（pending）のまま放置されている参加者へリマインドメールを再送する機能（EV-07）が未実装。イベント詳細ページのドロップダウンにはすでに「未回答者に再送」リンクが設置済み（`event-detail.tsx:139-149`）だが、遷移先ページが存在しない。案内メール送信（invite）と構造が類似するが、送信先が固定（pending RSVPのみ、選択不可）、新規RSVP作成なし（トークン更新のみ）という本質的な違いがあるため、独立したファイルセットとして実装する。

---

## 方針

- **invite との関係**: ファイル構成パターンは踏襲するが、コンポーネント・Action・バリデーションは独立ファイル
- **流用するもの**: ヘルパー（`lib/helpers/invite.ts`）、メール送信（`lib/mail/send.ts`）、共通UIコンポーネント（`CustomerBadges`, `PageHeader`, `ActionButton` 等）、StepIndicator（props化して共通化）
- **UIはモックアップ準拠**: `_archive/mockup/app/admin/events/[id]/remind/page.tsx`

---

## 変更ファイル一覧

### 新規作成

| ファイル | 内容 |
|---|---|
| `lib/validations/remind.ts` | `remindSchema`, `testRemindSchema`（Zodスキーマ） |
| `lib/mail/templates/remind.ts` | `generateRemindSubject()`, `generateRemindBody()` |
| `lib/actions/remind.actions.ts` | `sendRemindAction`, `sendTestRemindAction` |
| `app/admin/(authenticated)/events/[id]/remind/page.tsx` | Server Component |
| `app/admin/(authenticated)/events/[id]/remind/_components/remind-form.tsx` | Client Component（3ステップフォーム） |
| `app/admin/(authenticated)/events/[id]/remind/_components/use-remind-form.ts` | カスタムフック |
| `app/admin/(authenticated)/events/[id]/remind/_components/step-recipients.tsx` | ステップ1: 送信先確認テーブル |
| `app/admin/(authenticated)/events/[id]/remind/_components/step-email.tsx` | ステップ2: メール文作成 |
| `app/admin/(authenticated)/events/[id]/remind/_components/step-confirm.tsx` | ステップ3: 確認・送信 |
| `__tests__/lib/validations/remind.test.ts` | バリデーションテスト |
| `__tests__/lib/mail/templates/remind.test.ts` | テンプレートテスト |
| `__tests__/lib/actions/remind.actions.test.ts` | Actionテスト |

### 既存ファイル変更

| ファイル | 内容 |
|---|---|
| `lib/types/serialized.ts` | `SerializedEventForRemind`, `SerializedPendingCustomer` 追加 |
| `lib/repositories/event.repository.ts` | `EventForRemind` 型 + `findEventByIdForRemind()` 追加 |
| `lib/serializers/event.ts` | `serializeEventForRemind()` 追加 |
| `app/.../invite/_components/step-indicator.tsx` | steps配列をprops化して汎用化 |
| `app/.../invite/_components/step-select.tsx` | StepIndicator呼び出しにsteps prop追加 |
| `app/.../invite/_components/step-email.tsx` | 同上 |
| `app/.../invite/_components/step-confirm.tsx` | 同上 |

---

## 実装ステップ

### Step 1: バリデーション + テンプレート

**`lib/validations/remind.ts`**
```typescript
// remindSchema: eventId + emailTitle + emailBody のみ（customerIds不要）
// testRemindSchema: 同上
```

**`lib/mail/templates/remind.ts`**
- `generateRemindSubject()`: `【{eventTitle}】参加可否のご回答をお願いします`
- `generateRemindBody()`: invite.tsと同構造だが、リマインド用文言を使用
  - 「まだ参加可否のご回答をいただいておりません。お忙しい中恐縮ですが…」
- テンプレートパラメータ型は invite.ts の `InviteTemplateParams` を参考に同じフィールド構成で定義

**テスト**: `remind.test.ts`（バリデーション）、`remind.test.ts`（テンプレート）

### Step 2: データ層（型 + リポジトリ + シリアライザー）

**`lib/types/serialized.ts`** に追加:
```typescript
export interface SerializedPendingCustomer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  subEmails: string[];
  company: string | null;
  memberCategory: string | null;
  customerCommunities: {
    communityId: number;
    resignedAt: string | null;
    auditMemberType: string | null;
    auditMemberPremium: boolean | null;
    community: { code: string; name: string };
  }[];  // ← SerializedCustomerForInvite のcustomerCommunities と同じ構造
}

export interface SerializedEventForRemind {
  id: number;
  title: string;
  date: string;
  location: string | null;
  description: string | null;
  timetable: string | null;
  note: string | null;
  community: CommunityOption;
  pendingCustomers: SerializedPendingCustomer[];
}
```

**`lib/repositories/event.repository.ts`** に `findEventByIdForRemind()` 追加:
- イベント + community + rsvps（status=pending のみ）を取得
- rsvps に customer 情報を include（氏名、会社名、メール、subEmails、memberCategory、customerCommunities）
- 顧客のバッジ表示に必要な `customerCommunities` を含める

**`lib/serializers/event.ts`** に `serializeEventForRemind()` 追加

### Step 3: Server Action

**`lib/actions/remind.actions.ts`**

`sendRemindAction` の処理フロー:
1. `requireAuthenticatedAdmin()` で認証
2. `remindSchema.safeParse()` でバリデーション
3. イベント存在 + `canAccessEvent()` チェック
4. **サーバー側で** pending RSVP + 顧客情報を取得（クライアントからcustomerIdsを受け取らない）
5. pending RSVP が 0件ならエラー
6. トークン事前生成 → バッチメール送信（invite.actions.tsと同じパターン）
7. 送信成功分のみ `rsvp.update` でトークン更新（`createMany` は不要）
8. `revalidatePath` 実行、sentCount/failedCount返却

`sendTestRemindAction`: `sendTestInviteAction` と同じパターン

**流用**: `generateRsvpToken()`, `buildRsvpUrl()`, `replacePlaceholders()` from `lib/helpers/invite.ts`

**テスト**: `remind.actions.test.ts`（invite.actions.test.ts のパターンを参考）

### Step 4: StepIndicator 共通化

**`invite/_components/step-indicator.tsx`** を変更:
- `STEPS` 配列をハードコードからpropsに変更
- `currentStep` を `string` 型に汎用化
- invite側: `INVITE_STEPS` 定数を定義してpropsで渡す
- remind側: `REMIND_STEPS`（「送信先確認」「メール文作成」「確認」「送信」）を定義してpropsで渡す

```typescript
// 変更後のインターフェース
interface StepConfig {
  key: string;
  label: string;
  number: number;
}

export function StepIndicator({
  currentStep,
  steps,
}: {
  currentStep: string;
  steps: readonly StepConfig[];
}) { ... }
```

invite側の `step-select.tsx`, `step-email.tsx`, `step-confirm.tsx` で `INVITE_STEPS` を渡すように修正。

### Step 5: ページ + UIコンポーネント

**`remind/page.tsx`** (Server Component):
- `getAuthenticatedAdmin()` → `canAccessEvent()` → `findEventByIdForRemind()`
- pending顧客0名 → `notFound()`
- `serializeEventForRemind()` でシリアライズ
- `generateRemindSubject/Body` でテンプレート初期値生成
- `<RemindForm />` にprops受け渡し

**`remind-form.tsx`**: invite-form.tsx と同構造（stepに応じたサブコンポーネント描画）

**`use-remind-form.ts`**:
- `RemindStep = "recipients" | "email" | "confirm"`
- URLベースステップ管理（inviteと同パターン）
- 選択・フィルター系stateなし（inviteと比べて大幅にシンプル）
- リロード時フォールバック: emailステップでpendingCustomers.length === 0 → recipients に戻す等

**`step-recipients.tsx`** (ステップ1: 送信先確認):
- `PageHeader`: backHref → イベント詳細、title: "未回答者への再送"
- `StepIndicator`: REMIND_STEPS
- サマリーバー: "N名に送信予定"
- テーブル: 氏名、会社名、会員区分（`CustomerBadges`コンポーネント利用）、メールアドレス
- チェックボックスなし（変更不可）
- ボタン: キャンセル（イベント詳細へ）、次へ

**`step-email.tsx`** (ステップ2):
- invite/step-email.tsx と同構造
- タイトル・説明文がリマインド用文言
- `{RSVP_URL}` プレースホルダの説明

**`step-confirm.tsx`** (ステップ3):
- invite/step-confirm.tsx と同構造
- ダイアログ文言: 「リマインドメールを送信しますか？」
- 送信先一覧 + メール内容プレビュー + テスト送信 + 送信確認Dialog

---

## テスト計画

### `__tests__/lib/validations/remind.test.ts`
- remindSchema: 正常系、eventId不正、emailTitle空/超過、emailBody空/超過
- testRemindSchema: 同上

### `__tests__/lib/mail/templates/remind.test.ts`
- generateRemindSubject: タイトルフォーマット確認
- generateRemindBody: 全フィールドあり、オプショナルフィールドなし、リマインド文言含有確認

### `__tests__/lib/actions/remind.actions.test.ts`
- 正常系: pending 2名に送信成功、トークン更新確認
- 正常系: subEmailsありの顧客はメイン+サブ宛先で送信
- 正常系: 11名以上で複数バッチ送信
- 正常系: メール送信失敗分はトークン未更新
- 異常系: バリデーションエラー
- 異常系: 未認証
- 異常系: アクセス権なし
- 異常系: イベント未存在
- 異常系: pending RSVPが0件
- 異常系: DB更新失敗 → failedとして集計
- テスト送信: 正常系・異常系

---

## 検証手順

1. `npm run tsc` — 型チェック
2. `npm run lint` — Lint
3. `npm run test:run` — 全テスト
4. `npm run build` — ビルド
5. ブラウザ手動テスト:
   - 受付中イベント詳細 → ドロップダウン「未回答者に再送」→ remindページ遷移
   - ステップ1: 未回答者テーブル表示、送信人数サマリー
   - ステップ2: テンプレート初期値、編集、バリデーション
   - ステップ3: プレビュー表示、テスト送信、本送信
   - 送信後イベント詳細にリダイレクト
   - 未回答者0名のイベントで `/remind` 直接アクセス → 404
   - ステップ間のブラウザバック動作
6. codexレビュー（tmux隣ペイン）:
   - 実装完了後、codexにレビュー依頼
   - フィードバックを元に改善（ただしオーバーエンジニアリングは回避）
   - codexから承認を得るまで繰り返す
   - 判断に迷う場合はユーザーに確認
