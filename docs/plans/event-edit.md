# イベント編集画面 `/events/[id]/edit` 実装計画

## Context
イベント新規作成画面（`/events/new`）は実装済み。次のステップとして、イベント編集画面を実装する。モックアップ（`_archive/mockup/app/admin/events/[id]/edit/page.tsx`）は承認済みでUIはそれに従う。顧客管理の create/edit 両対応パターン（`customer-form.tsx` + `use-customer-form.ts`）を踏襲し、既存のイベント作成フォームを create/edit 両対応に拡張する。

## 設計方針
- **既存ファイルの拡張**: `event-form.tsx` と `use-event-form.ts` を `mode: "create" | "edit"` で両対応にする（顧客フォームと同一パターン）
- **リダイレクト先**: 編集成功時は `/admin/events` にリダイレクト（イベント詳細ページは未実装のため）
- **戻るリンク**: `/admin/events`（同上の理由）
- **コミュニティ変更**: 編集時もコミュニティ変更を許可（モックアップ準拠、権限スコープ内のみ）
- **updateEventAction の戻り値**: `redirect()` を使用（成功画面が不要なため、顧客editと同一パターン）

## 実装ファイル一覧

### 新規作成（2ファイル）
| ファイル | 種別 | 責務 |
|---|---|---|
| `app/admin/(authenticated)/events/[id]/edit/page.tsx` | Server Component | 認証・アクセス権・既存データ取得 → EventForm へ props 渡し |
| `__tests__/lib/actions/event.actions.test.ts` | テスト追加 | updateEventAction のテストケース追加 |

### 既存ファイルの修正（4ファイル）
| ファイル | 変更内容 |
|---|---|
| `lib/repositories/event.repository.ts` | `findEventById()`, `updateEvent()` 追加 |
| `lib/actions/event.actions.ts` | `updateEventAction()` 追加 |
| `app/admin/(authenticated)/events/_components/event-form.tsx` | `mode` + `initialData` props追加、create/edit分岐 |
| `app/admin/(authenticated)/events/_components/use-event-form.ts` | `mode` + `initialData` 対応、create/edit送信分岐 |

## 各ファイルの実装方針

### 1. `event.repository.ts` — findEventById + updateEvent 追加

```typescript
/**
 * イベント単体取得（編集画面用）
 */
export async function findEventById(eventId: number): Promise<Event | null> {
  return prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });
}

/**
 * イベント更新
 */
export async function updateEvent(
  eventId: number,
  data: {
    communityId: number;
    title: string;
    date: Date;
    location: string | null;
    description: string | null;
    timetable: string | null;
    note: string | null;
    responseDeadline: Date | null;
    allowsOnline: boolean;
    hasAfterParty: boolean;
  }
): Promise<Event> {
  return prisma.event.update({
    where: { id: eventId },
    data,
  });
}
```

### 2. `event.actions.ts` — updateEventAction 追加

`updateCustomerAction`（`customer.actions.ts:185-233`）のパターンを踏襲。

```typescript
export async function updateEventAction(
  eventId: number,
  formData: unknown
): Promise<EventActionResult | void> {
  // 1. requireAuth()
  // 2. getAdminForPermission()
  // 3. canAccessEvent(admin, eventId) — 既存イベントへのアクセス権
  // 4. eventSchema.safeParse(formData) → fieldErrors
  // 5. communityIdのスコープ検証（変更先コミュニティも検証）
  // 6. eventRepo.updateEvent(eventId, data) — try/catch
  // 7. revalidatePath("/admin/events")
  // 8. redirect(`/admin/events`) — 詳細ページ未実装のためリストへ
}
```

**顧客editとの違い:**
- メール重複チェック不要（イベントにユニーク制約なし）
- リレーション差分更新不要（イベントはフラットなデータ）
- `canAccessEvent` を使用（`permissions.ts:138` に既存）

