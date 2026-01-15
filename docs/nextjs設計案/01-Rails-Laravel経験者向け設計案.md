# Rails/Laravel経験者向け設計案

## 概要

Rails/LaravelのMVC + Service層パターンに慣れ親しんだ開発者にとって理解しやすい設計パターンです。

## ディレクトリ構造

```
mockup/
├── app/                          # Next.js App Router (View + ルーティング)
│   ├── admin/
│   │   └── customers/
│   │       └── page.tsx          # ページコンポーネント（View層）
│   └── api/                      # API Routes (Controller層)
│       └── customers/
│           └── route.ts          # REST APIエンドポイント
│
├── lib/
│   ├── models/                   # Model層（型定義 + バリデーション）
│   │   ├── customer.ts
│   │   └── event.ts
│   │
│   ├── repositories/             # Repository層（データアクセス）
│   │   ├── customer.repository.ts
│   │   └── event.repository.ts
│   │
│   ├── services/                 # Service層（ビジネスロジック）
│   │   ├── customer.service.ts
│   │   ├── event.service.ts
│   │   └── email.service.ts
│   │
│   ├── constants/                # 定数（既存）
│   └── utils/                    # ユーティリティ（既存）
│
└── components/                    # UIコンポーネント（既存）
```

## 各層の役割

### 1. Model層 (`lib/models/`)

RailsのActiveRecord、LaravelのEloquentに相当。型定義 + バリデーション + ビジネスルール。

```typescript
// lib/models/customer.ts
export type Customer = {
  id: string;
  name: string;
  email: string;
  // ...
}

export class CustomerModel {
  static validate(data: Partial<Customer>): ValidationResult {
    // バリデーションロジック
    if (!data.email) {
      return { success: false, error: "メールアドレスは必須です" };
    }
    return { success: true };
  }
  
  static getDisplayName(customer: Customer): string {
    // 表示名の生成ロジック
    return `${customer.name} (${customer.company || "個人"})`;
  }
}
```

### 2. Repository層 (`lib/repositories/`)

Railsの`Model.find`、Laravelの`Model::query()`に相当。データアクセスのみを担当。

```typescript
// lib/repositories/customer.repository.ts
export class CustomerRepository {
  static async findAll(filters?: CustomerFilters): Promise<Customer[]> {
    // DB/APIからデータ取得
    // 現在はmock.tsから、将来はDBクエリに置き換え
    return customers.filter(/* フィルタリング */);
  }
  
  static async findById(id: string): Promise<Customer | null> {
    return customers.find(c => c.id === id) || null;
  }
  
  static async create(data: CreateCustomerInput): Promise<Customer> {
    const customer = {
      id: generateId(),
      ...data,
      registeredAt: new Date().toISOString(),
    };
    customers.push(customer);
    return customer;
  }
  
  static async update(id: string, data: UpdateCustomerInput): Promise<Customer> {
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Customer not found");
    
    customers[index] = { ...customers[index], ...data };
    return customers[index];
  }
}
```

### 3. Service層 (`lib/services/`)

RailsのService Object、LaravelのService層に相当。ビジネスロジックを担当。

```typescript
// lib/services/customer.service.ts
import { CustomerRepository } from "@/lib/repositories/customer.repository";
import { CustomerModel } from "@/lib/models/customer";

export class CustomerService {
  static async searchCustomers(params: SearchParams) {
    // 1. Repositoryからデータ取得
    const customers = await CustomerRepository.findAll();
    
    // 2. ビジネスロジック適用
    let filtered = customers;
    
    if (params.keyword) {
      filtered = this.filterByKeyword(filtered, params.keyword);
    }
    
    if (params.memberCategories?.length) {
      filtered = this.filterByMemberCategory(filtered, params.memberCategories);
    }
    
    // 3. フォーマット
    return filtered.map(c => ({
      ...c,
      displayName: CustomerModel.getDisplayName(c),
    }));
  }
  
  static async createCustomer(data: CreateCustomerInput) {
    // バリデーション
    const validation = CustomerModel.validate(data);
    if (!validation.success) {
      throw new Error(validation.error);
    }
    
    // ビジネスルールチェック
    await this.checkDuplicateEmail(data.email);
    
    // Repositoryで保存
    return await CustomerRepository.create(data);
  }
  
  private static filterByKeyword(customers: Customer[], keyword: string) {
    const lowerKeyword = keyword.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(lowerKeyword) ||
      c.company?.toLowerCase().includes(lowerKeyword) ||
      c.email.toLowerCase().includes(lowerKeyword)
    );
  }
  
  private static filterByMemberCategory(
    customers: Customer[],
    categories: string[]
  ) {
    return customers.filter(c => categories.includes(c.memberCategory));
  }
  
  private static async checkDuplicateEmail(email: string) {
    const existing = await CustomerRepository.findByEmail(email);
    if (existing) {
      throw new Error("このメールアドレスは既に登録されています");
    }
  }
}
```

### 4. Controller層

#### API Routesの場合 (`app/api/`)

```typescript
// app/api/customers/route.ts
import { CustomerService } from "@/lib/services/customer.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params = {
    keyword: searchParams.get("keyword") || undefined,
    memberCategories: searchParams.get("memberCategories")?.split(","),
  };
  
  try {
    const customers = await CustomerService.searchCustomers(params);
    return NextResponse.json({ customers });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  
  try {
    const customer = await CustomerService.createCustomer(data);
    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

#### Server Componentの場合 (`app/admin/customers/page.tsx`)

```typescript
// app/admin/customers/page.tsx
import { CustomerService } from "@/lib/services/customer.service";
import { CustomersList } from "@/components/customers-list";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { keyword?: string; memberCategories?: string };
}) {
  const customers = await CustomerService.searchCustomers({
    keyword: searchParams.keyword,
    memberCategories: searchParams.memberCategories?.split(","),
  });
  
  return <CustomersList customers={customers} />;
}
```

## Rails/Laravelとの対応表

| Rails/Laravel | Next.js (この設計案) |
|--------------|---------------------|
| `app/models/` | `lib/models/` |
| `app/services/` | `lib/services/` |
| `app/controllers/` | `app/api/` または `app/**/page.tsx` |
| `app/views/` | `app/**/page.tsx` または `components/` |
| `ActiveRecord.find` | `Repository.findAll()` |
| `Model.create` | `Service.create()` → `Repository.create()` |
| `before_action` | Service層のメソッド内で処理 |
| `validates` | `Model.validate()` |

## メリット

1. **Rails/Laravel経験者にとって理解しやすい**
   - 慣れ親しんだMVC + Service層パターン
   - 責務が明確に分離されている

2. **テストしやすい**
   - 各層を独立してテスト可能
   - Repository層をモック化しやすい

3. **再利用性が高い**
   - Service層をAPI RoutesとServer Componentの両方で使用可能

4. **将来の拡張に強い**
   - DB導入時はRepository層だけ変更すればOK
   - ビジネスロジックはService層に集約されている

## 実装の優先順位

1. **Phase 1**: Service層を追加（ビジネスロジックを分離）
2. **Phase 2**: Repository層を追加（データアクセスを抽象化）
3. **Phase 3**: Model層を追加（バリデーションを集約）

現在の規模では、Service層の追加から始めるのが良いでしょう。

