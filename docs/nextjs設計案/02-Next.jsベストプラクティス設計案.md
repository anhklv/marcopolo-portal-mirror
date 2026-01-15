# Next.jsベストプラクティス設計案

## 概要

Next.js App Routerのベストプラクティスに完全に準拠した設計パターンです。Server ComponentsとServer Actionsを最大限に活用します。

## ディレクトリ構造

```
mockup/
├── app/                              # Next.js App Router
│   ├── admin/
│   │   └── customers/
│   │       ├── page.tsx              # Server Component（データ取得）
│   │       ├── [id]/
│   │       │   ├── page.tsx          # Server Component
│   │       │   └── edit/
│   │       │       └── page.tsx      # Client Component（フォーム）
│   │       └── _components/          # クライアント専用コンポーネント
│   │           ├── customers-list.tsx
│   │           └── customer-filters.tsx
│   │
│   └── api/                          # API Routes（外部連携時のみ）
│       └── customers/
│           └── route.ts              # REST API（必要時のみ）
│
├── lib/
│   ├── actions/                      # Server Actions（Next.js推奨）
│   │   ├── customer.actions.ts
│   │   └── event.actions.ts
│   │
│   ├── data/                         # データアクセス層
│   │   ├── customer.repository.ts
│   │   └── event.repository.ts
│   │
│   ├── services/                     # ビジネスロジック層
│   │   ├── customer.service.ts
│   │   └── event.service.ts
│   │
│   ├── constants/                    # 定数（既存）
│   └── utils/                        # ユーティリティ（既存）
│
└── components/                        # 再利用可能なUIコンポーネント
    └── ui/                           # Shadcn UI（既存）
```

## 各層の役割

### 1. Server Components（デフォルト）

**原則**: すべてのページはデフォルトでServer Component。`"use client"`は必要最小限のみ。

```typescript
// app/admin/customers/page.tsx
// "use client" なし = Server Component

import { CustomerService } from "@/lib/services/customer.service";
import { CustomersList } from "./_components/customers-list";

// Server Componentでデータ取得
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { keyword?: string };
}) {
  // サーバー側で直接データ取得（API Routes不要）
  const customers = await CustomerService.findAll({
    keyword: searchParams.keyword,
  });
  
  // Client Componentに渡すだけ
  return <CustomersList initialCustomers={customers} />;
}
```

**メリット**:
- サーバー側でデータ取得するため、初期ロードが高速
- データベースへの直接アクセスが可能
- バンドルサイズが小さくなる（クライアントに送らない）

### 2. Server Actions（フォーム送信・データ更新）

Next.jsの推奨パターン。RailsのControllerアクションに相当。

```typescript
// lib/actions/customer.actions.ts
"use server";

import { CustomerService } from "@/lib/services/customer.service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCustomer(formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    company: formData.get("company") as string,
    // ...
  };
  
  // バリデーション
  const result = CustomerService.validate(data);
  if (!result.success) {
    return { error: result.error };
  }
  
  // 作成
  const customer = await CustomerService.create(data);
  
  // キャッシュを再検証（Railsのredirect_toに相当）
  revalidatePath("/admin/customers");
  
  // リダイレクト
  redirect(`/admin/customers/${customer.id}`);
}

export async function updateCustomer(id: string, formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    // ...
  };
  
  await CustomerService.update(id, data);
  
  // 関連するパスのキャッシュを再検証
  revalidatePath(`/admin/customers/${id}`);
  revalidatePath("/admin/customers");
  
  redirect(`/admin/customers/${id}`);
}

export async function deleteCustomer(id: string) {
  await CustomerService.delete(id);
  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}
```

**使用例**:

```typescript
// app/admin/customers/new/page.tsx
"use client";

import { createCustomer } from "@/lib/actions/customer.actions";
import { useFormState } from "react-dom";

export default function NewCustomerPage() {
  const [state, formAction] = useFormState(createCustomer, null);
  
  return (
    <form action={formAction}>
      <input name="name" required />
      <input name="email" type="email" required />
      {state?.error && <p className="text-red-500">{state.error}</p>}
      <button type="submit">作成</button>
    </form>
  );
}
```

### 3. Client Components（インタラクティブな部分のみ）

**原則**: インタラクティブな部分（useState、onClick、onChangeなど）のみ`"use client"`を使用。