**戻り値型**: `EventActionResult | void`
- バリデーション/権限エラー時: `EventActionResult` を返却
- 成功時: `redirect()` で例外throw（`void`にならない）

### 3. `use-event-form.ts` — create/edit両対応

**Props変更:**
```typescript
interface UseEventFormProps {
  mode: "create" | "edit";        // 追加
  initialData?: EventInitialData; // 追加
  communities: CommunityOption[];
  isSuper: boolean;
  scopedCommunityIds: number[];
}
```

**EventInitialData型:**
```typescript
export interface EventInitialData {
  id: number;
  communityId: number;
  title: string;
  date: string;                    // ISO文字列
  location: string | null;
  description: string | null;
  timetable: string | null;
  note: string | null;
  responseDeadline: string | null; // ISO文字列
  allowsOnline: boolean;
  hasAfterParty: boolean;
}
```

**初期値の設定:**
- edit時は `initialData` から各stateを初期化
- 日時の分解: ISO文字列 → YYYY/MM/DD + HH:mm
  - `isoToDisplay(dateStr)`: ISO → "YYYY/MM/DD"（顧客フォーム `use-customer-form.ts:80-83` と同一ヘルパー）
  - `isoToTime(dateStr)`: ISO → "HH:mm"（新規ヘルパー）

```typescript
function isoToDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 10).replace(/-/g, "/");
}

function isoToTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const match = dateStr.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : "";
}
```

**送信フロー変更:**
```typescript
// create: createEventAction → result処理 → success画面
// edit:   updateEventAction → redirect（NEXT_REDIRECT例外）
if (mode === "create") {
  const result = await createEventAction(formData);
  // ...既存のresult処理
} else {
  await updateEventAction(initialData!.id, formData);
}
```

**NEXT_REDIRECT対応:**
顧客フォーム（`use-customer-form.ts:374-379`）と同一パターン:
```typescript
} catch (err) {
  if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
    toast.success("イベント情報を更新しました");
    return;
  }
  toast.error("エラーが発生しました");
}
```

**ステップ管理:**
- create: step管理あり（"form" → "success"）
- edit: step管理不要（redirect）

### 4. `event-form.tsx` — create/edit分岐

**Props変更:**
```typescript
interface EventFormProps {
  mode: "create" | "edit";        // 追加
  initialData?: EventInitialData; // 追加
  communities: CommunityOption[];
  isSuper: boolean;
  scopedCommunityIds: number[];
}
```

**mode別の変更箇所（顧客フォーム `customer-form.tsx:75-86` と同一パターン）:**
| 箇所 | create | edit |
|---|---|---|
| ページタイトル | "イベント作成" | "イベント編集" |
| ページ説明 | "新しいイベントを作成します。" | "イベント情報を編集・更新します。" |
| 戻るリンク | `/admin/events` | `/admin/events` |
| 送信ボタン | "作成"/"作成中..." | "更新"/"更新中..." |
| 成功画面 | 表示する | 表示しない（redirect） |

**成功画面の条件分岐:**
```tsx
// create時のみ成功画面を表示
if (form.step === "success" && mode === "create") { ... }
```

### 5. `events/[id]/edit/page.tsx` — Server Component

顧客の `customers/[id]/edit/page.tsx` と同一パターン:

