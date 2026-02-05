# Next.jsベストプラクティス設計案（2026/02/05 更新）

> 02-Next.jsベストプラクティス設計案.md の改訂版。
> モック実装で得た知見と壁打ちの結果を反映。

## 変更点サマリ

| 項目 | 旧（02） | 新（本案） |
|------|----------|-----------|
| Service 層 | 初期から導入 | 不要。必要になってから追加 |
| Repository | class + static メソッド | 関数エクスポート |
| バリデーション | Service 層の validate() | Zod スキーマを独立ファイルに |
| UI コンポーネント設計 | shadcn/ui のみ記載 | レイアウトコンポーネントの章を追加 |
| テーマ・デザイン統一 | 記載なし | テーマ設計とコンポーネント使用ルールの章を追加 |
| ディレクトリ構造 | product/ 配下 | プロジェクト直下（_archive/mockup/ からコピー） |

---

## 基本方針

- Next.js App Router の Server Components / Server Actions を最大限活用する
- `_archive/mockup/` のスタイルガイド・UIコンポーネントをベースにコピーし、必要に応じて改善する
- 層を増やしすぎない。現在の規模では **Actions → Repository の2層**で十分
- デザインの統一はドキュメントではなく**コンポーネントで強制**する

---

## ディレクトリ構造

```
marcopolo-portal/
├── _archive/
│   └── mockup/                      # 旧モック（参照・コピー元）
├── docs/                            # ドキュメント
│
├── app/                             # Next.js App Router
│   ├── admin/
│   │   ├── layout.tsx               # 管理画面共通レイアウト
│   │   ├── customers/
│   │   │   ├── page.tsx             # Server Component（一覧）
│   │   │   ├── new/
│   │   │   │   └── page.tsx         # Client Component（新規作成フォーム）
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx         # Server Component（詳細）
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx     # Client Component（編集フォーム）
│   │   │   └── _components/         # このページ専用のクライアントコンポーネント
│   │   │       ├── customers-list.tsx
│   │   │       └── customer-filters.tsx
│   │   ├── events/
│   │   │   └── ...                  # 同様の構成
│   │   └── ...
│   │
│   ├── globals.css                  # テーマ変数定義（_archiveをベースに改善）
│   ├── layout.tsx                   # ルートレイアウト
│   └── page.tsx
│
├── components/
│   ├── ui/                          # shadcn/ui コンポーネント（_archiveをベースに改善）
│   └── layout/                      # プロジェクト共通レイアウトコンポーネント
│       ├── form-page.tsx            # フォームページの共通レイアウト
│       ├── list-page.tsx            # 一覧ページの共通レイアウト
│       ├── detail-page.tsx          # 詳細ページの共通レイアウト
│       └── page-header.tsx          # ページヘッダー
│
├── lib/
│   ├── actions/                     # Server Actions
│   │   ├── customer.actions.ts
│   │   └── event.actions.ts
│   │
│   ├── repositories/                # データアクセス層（関数エクスポート）
│   │   ├── customer.repository.ts
│   │   └── event.repository.ts
│   │
│   ├── validations/                 # Zod スキーマ
│   │   ├── customer.schema.ts
│   │   └── event.schema.ts
│   │
│   ├── types/                       # TypeScript 型定義（_archiveをベースに改善）
│   │   ├── customer.ts
│   │   └── event.ts
│   │
│   ├── constants/                   # 定数（_archiveをベースに改善）
│   └── utils.ts                     # ユーティリティ
│
└── components.json                  # shadcn/ui 設定
```

### 旧設計案との構造上の違い

- `lib/services/` を**削除**。ビジネスロジックが複雑化するまで不要
- `lib/validations/` を**追加**。Zod スキーマを独立管理
- `components/layout/` を**追加**。UI統一をコンポーネントで担保

---

## 各層の設計

### 1. Server Components（デフォルト）

すべてのページはデフォルトで Server Component。`"use client"` はインタラクティブな部分のみ。