```typescript
// app/admin/customers/_components/customers-list.tsx
"use client";

import { useState, useMemo } from "react";
import { Customer } from "@/lib/data/mock";
import { CustomerFilters } from "./customer-filters";

interface CustomersListProps {
  initialCustomers: Customer[]; // Server Componentから受け取る
}

export function CustomersList({ initialCustomers }: CustomersListProps) {
  const [filters, setFilters] = useState({
    keyword: "",
    memberCategories: [] as string[],
  });
  
  // フィルタリングはクライアント側で
  const filtered = useMemo(() => {
    let results = initialCustomers;
    
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      results = results.filter(c =>
        c.name.toLowerCase().includes(keyword) ||
        c.company?.toLowerCase().includes(keyword) ||
        c.email.toLowerCase().includes(keyword)
      );
    }
    
    if (filters.memberCategories.length > 0) {
      results = results.filter(c =>
        filters.memberCategories.includes(c.memberCategory)
      );
    }
    
    return results;
  }, [initialCustomers, filters]);
  
  return (
    <div>
      {/* フィルターUI */}
      <CustomerFilters filters={filters} onFilterChange={setFilters} />
      
      {/* リスト表示 */}
      <Table>
        {filtered.map(customer => (
          <TableRow key={customer.id}>
            <TableCell>{customer.name}</TableCell>
            <TableCell>{customer.company}</TableCell>
            {/* ... */}
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
```

### 4. Service層（ビジネスロジック）

```typescript
// lib/services/customer.service.ts
import { CustomerRepository } from "@/lib/data/customer.repository";
import { Customer } from "@/lib/data/mock";

export class CustomerService {
  // データ取得（Repository経由）
  static async findAll(filters?: CustomerFilters): Promise<Customer[]> {
    return CustomerRepository.findAll(filters);
  }
  
  // ビジネスロジック
  static async search(params: SearchParams) {
    const customers = await this.findAll();
    
    // フィルタリングロジック
    let results = customers;
    if (params.keyword) {
      results = this.filterByKeyword(results, params.keyword);
    }
    
    return results;
  }
  
  // バリデーション
  static validate(data: Partial<Customer>) {
    const errors: string[] = [];
    
    if (!data.name) {
      errors.push("氏名は必須です");
    }
    
    if (!data.email) {
      errors.push("メールアドレスは必須です");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("メールアドレスの形式が正しくありません");
    }
    
    return {
      success: errors.length === 0,
      errors,
    };
  }
  
  // 作成
  static async create(data: CreateCustomerInput) {
    const validation = this.validate(data);
    if (!validation.success) {
      throw new Error(validation.errors.join(", "));
    }
    
    // 重複チェック
    const existing = await CustomerRepository.findByEmail(data.email);
    if (existing) {
      throw new Error("このメールアドレスは既に登録されています");
    }
    
    return CustomerRepository.create(data);
  }
  
  private static filterByKeyword(customers: Customer[], keyword: string) {
    const lowerKeyword = keyword.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(lowerKeyword) ||
      c.company?.toLowerCase().includes(lowerKeyword) ||
      c.email.toLowerCase().includes(lowerKeyword)
    );
  }
}
```

### 5. Repository層（データアクセス）

```typescript
// lib/data/customer.repository.ts
import { customers } from "./mock"; // 現在はmock、将来はDB

export class CustomerRepository {
  static findAll(filters?: CustomerFilters): Customer[] {
    // 現在はmockデータから
    // 将来はDBクエリに置き換え
    let results = [...customers];
    
    if (filters?.keyword) {
      const keyword = filters.keyword.toLowerCase();
      results = results.filter(c =>
        c.name.toLowerCase().includes(keyword) ||
        c.company?.toLowerCase().includes(keyword)
      );
    }
    
    return results;
  }
  
  static findById(id: string): Customer | undefined {
    return customers.find(c => c.id === id);
  }
  
  static findByEmail(email: string): Customer | undefined {
    return customers.find(c => c.email === email);
  }
  
  static create(data: CreateCustomerInput): Customer {
    const customer: Customer = {
      id: `C${String(customers.length + 1).padStart(3, "0")}`,
      ...data,
      status: "active",
      registeredAt: new Date().toISOString(),
    };
    customers.push(customer);
    return customer;
  }
  
  static update(id: string, data: UpdateCustomerInput): Customer {
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error("Customer not found");
    }
    
    customers[index] = { ...customers[index], ...data };
    return customers[index];
  }
  
  static delete(id: string): void {
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error("Customer not found");
    }
    
    // 論理削除
    customers[index].status = "inactive";
  }
}
```

## 実装例：顧客一覧ページの完全なリファクタリング

### Server Component（データ取得）