```typescript
import { getAuthenticatedAdmin, canAccessEvent } from "@/lib/auth/permissions";
import { findEventById } from "@/lib/repositories/event.repository";
import { fetchEventFormMasterData } from "@/lib/repositories/master.repository";
import { EventForm } from "../../_components/event-form";
import { notFound } from "next/navigation";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = Number(id);
  if (isNaN(eventId)) notFound();

  const { admin, isSuper, scopedCommunityIds } = await getAuthenticatedAdmin();

  const hasAccess = await canAccessEvent(admin, eventId);
  if (!hasAccess) notFound();

  const event = await findEventById(eventId);
  if (!event) notFound();

  const { communities } = await fetchEventFormMasterData();

  // Date をシリアライズして initialData を構築
  const initialData = {
    id: event.id,
    communityId: event.communityId,
    title: event.title,
    date: event.date.toISOString(),
    location: event.location,
    description: event.description,
    timetable: event.timetable,
    note: event.note,
    responseDeadline: event.responseDeadline?.toISOString() ?? null,
    allowsOnline: event.allowsOnline,
    hasAfterParty: event.hasAfterParty,
  };

  return (
    <EventForm
      mode="edit"
      initialData={initialData}
      communities={communities}
      isSuper={isSuper}
      scopedCommunityIds={scopedCommunityIds}
    />
  );
}
```

### 6. `events/new/page.tsx` — mode="create" 追加

既存の `page.tsx` に `mode="create"` を追加:
```tsx
<EventForm
  mode="create"      // 追加
  communities={communities}
  isSuper={isSuper}
  scopedCommunityIds={scopedCommunityIds}
/>
```

## テスト計画

### updateEventAction テスト（`event.actions.test.ts` に追加）

既存の `createEventAction` テストの下に `describe("updateEventAction")` を追加。

| テストケース | 種別 |
|---|---|
| 有効データ → updateEvent呼出 → redirect | 正常系 |
| 未認証 → エラー | 認証 |
| アクセス権なし → エラー | 権限 |
| title 空 → fieldErrors返却 | バリデーション |
| community_admin がスコープ外communityId指定 → エラー | 権限 |
| community_admin がスコープ内communityId指定 → 成功 | 権限 |
| super が任意communityIdで更新可能 | 権限 |
| responseDeadline > date → エラー返却 | 相関バリデーション |
| 成功時に revalidatePath が呼ばれること | 副作用 |
| DB更新失敗 → エラー返却 | 異常系 |

**追加モック:**
- `mockUpdateEvent = vi.fn()` — event.repository のモック
- `mockCanAccessEvent = vi.fn()` — permissions のモック
- `mockRedirect = vi.fn()` — next/navigation のモック（NEXT_REDIRECT例外をthrow）

## 実装順序

1. **Repository**: `event.repository.ts` に `findEventById` + `updateEvent` 追加
2. **Server Action**: `event.actions.ts` に `updateEventAction` 追加
3. **Custom Hook**: `use-event-form.ts` を create/edit 両対応に拡張
4. **フォームComponent**: `event-form.tsx` を create/edit 両対応に拡張
5. **editページ**: `events/[id]/edit/page.tsx` 新規作成
6. **newページ**: `events/new/page.tsx` に `mode="create"` 追加
7. **テスト**: `event.actions.test.ts` に updateEventAction テスト追加
8. **検証**: tsc → lint → test:run → build → ブラウザ確認
9. **tmux隣ペインのCodexにレビュー依頼**

## 参照ファイル
- `app/admin/(authenticated)/customers/[id]/edit/page.tsx` — editページパターン
- `app/admin/(authenticated)/customers/_components/customer-form.tsx` — create/edit両対応パターン
- `app/admin/(authenticated)/customers/_components/use-customer-form.ts` — create/edit hook パターン
- `lib/actions/customer.actions.ts:185-233` — updateCustomerAction パターン
- `lib/auth/permissions.ts:138-160` — canAccessEvent（既存）
- `_archive/mockup/app/admin/events/[id]/edit/page.tsx` — UI仕様（モックアップ）

## 検証方法
1. `npm run tsc && npm run lint` — 各ステップ毎
2. `npm run test:run` — テスト追加後
3. `npm run build` — 最終確認
4. ブラウザ: イベント一覧から「編集」リンク → 編集画面 → 各フィールド確認 → 更新 → リスト遷移
5. 権限パターン: super / community_admin(複数スコープ) / community_admin(単一スコープ)
6. tmux隣ペインのCodexにレビュー依頼