```typescript
// app/admin/customers/page.tsx
// "use client" なし = Server Component

import { findAll } from "@/lib/repositories/customer.repository";
import { CustomersList } from "./_components/customers-list";
import { ListPage } from "@/components/layout/list-page";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { keyword?: string };
}) {
  const customers = await findAll({ keyword: searchParams.keyword });

  return (
    <ListPage
      title="顧客管理"
      createHref="/admin/customers/new"
      createLabel="新規登録"
    >
      <CustomersList initialCustomers={customers} />
    </ListPage>
  );
}
```

### 2. Server Actions（データ更新）

フォーム送信・データ更新は Server Actions で処理する。バリデーションは Zod スキーマを使用。

```typescript
// lib/actions/customer.actions.ts
"use server";

import { customerCreateSchema } from "@/lib/validations/customer.schema";
import * as customerRepo from "@/lib/repositories/customer.repository";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCustomer(formData: FormData) {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company"),
  };

  // Zod でバリデーション
  const result = customerCreateSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.flatten().fieldErrors };
  }

  await customerRepo.create(result.data);

  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}
```

### 3. Zod バリデーションスキーマ

Actions と フォーム の両方で共有できる。

```typescript
// lib/validations/customer.schema.ts
import { z } from "zod";

export const customerCreateSchema = z.object({
  name: z.string().min(1, "氏名は必須です"),
  email: z.string().email("メールアドレスの形式が正しくありません"),
  company: z.string().optional(),
});

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
```

### 4. Repository 層（データアクセス）

クラスではなく関数エクスポート。現在はモックデータ、将来は DB に差し替える。

```typescript
// lib/repositories/customer.repository.ts
import { Customer } from "@/lib/types/customer";

// 将来: import { db } from "@/lib/db";

export async function findAll(filters?: {
  keyword?: string;
}): Promise<Customer[]> {
  // 現在はモックデータ、将来は DB クエリに差し替え
  // return db.customer.findMany({ where: ... });
  return [];
}

export async function findById(id: string): Promise<Customer | null> {
  return null;
}

export async function create(data: CustomerCreateInput): Promise<Customer> {
  // ...
}

export async function update(id: string, data: Partial<Customer>): Promise<Customer> {
  // ...
}

export async function remove(id: string): Promise<void> {
  // 論理削除
}
```

### 5. Client Components（必要最小限）

`"use client"` はインタラクティブな部分のみ。`_components/` ディレクトリに配置。

```typescript
// app/admin/customers/_components/customers-list.tsx
"use client";

import { useState, useMemo } from "react";
import { Customer } from "@/lib/types/customer";

interface CustomersListProps {
  initialCustomers: Customer[];
}

export function CustomersList({ initialCustomers }: CustomersListProps) {
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    if (!keyword) return initialCustomers;
    const lower = keyword.toLowerCase();
    return initialCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.email.toLowerCase().includes(lower)
    );
  }, [initialCustomers, keyword]);

  return (
    <div>
      {/* フィルターUI */}
      {/* テーブル表示 */}
    </div>
  );
}
```

---

## レイアウトコンポーネント設計

デザイン統一のためのコンポーネント。ルールをコードで強制する。

### FormPage — フォームページの共通レイアウト

```typescript
// components/layout/form-page.tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FormPageProps {
  title: string;
  children: React.ReactNode;
  submitLabel?: string;       // デフォルト: "保存"
  onCancel?: () => void;      // 指定時のみキャンセルボタン表示
  cancelLabel?: string;       // デフォルト: "キャンセル"
}

export function FormPage({
  title,
  children,
  submitLabel = "保存",
  onCancel,
  cancelLabel = "キャンセル",
}: FormPageProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
        <Button type="submit">{submitLabel}</Button>
      </CardFooter>
    </Card>
  );
}
```

これにより以下が自動的に統一される:
- ボタンは常にカード内の右下
- 主要アクションは `variant="default"`（塗りつぶし）
- キャンセルは `variant="outline"`（枠線のみ）
- ボタン間の余白は `gap-2`

### ListPage — 一覧ページの共通レイアウト

```typescript
// components/layout/list-page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ListPageProps {
  title: string;
  children: React.ReactNode;
  createHref?: string;
  createLabel?: string;       // デフォルト: "新規作成"
}

export function ListPage({
  title,
  children,
  createHref,
  createLabel = "新規作成",
}: ListPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        {createHref && (
          <Link href={createHref}>
            <Button>{createLabel}</Button>
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}
```