```typescript
// app/admin/customers/page.tsx
import { CustomerService } from "@/lib/services/customer.service";
import { CustomersList } from "./_components/customers-list";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: {
    keyword?: string;
    memberCategories?: string;
  };
}) {
  // Server Componentでデータ取得
  const customers = await CustomerService.findAll({
    keyword: searchParams.keyword,
    memberCategories: searchParams.memberCategories?.split(","),
  });
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">顧客管理</h1>
        <Link href="/admin/customers/new">
          <Button>新規登録</Button>
        </Link>
      </div>
      
      {/* Client Componentに渡す */}
      <CustomersList initialCustomers={customers} />
    </div>
  );
}
```

### Client Component（インタラクティブな部分）

```typescript
// app/admin/customers/_components/customers-list.tsx
"use client";

import { useState, useMemo } from "react";
import { Customer } from "@/lib/data/mock";
import { CustomerFilters } from "./customer-filters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CustomersListProps {
  initialCustomers: Customer[];
}

export function CustomersList({ initialCustomers }: CustomersListProps) {
  const [filters, setFilters] = useState({
    keyword: "",
    memberCategories: [] as string[],
    statuses: ["active"] as string[],
  });
  
  const filtered = useMemo(() => {
    let results = initialCustomers;
    
    // キーワード検索
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      results = results.filter(c =>
        c.name.toLowerCase().includes(keyword) ||
        c.company?.toLowerCase().includes(keyword) ||
        c.email.toLowerCase().includes(keyword)
      );
    }
    
    // 会員区分フィルタ
    if (filters.memberCategories.length > 0) {
      results = results.filter(c =>
        filters.memberCategories.includes(c.memberCategory)
      );
    }
    
    // ステータスフィルタ
    if (filters.statuses.length > 0) {
      results = results.filter(c =>
        filters.statuses.includes(c.status)
      );
    }
    
    return results;
  }, [initialCustomers, filters]);
  
  return (
    <div>
      <CustomerFilters filters={filters} onFilterChange={setFilters} />
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>氏名</TableHead>
            <TableHead>会社名</TableHead>
            <TableHead>会員区分</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(customer => (
            <TableRow key={customer.id}>
              <TableCell>{customer.id}</TableCell>
              <TableCell>{customer.name}</TableCell>
              <TableCell>{customer.company || "-"}</TableCell>
              <TableCell>
                {/* 会員区分の表示 */}
              </TableCell>
              <TableCell>
                <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                  {customer.status === "active" ? "アクティブ" : "非アクティブ"}
                </Badge>
              </TableCell>
              <TableCell>
                <Link href={`/admin/customers/${customer.id}`}>
                  <Button variant="outline" size="sm">詳細</Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

## Next.jsベストプラクティスのポイント

### 1. Server Componentsをデフォルトで使用

- ✅ データ取得はServer Componentで直接
- ✅ API Routesは外部連携時のみ使用
- ✅ 初期ロードが高速（サーバー側でレンダリング）

### 2. Server Actionsでフォーム処理

- ✅ `"use server"`でフォーム送信を処理
- ✅ `revalidatePath`でキャッシュを更新
- ✅ 型安全なフォーム処理

### 3. Client Componentsは必要最小限

- ✅ インタラクティブな部分のみ`"use client"`
- ✅ データ取得はServer Componentで行う
- ✅ バンドルサイズを最小化

### 4. 機能ごとのディレクトリ構造

- ✅ `_components/`でクライアント専用コンポーネントを分離
- ✅ 関連ファイルを同じディレクトリに配置
- ✅ コードの可読性と保守性が向上

## Rails/Laravel経験者向けの対応表

| Rails/Laravel | Next.js App Router |
|--------------|-------------------|
| Controller | Server Component + Server Actions |
| Model | Repository層 |
| Service Object | Service層 |
| View | Server/Client Component |
| Form送信 | Server Actions |
| `redirect_to` | `redirect()` + `revalidatePath()` |
| `before_action` | Server Actions内で処理 |
| `validates` | Service層の`validate()`メソッド |
| API Routes | API Routes（外部連携時のみ） |

## メリット

1. **Next.jsのベストプラクティスに完全準拠**
   - Server Componentsを最大限活用
   - パフォーマンスが最適化される

2. **開発体験が向上**
   - 型安全なServer Actions
   - 自動的なキャッシュ管理

3. **保守性が高い**
   - 責務が明確に分離されている
   - テストしやすい構造

4. **スケーラブル**
   - 機能追加が容易
   - パフォーマンスを維持しやすい

## 実装の優先順位

1. **Phase 1**: Server Actionsを追加（フォーム処理を改善）
2. **Phase 2**: Service層を追加（ビジネスロジックを分離）
3. **Phase 3**: Repository層を追加（データアクセスを抽象化）
4. **Phase 4**: Server Componentsにリファクタリング（パフォーマンス最適化）

現在の規模では、Server ActionsとService層の追加から始めるのが良いでしょう。

