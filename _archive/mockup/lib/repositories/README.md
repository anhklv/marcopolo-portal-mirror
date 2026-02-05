# Repository層

Repository層は、データアクセスを抽象化するレイヤーです。モック実装とDB実装を同じインターフェースで扱えるようにします。

## 目的

1. **DB設計を後回しにできる**: モック段階ではTypeScriptの型定義だけあればOK
2. **移行がスムーズ**: DB導入時はRepositoryの実装だけ変更すれば、アプリケーション側は変更不要
3. **テストしやすい**: モックと実DBを簡単に切り替え可能

## 構造

```
lib/repositories/
├── base.repository.ts      # ベースインターフェース
├── customer.repository.ts  # 顧客Repository
├── event.repository.ts    # イベントRepository
├── rsvp.repository.ts      # RSVP Repository
└── index.ts               # エクスポート
```

## 使用方法

### 基本的な使い方

```typescript
import { customerRepository, eventRepository, rsvpRepository } from "@/lib/repositories";

// すべての顧客を取得
const customers = await customerRepository.findAll();

// IDで顧客を取得
const customer = await customerRepository.findById("C001");

// フィルター付きで検索
const filteredCustomers = await customerRepository.findAll({
  keyword: "山田",
  memberCategories: ["member"],
  statuses: ["active"],
});

// 新しい顧客を作成
const newCustomer = await customerRepository.create({
  name: "新規顧客",
  email: "new@example.com",
  memberCategory: "member",
  memberTypes: ["ベンチャー監査役の会"],
});

// 顧客を更新
const updated = await customerRepository.update("C001", {
  name: "更新された名前",
});

// 顧客を削除（論理削除）
await customerRepository.delete("C001");
```

### イベントの操作

```typescript
import { eventRepository } from "@/lib/repositories";

// すべてのイベントを取得
const events = await eventRepository.findAll();

// フィルター付きで検索
const openEvents = await eventRepository.findAll({
  status: "open",
  eventType: "ベンチャー監査役の会",
});

// イベントを作成
const newEvent = await eventRepository.create({
  title: "新しいイベント",
  date: "2024-12-31T18:00:00+09:00",
  location: "東京",
  description: "説明",
  eventType: "ベンチャー監査役の会",
});
```

### RSVPの操作

```typescript
import { rsvpRepository } from "@/lib/repositories";

// イベントのRSVPを取得
const eventRsvps = await rsvpRepository.findAll({
  eventId: "E001",
});

// 顧客のRSVPを取得
const customerRsvps = await rsvpRepository.findAll({
  customerId: "C001",
});

// トークンでRSVPを取得
const rsvp = await rsvpRepository.findByToken("token-xxx");

// RSVPを作成
const newRsvp = await rsvpRepository.create({
  eventId: "E001",
  customerId: "C001",
  status: "attending",
  attendanceType: "通常参加",
});

// RSVPを更新
await rsvpRepository.update("", {
  eventId: "E001",
  customerId: "C001",
  status: "attending",
  respondedAt: new Date().toISOString(),
});
```

## 移行戦略

### Phase 1: モック段階（現在）

- TypeScriptの型定義のみ
- Repository層でモックデータを返す
- アプリケーション側はRepository経由でデータアクセス

### Phase 2: DB導入時

1. Prismaスキーマを作成（型定義に合わせて）
2. Repositoryの実装をDB実装に変更
3. アプリケーション側は変更不要

```typescript
// lib/repositories/customer.repository.ts
// モック実装からDB実装に変更

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

class DBCustomerRepository implements IRepository<Customer> {
  async findAll(filters?: CustomerFilters): Promise<Customer[]> {
    return await prisma.customer.findMany({
      where: {
        // filtersをPrismaのwhere句に変換
      },
    });
  }
  // ...
}

export const customerRepository = new DBCustomerRepository();
```

## 注意事項

- **RSVPは複合キー**: `findById`は使用せず、`findByEventIdAndCustomerId`や`findByToken`を使用
- **モック実装ではデータが変更される**: 実際のモックデータ配列を直接変更するため、リロードすると元に戻る
- **非同期処理**: すべてのメソッドは`Promise`を返す（将来的なDB実装に備えて）

