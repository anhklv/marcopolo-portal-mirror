# 管理者管理機能（/admin/admins）実装計画

## Context

特権管理者（super）が管理者アカウントのCRUD操作を行う機能。現在、顧客管理・イベント管理は実装済みで、そのパターンを踏襲して管理者管理を実装する。

- DBスキーマ（Admin, AdminCommunity テーブル）は作成済み
- Zodバリデーション（`lib/validations/admin.ts`）は作成済み
- Middleware（community_admin → 403）は対応済み
- サイドバー（super のみ管理者管理リンク表示）は対応済み
- 権限制御の詳細は別途指示予定。まずはCRUD機能を実装する

## 作成ファイル一覧

### 基盤レイヤー（3ファイル）

| ファイル | 内容 |
|---------|------|
| `lib/constants/admin.ts` | AdminRoleのラベル定数 |
| `lib/types/serialized.ts`（修正） | SerializedAdmin型の追加 |
| `lib/helpers/admin-filter.ts` | 一覧画面のクライアント側フリーワード検索 |

### データレイヤー（2ファイル）

| ファイル | 内容 |
|---------|------|
| `lib/repositories/admin.repository.ts` | Admin CRUD（findAll, findById, create, update, deleteById, existsByEmail） |
| `lib/serializers/admin.ts` | Date→ISO文字列変換（serializeAdminForList） |

### ビジネスロジック（1ファイル）

| ファイル | 内容 |
|---------|------|
| `lib/actions/admin.actions.ts` | Server Actions（createAdminAction, updateAdminAction, deleteAdminAction） |

### UI（6ファイル）

| ファイル | 内容 |
|---------|------|
| `app/admin/(authenticated)/admins/page.tsx` | 一覧ページ（Server Component） |
| `app/admin/(authenticated)/admins/new/page.tsx` | 新規登録ページ（Server Component） |
| `app/admin/(authenticated)/admins/[id]/edit/page.tsx` | 編集ページ（Server Component） |
| `app/admin/(authenticated)/admins/_components/admin-list.tsx` | 一覧表示（Client Component） |
| `app/admin/(authenticated)/admins/_components/admin-form.tsx` | 登録/編集フォーム（Client Component） |
| `app/admin/(authenticated)/admins/_components/use-admin-form.ts` | フォーム状態管理フック |

### テスト（3ファイル + 1修正）

| ファイル | 内容 |
|---------|------|
| `__tests__/helpers/mock-prisma.ts`（修正） | admin/adminCommunityモック拡張 |
| `__tests__/lib/helpers/admin-filter.test.ts` | フィルタ純粋関数テスト |
| `__tests__/lib/repositories/admin.repository.test.ts` | Repositoryテスト |
| `__tests__/lib/actions/admin.actions.test.ts` | Server Actionsテスト |

## 実装順序

### Step 1: 基盤レイヤー

**`lib/constants/admin.ts`** — 新規作成
```typescript
import type { AdminRole } from "@/lib/generated/prisma";
export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super: "特権管理者",
  community_admin: "コミュニティ管理者",
};
```

**`lib/types/serialized.ts`** — 末尾に追加
```typescript
export interface SerializedAdmin {
  id: number;
  lastName: string;
  firstName: string;
  email: string;
  role: string;  // AdminRole
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  adminCommunities: {
    communityId: number;
    community: CommunityOption;  // 既存の型を再利用
  }[];
}
```

**`lib/helpers/admin-filter.ts`** — 新規作成
- `filterAdmins(admins, keyword)`: 氏名・メールアドレスのフリーワード検索
- `customer-filter.ts` と同パターン（toLowerCase + includes）

### Step 2: データレイヤー

**`lib/repositories/admin.repository.ts`** — 新規作成
- `customer.repository.ts` のパターンを踏襲
- `findAll()`: orderBy id asc, include adminCommunities > community
- `findById(id)`: 1件取得
- `create(data)`: $transaction（Admin作成 + AdminCommunity createMany）、bcryptでパスワードハッシュ化
- `update(id, data)`: $transaction（Admin更新 + AdminCommunity全削除→再作成）
- `deleteById(id)`: $transaction（AdminCommunity全削除 → Admin物理削除）
- `existsByEmail(email, idToExclude?)`: メール重複チェック

**`lib/serializers/admin.ts`** — 新規作成
- `serializeAdminForList(admin)`: Date→ISO文字列変換

### Step 3: Server Actions

**`lib/actions/admin.actions.ts`** — 新規作成
- `customer.actions.ts` のパターンを踏襲

`createAdminAction(formData)`:
1. `requireAuthenticatedAdmin()` → isSuper確認
2. `adminCreateSchema.safeParse` でバリデーション
3. `existsByEmail` で重複チェック
4. `create()` でDB作成（bcryptハッシュ含む）
5. `revalidatePath` → `redirect("/admin/admins")`

`updateAdminAction(id, formData)`:
1. `requireAuthenticatedAdmin()` → isSuper確認
2. `adminUpdateSchema.safeParse` でバリデーション
3. `findById` で存在確認
4. 特権管理者のrole変更防止チェック
5. `existsByEmail(email, id)` で重複チェック
6. `update()` でDB更新
7. `revalidatePath` → `redirect("/admin/admins")`