### DetailPage — 詳細ページの共通レイアウト

```typescript
// components/layout/detail-page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DetailPageProps {
  title: string;
  children: React.ReactNode;
  editHref?: string;
  backHref: string;
}

export function DetailPage({
  title,
  children,
  editHref,
  backHref,
}: DetailPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex gap-2">
          {editHref && (
            <Link href={editHref}>
              <Button variant="outline">編集</Button>
            </Link>
          )}
          <Link href={backHref}>
            <Button variant="outline">戻る</Button>
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
```

---

## テーマ・デザイン統一ルール

### テーマ変数

`globals.css` の CSS 変数でプロジェクト全体のデザインを管理する。
shadcn/ui のデフォルト値をベースに、マルコポーロ用にカスタマイズする。

```css
/* globals.css */
@import "tailwindcss";

@layer base {
  :root {
    --background: ...;
    --foreground: ...;
    --primary: ...;         /* マルコポーロのブランドカラー */
    --primary-foreground: ...;
    --radius: 0.5rem;       /* 角丸の統一値 */
    /* ... */
  }
}
```

### コンポーネント使用ルール

| 場面 | ルール |
|------|--------|
| フォーム送信ボタン | `<Button type="submit">` / `variant="default"` |
| キャンセルボタン | `<Button variant="outline">` |
| 削除ボタン | `<Button variant="destructive">` |
| 一覧の操作ボタン | `<Button variant="outline" size="sm">` |
| カード余白 | shadcn/ui の CardContent デフォルト（`p-6`）を使用 |
| セクション間余白 | `space-y-6` |
| フォーム内余白 | `space-y-4`（フィールド間）、`gap-2`（ラベルとフィールド間） |

### ボタンラベルの統一

| 操作 | ラベル |
|------|--------|
| 新規作成（一覧ページ） | 「新規作成」 or 「新規登録」（エンティティに応じて統一） |
| フォーム送信（新規） | 「作成」 |
| フォーム送信（編集） | 「保存」 |
| フォーム取消 | 「キャンセル」 |
| 削除 | 「削除」 |
| 一覧に戻る | 「戻る」 |

---

## Service 層について

現時点では導入しない。以下のような状況が発生した場合に追加を検討する:

- 複数の Repository をまたぐトランザクション処理が必要になった
- Server Actions のロジックが肥大化してきた（目安: 1ファイル100行超）
- 同じビジネスロジックを複数の Actions から呼び出す必要が出てきた

追加する場合の配置:

```
lib/
├── services/
│   └── customer.service.ts    # Actions → Service → Repository
├── actions/
└── repositories/
```

---

## データフローまとめ

```
[読み取り]
  Server Component
    → Repository（データ取得）
    → _components/（Client Component に渡す）

[書き込み]
  Client Component（フォーム）
    → Server Action（バリデーション + 処理）
    → Repository（データ更新）
    → revalidatePath + redirect
```

---

## Rails/Laravel 経験者向けの対応表

| Rails/Laravel | 本設計 |
|--------------|--------|
| Controller#index | Server Component（page.tsx） |
| Controller#show | Server Component（[id]/page.tsx） |
| Controller#new / #create | Client Component + Server Action |
| Controller#edit / #update | Client Component + Server Action |
| Controller#destroy | Server Action |
| Model (validation) | Zod スキーマ（lib/validations/） |
| Model (data access) | Repository（lib/repositories/） |
| Service Object | 当面不要。必要時に lib/services/ に追加 |
| View template | Server/Client Component |
| `redirect_to` | `redirect()` + `revalidatePath()` |
| `before_action` | Server Action 内 or middleware |

---

## 実装の優先順位

1. **テーマ変数の設計** — globals.css のカスタマイズ、マルコポーロのブランドカラー決定
2. **レイアウトコンポーネントの作成** — FormPage, ListPage, DetailPage
3. **Repository 層の構築** — モックから型定義と関数を移植
4. **Zod スキーマの定義** — 各エンティティのバリデーションルール
5. **Server Actions の実装** — CRUD 操作
6. **ページの実装** — モックを参照しながら product/ に再構築