`deleteAdminAction(id)`:
1. `requireAuthenticatedAdmin()` → isSuper確認 + 自分自身の削除防止
2. `findById` で存在確認
3. `deleteById()` で物理削除
4. `revalidatePath` → `redirect("/admin/admins")`

### Step 4: UIコンポーネント

**`use-admin-form.ts`** — 新規作成
- `use-event-form.ts` のパターンを踏襲
- useState: lastName, firstName, email, password, passwordConfirm, role, communityIds, isDeleteDialogOpen
- useFieldErrors でエラー管理
- useTransition でServer Action呼び出し
- クライアント側Zodバリデーション → Server Action → redirect catch → toast

**`admin-form.tsx`** — 新規作成
- Props: mode("create"|"edit"), initialData?, communities
- `useAdminForm` フックを使用
- 基本情報セクション: 姓・名（grid-cols-2）、メールアドレス、パスワード（createのみ）
- 管理者権限セクション: RadioGroup（super/community_admin）、コミュニティCheckbox（community_admin時のみ）
- 編集時：元のroleがsuperならRadioGroup disabled
- 編集時：削除セクション（Dialog確認付き）
- 既存コンポーネント使用: PageHeader, SectionHeading, Stack, FormField, RadioItem, CheckboxItem, ActionButton, Dialog

**`admin-list.tsx`** — 新規作成
- Props: initialAdmins
- useState: searchKeyword
- useMemo: filterAdmins で検索結果算出
- PageHeader: タイトル「管理者管理」、説明「システムを利用する管理者アカウントを管理します。」
- 新規登録ボタン（Plus icon、Link to /admin/admins/new）
- 検索Input（Search icon）
- 件数表示
- Table: ID, 氏名, メールアドレス, 管理者権限(Badge), 最終ログイン, 操作(編集ボタン)
- Badge: super→variant="default"「特権管理者」、community_admin→variant="secondary"「コミュニティ管理者(コミュニティ名)」

### Step 5: ページ（Server Component）

**`admins/page.tsx`**: getAuthenticatedAdmin → isSuper確認 → findAll → serialize → AdminList
**`admins/new/page.tsx`**: isSuper確認 → community取得（OTHER除外） → AdminForm mode="create"
**`admins/[id]/edit/page.tsx`**: isSuper確認 → findById → community取得 → AdminForm mode="edit"

### Step 6: テスト

**`__tests__/helpers/mock-prisma.ts`** — 修正
- `admin` に findMany, findFirst, create, delete, count を追加
- `adminCommunity` に createMany, deleteMany を追加

**`__tests__/lib/helpers/admin-filter.test.ts`**
- キーワード空→全件返却
- 氏名でフィルタ（部分一致）
- メールアドレスでフィルタ
- case-insensitive
- 該当なし→空配列

**`__tests__/lib/repositories/admin.repository.test.ts`**
- findAll: ID昇順、adminCommunities include
- findById: 存在する/しない
- create: Admin + AdminCommunity作成（$transaction）
- update: 更新 + 関連削除→再作成
- deleteById: 物理削除
- existsByEmail: 重複あり/なし/自身除外

**`__tests__/lib/actions/admin.actions.test.ts`**
- createAdminAction: 正常系（redirect）、認証エラー、バリデーションエラー、メール重複
- updateAdminAction: 正常系、認証エラー、存在しない管理者、バリデーションエラー、メール重複、特権管理者role変更防止
- deleteAdminAction: 正常系、認証エラー、自分自身の削除防止、存在しない管理者

## 再利用する既存リソース

### UIコンポーネント
- `PageHeader`, `SectionHeading`, `Stack` — レイアウト
- `FormField` — ラベル+入力+エラー表示
- `CheckboxItem`, `RadioItem` — 選択UI
- `ActionButton` — 送信ボタン
- `Badge`, `Button`, `Input`, `Label` — 基本UI
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` — テーブル
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` — 削除確認
- `RadioGroup` — 権限選択

### フック
- `useFieldErrors` (`lib/hooks/use-field-errors.ts`)

### ユーティリティ
- `formatZodFieldErrors` (`lib/validations/utils.ts`)
- `isRedirectError` (`lib/utils.ts`)
- `formatDate` (`lib/utils.ts`)
- `COMMUNITY_CODE` (`lib/constants/community.ts`)

### 認証
- `getAuthenticatedAdmin` — Server Component用
- `requireAuthenticatedAdmin` — Server Action用

### バリデーション（実装済み）
- `adminCreateSchema` (`lib/validations/admin.ts`)
- `adminUpdateSchema` (`lib/validations/admin.ts`)

## 検証方法

1. `npm run tsc` — 型チェック
2. `npm run lint` — ESLint
3. `npm run test:run` — テスト実行
4. `npm run build` — ビルド確認
5. 手動確認:
   - 特権管理者でログイン → `/admin/admins` で一覧表示
   - 新規登録（特権管理者・コミュニティ管理者それぞれ）
   - 編集（基本情報変更、コミュニティ変更）
   - 特権管理者のrole変更不可の確認
   - 削除（確認ダイアログ表示 → 削除実行）
   - 検索（氏名・メールアドレス）
   - community_adminでアクセス → 403
