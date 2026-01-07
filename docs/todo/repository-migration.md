# Repository層への移行タスク

## 優先順位1: 型定義の分離

### 1.1 型定義ファイルの作成
- [x] `mockup/lib/types/customer.ts` を作成
  - [x] `MemberType` 型を移動
  - [x] `MemberFilterValue` 型を移動
  - [x] `MemberCategory` 型を移動
  - [x] `MemberTypeDetail` 型を移動
  - [x] `Customer` 型を移動

- [x] `mockup/lib/types/event.ts` を作成
  - [x] `EventType` 型を移動
  - [x] `Event` 型を移動

- [x] `mockup/lib/types/rsvp.ts` を作成
  - [x] `RSVP` 型を移動

- [x] `mockup/lib/types/survey.ts` を作成
  - [x] `SurveyQuestion` 型を移動
  - [x] `Survey` 型を移動
  - [x] `SurveyResponse` 型を移動
  - [x] `FixedSurveyResponse` 型を移動
  - [x] `SurveyToken` 型を移動

- [x] `mockup/lib/types/index.ts` を作成して全型をエクスポート

### 1.2 mock.tsの更新
- [x] `mock.ts` から型定義を削除
- [x] `mock.ts` で型定義を `@/lib/types` からインポート
- [x] 型定義のインポートが正しく動作するか確認（ビルド成功）

### 1.3 既存ファイルのインポート更新
- [x] Repositoryファイルの型インポートを更新
  - [x] `customer.repository.ts`
  - [x] `event.repository.ts`
  - [x] `rsvp.repository.ts`
- [x] テストページの型インポートを更新
  - [x] `app/admin/repository-test/page.tsx`

---

## 優先順位2: Survey関連Repository実装

### 2.1 SurveyRepositoryの実装
- [x] `mockup/lib/repositories/survey.repository.ts` を作成
  - [x] `ISurveyRepository` インターフェースを定義（必要に応じて）- IRepositoryを使用
  - [x] `SurveyFilters` インターフェースを定義
  - [x] `MockSurveyRepository` クラスを実装
    - [x] `findAll(filters?)` メソッド実装（eventIdでフィルタ可能）
    - [x] `findById(id)` メソッド実装
    - [x] `create(data)` メソッド実装
    - [x] `update(id, data)` メソッド実装
    - [x] `delete(id)` メソッド実装
  - [x] `surveyRepository` インスタンスをエクスポート

### 2.2 SurveyTokenRepositoryの実装
- [x] `mockup/lib/repositories/survey-token.repository.ts` を作成
  - [x] `ISurveyTokenRepository` インターフェースを定義（必要に応じて）- IRepositoryを使用
  - [x] `SurveyTokenFilters` インターフェースを定義
  - [x] `MockSurveyTokenRepository` クラスを実装
    - [x] `findAll(filters?)` メソッド実装（surveyId, customerId, tokenでフィルタ可能）
    - [x] `findById(id)` メソッド実装（使用しない想定）
    - [x] `findByToken(token)` メソッド実装
    - [x] `findBySurveyIdAndCustomerId(surveyId, customerId)` メソッド実装
    - [x] `create(data)` メソッド実装
    - [x] `update(id, data)` メソッド実装
    - [x] `delete(id)` メソッド実装
  - [x] `surveyTokenRepository` インスタンスをエクスポート

### 2.3 SurveyResponseRepositoryの実装
- [x] `mockup/lib/repositories/survey-response.repository.ts` を作成
  - [x] `ISurveyResponseRepository` インターフェースを定義（必要に応じて）- IRepositoryを使用
  - [x] `SurveyResponseFilters` インターフェースを定義
  - [x] `MockSurveyResponseRepository` クラスを実装
    - [x] `findAll(filters?)` メソッド実装（surveyId, customerId, questionId, tokenでフィルタ可能）
    - [x] `findById(id)` メソッド実装（使用しない想定）
    - [x] `findBySurveyId(surveyId)` メソッド実装
    - [x] `findBySurveyIdAndCustomerId(surveyId, customerId)` メソッド実装
    - [x] `create(data)` メソッド実装
    - [x] `update(id, data)` メソッド実装
    - [x] `delete(id)` メソッド実装
  - [x] `surveyResponseRepository` インスタンスをエクスポート

### 2.4 FixedSurveyResponseRepositoryの実装
- [x] `mockup/lib/repositories/fixed-survey-response.repository.ts` を作成
  - [x] `IFixedSurveyResponseRepository` インターフェースを定義（必要に応じて）- IRepositoryを使用
  - [x] `FixedSurveyResponseFilters` インターフェースを定義
  - [x] `MockFixedSurveyResponseRepository` クラスを実装
    - [x] `findAll(filters?)` メソッド実装（surveyId, customerIdでフィルタ可能）
    - [x] `findById(id)` メソッド実装（使用しない想定）
    - [x] `findBySurveyId(surveyId)` メソッド実装
    - [x] `findBySurveyIdAndCustomerId(surveyId, customerId)` メソッド実装
    - [x] `create(data)` メソッド実装
    - [x] `update(id, data)` メソッド実装
    - [x] `delete(id)` メソッド実装
  - [x] `fixedSurveyResponseRepository` インスタンスをエクスポート

### 2.5 Repositoryのエクスポート更新
- [x] `mockup/lib/repositories/index.ts` を更新
  - [x] `surveyRepository` をエクスポート
  - [x] `surveyTokenRepository` をエクスポート
  - [x] `surveyResponseRepository` をエクスポート
  - [x] `fixedSurveyResponseRepository` をエクスポート

### 2.6 ヘルパー関数のRepositoryメソッド化
- [x] `getSurveyByEventId` 関数を `SurveyRepository` のメソッドに統合
  - [x] `surveyRepository.findByEventId(eventId)` メソッドを追加
- [x] `getSurveyByToken` 関数を `SurveyTokenRepository` のメソッドに統合
  - [x] `surveyTokenRepository.findByToken(token)` で対応可能（実装済み）
- [x] `getSurveyResponses` 関数を `SurveyResponseRepository` のメソッドに統合
  - [x] `surveyResponseRepository.findBySurveyId(surveyId)` で対応可能（実装済み）
- [x] `getFixedSurveyResponses` 関数を `FixedSurveyResponseRepository` のメソッドに統合
  - [x] `fixedSurveyResponseRepository.findBySurveyId(surveyId)` で対応可能（実装済み）
- [x] `hasResponded` 関数を `SurveyResponseRepository` のメソッドに統合
  - [x] `surveyResponseRepository.hasResponded(surveyId, customerId)` メソッドを追加

---

## 優先順位3: ヘルパー関数の移行

### 3.1 getEventStatusの移行
- [ ] `EventRepository` に `getStatus(event: Event)` メソッドを追加
  - [ ] `mockup/lib/repositories/event.repository.ts` にメソッド追加
  - [ ] 既存の `getEventStatus` 関数のロジックを移行
- [ ] `mock.ts` から `getEventStatus` 関数を削除
- [ ] 使用箇所を `eventRepository.getStatus()` に置き換え
  - [ ] `app/admin/page.tsx`
  - [ ] `app/admin/events/page.tsx`
  - [ ] `app/admin/events/[id]/page.tsx`
  - [ ] `app/admin/events/[id]/invite/page.tsx`
  - [ ] `app/admin/events/[id]/remind/page.tsx`
  - [ ] `app/admin/events/[id]/survey/page.tsx`

### 3.2 getCustomerByTokenの移行
- [ ] `RSVPRepository` に `findCustomerByToken(eventId, token)` メソッドを追加
  - [ ] `mockup/lib/repositories/rsvp.repository.ts` にメソッド追加
  - [ ] 既存の `getCustomerByToken` 関数のロジックを移行
- [ ] `mock.ts` から `getCustomerByToken` 関数を削除
- [ ] 使用箇所を `rsvpRepository.findCustomerByToken()` に置き換え
  - [ ] `app/events/[id]/rsvp/page.tsx`

### 3.3 getRSVPByEmailの移行
- [ ] `RSVPRepository` に `findByEventIdAndEmail(eventId, email)` メソッドを追加
  - [ ] `mockup/lib/repositories/rsvp.repository.ts` にメソッド追加
  - [ ] 既存の `getRSVPByEmail` 関数のロジックを移行
- [ ] `mock.ts` から `getRSVPByEmail` 関数を削除
- [ ] 使用箇所を `rsvpRepository.findByEventIdAndEmail()` に置き換え
  - [ ] `app/events/[id]/rsvp/page.tsx`

---

## 優先順位4: ページコンポーネントの移行

### 4.1 管理画面トップページ
- [ ] `app/admin/page.tsx` を更新
  - [ ] `mock.ts` からの直接インポートを削除
  - [ ] Repository層からインポート
  - [ ] データ取得をRepository経由に変更
  - [ ] `getEventStatus` を `eventRepository.getStatus()` に置き換え

### 4.2 顧客一覧ページ
- [ ] `app/admin/customers/page.tsx` を更新
  - [ ] `mock.ts` からの直接インポートを削除
  - [ ] Repository層からインポート
  - [ ] データ取得をRepository経由に変更
  - [ ] フィルタリングロジックをRepositoryのフィルターに置き換え

### 4.3 顧客詳細ページ
- [ ] `app/admin/customers/[id]/page.tsx` を更新
  - [ ] `mock.ts` からの直接インポートを削除
  - [ ] Repository層からインポート
  - [ ] データ取得をRepository経由に変更

### 4.4 顧客編集ページ
- [ ] `app/admin/customers/[id]/edit/page.tsx` を更新
  - [ ] `mock.ts` からの直接インポートを削除
  - [ ] Repository層からインポート
  - [ ] データ取得をRepository経由に変更
  - [ ] 保存処理をRepository経由に変更

### 4.5 イベント一覧ページ
- [ ] `app/admin/events/page.tsx` を更新
  - [ ] `mock.ts` からの直接インポートを削除
  - [ ] Repository層からインポート
  - [ ] データ取得をRepository経由に変更
  - [ ] `getEventStatus` を `eventRepository.getStatus()` に置き換え

### 4.6 イベント新規作成ページ
- [ ] `app/admin/events/new/page.tsx` を更新
  - [ ] `mock.ts` からの直接インポートを削除（型定義のみ）
  - [ ] Repository層からインポート
  - [ ] 保存処理をRepository経由に変更

### 4.7 イベント詳細ページ
- [ ] `app/admin/events/[id]/page.tsx` を更新
  - [ ] `mock.ts` からの直接インポートを削除
  - [ ] Repository層からインポート
  - [ ] データ取得をRepository経由に変更
  - [ ] `getEventStatus` を `eventRepository.getStatus()` に置き換え
  - [ ] Survey関連の関数をRepositoryメソッドに置き換え

### 4.8 イベント編集ページ
- [ ] `app/admin/events/[id]/edit/page.tsx` を更新
  - [ ] `mock.ts` からの直接インポートを削除（型定義のみ）
  - [ ] Repository層からインポート
  - [ ] データ取得をRepository経由に変更
  - [ ] 保存処理をRepository経由に変更

### 4.9 イベント招待ページ
- [ ] `app/admin/events/[id]/invite/page.tsx` を更新
  - [ ] `mock.ts` からの直接インポートを削除
  - [ ] Repository層からインポート
  - [ ] データ取得をRepository経由に変更
  - [ ] `getEventStatus` を `eventRepository.getStatus()` に置き換え

### 4.10 イベントリマインダーページ
- [ ] `app/admin/events/[id]/remind/page.tsx` を更新
  - [ ] `mock.ts` からの直接インポートを削除
  - [ ] Repository層からインポート
  - [ ] データ取得をRepository経由に変更
  - [ ] `getEventStatus` を `eventRepository.getStatus()` に置き換え

### 4.11 イベントアンケートページ
- [ ] `app/admin/events/[id]/survey/page.tsx` を更新
  - [ ] `mock.ts` からの直接インポートを削除
  - [ ] Repository層からインポート
  - [ ] データ取得をRepository経由に変更
  - [ ] `getEventStatus` を `eventRepository.getStatus()` に置き換え
  - [ ] Survey関連の関数をRepositoryメソッドに置き換え

### 4.12 アンケート作成ページ
- [ ] `app/admin/events/[id]/survey/create/page.tsx` を更新
  - [ ] `mock.ts` からの直接インポートを削除（型定義のみ）
  - [ ] Repository層からインポート
  - [ ] データ取得をRepository経由に変更
  - [ ] 保存処理をRepository経由に変更

### 4.13 アンケート結果ページ
- [ ] `app/admin/events/[id]/survey/results/page.tsx` を更新
  - [ ] `mock.ts` からの直接インポートを削除
  - [ ] Repository層からインポート
  - [ ] データ取得をRepository経由に変更
  - [ ] Survey関連の関数をRepositoryメソッドに置き換え

### 4.14 RSVPページ
- [ ] `app/events/[id]/rsvp/page.tsx` を更新
  - [ ] `mock.ts` からの直接インポートを削除
  - [ ] Repository層からインポート
  - [ ] データ取得をRepository経由に変更
  - [ ] `getCustomerByToken` を `rsvpRepository.findCustomerByToken()` に置き換え
  - [ ] `getRSVPByEmail` を `rsvpRepository.findByEventIdAndEmail()` に置き換え

### 4.15 アンケート回答ページ
- [ ] `app/events/[id]/survey/[token]/page.tsx` を更新
  - [ ] `mock.ts` からの直接インポートを削除
  - [ ] Repository層からインポート
  - [ ] データ取得をRepository経由に変更
  - [ ] `getSurveyByToken` を `surveyTokenRepository.findByToken()` に置き換え
  - [ ] `hasResponded` を `surveyResponseRepository.hasResponded()` に置き換え
  - [ ] Survey関連の関数をRepositoryメソッドに置き換え

### 4.16 各ページの動作確認
- [ ] 各ページでビルドエラーがないか確認
- [ ] 各ページでブラウザでの動作確認
- [ ] データの表示が正しいか確認
- [ ] フィルタリングが正しく動作するか確認

---

## 優先順位5: ビジネスロジック関数の整理

### 5.1 ユーティリティファイルの作成
- [ ] `mockup/lib/utils/customer.ts` を作成
  - [ ] `getMemberTypeDisplayName` 関数を移動
  - [ ] `isMember` 関数を移動
  - [ ] `hasMemberType` 関数を移動

### 5.2 mock.tsの更新
- [ ] `mock.ts` からビジネスロジック関数を削除
- [ ] `mock.ts` でユーティリティ関数をインポート（必要に応じて）

### 5.3 使用箇所のインポート更新
- [ ] `app/admin/customers/page.tsx` のインポートを更新
- [ ] その他の使用箇所のインポートを更新

---

## 優先順位6: Server Component対応

### 6.1 既存Server ComponentのRepository移行
- [ ] `app/admin/page.tsx` を確認
  - [ ] 既にServer Componentであることを確認（"use client"がない）
  - [ ] Repository層を使用するように更新
  - [ ] 非同期データ取得を実装

### 6.2 詳細ページのServer Component化検討
- [ ] `app/admin/customers/[id]/page.tsx` を検討
  - [ ] 現在のClient Component機能を確認
  - [ ] Server Component化可能か判断
  - [ ] 可能な場合は、データ取得部分をServer Componentに分離
  - [ ] インタラクティブな部分はClient Componentとして分離

- [ ] `app/admin/events/[id]/page.tsx` を検討
  - [ ] 現在のClient Component機能を確認
  - [ ] Server Component化可能か判断
  - [ ] 可能な場合は、データ取得部分をServer Componentに分離
  - [ ] インタラクティブな部分はClient Componentとして分離

- [ ] `app/admin/events/[id]/survey/results/page.tsx` を検討
  - [ ] 現在のClient Component機能を確認
  - [ ] Server Component化可能か判断
  - [ ] 可能な場合は、データ取得部分をServer Componentに分離

### 6.3 一覧ページのServer Component化検討
- [ ] `app/admin/events/page.tsx` を検討
  - [ ] 現在のClient Component機能を確認（フィルタリング、検索など）
  - [ ] フィルタリングをURLパラメータベースに変更可能か検討
  - [ ] 可能な場合は、Server Component + URLパラメータで実装
  - [ ] インタラクティブな部分はClient Componentとして分離

### 6.4 フォームページの対応
- [ ] 編集・新規作成ページはClient Componentのまま
  - [ ] `app/admin/customers/[id]/edit/page.tsx` - Client Component維持
  - [ ] `app/admin/customers/new/page.tsx` - Client Component維持
  - [ ] `app/admin/customers/new-20251226/page.tsx` - Client Component維持
  - [ ] `app/admin/events/new/page.tsx` - Client Component維持
  - [ ] `app/admin/events/[id]/edit/page.tsx` - Client Component維持
  - [ ] `app/admin/events/[id]/invite/page.tsx` - Client Component維持
  - [ ] `app/admin/events/[id]/remind/page.tsx` - Client Component維持
  - [ ] `app/admin/events/[id]/survey/page.tsx` - Client Component維持
  - [ ] `app/admin/events/[id]/survey/create/page.tsx` - Client Component維持
  - [ ] `app/events/[id]/rsvp/page.tsx` - Client Component維持
  - [ ] `app/events/[id]/survey/[token]/page.tsx` - Client Component維持

### 6.5 Server Component化の実装パターン
- [ ] Server Component + Client Componentの分離パターンを実装
  - [ ] データ取得はServer Componentで実行
  - [ ] インタラクティブな部分は別のClient Componentとして分離
  - [ ] Server ComponentからClient Componentにpropsでデータを渡す

### 6.6 パフォーマンス最適化
- [ ] Server Component化したページで以下を確認
  - [ ] 初期ロード時のJavaScriptバンドルサイズが削減されているか
  - [ ] データ取得がサーバー側で実行されているか
  - [ ] 不要なクライアントサイドJavaScriptが削減されているか

### 6.7 テストページの対応
- [ ] `app/admin/repository-test/page.tsx` を検討
  - [ ] テスト用途のためClient Componentのままでも可
  - [ ] または、Server Component化してRepositoryの動作確認

---

## 完了後の確認事項

- [ ] すべてのページで `mock.ts` からの直接インポートがなくなっているか確認
- [ ] ビルドが正常に通るか確認
- [ ] すべてのページでブラウザでの動作確認
- [ ] Repository層のREADMEを更新（Survey関連のRepositoryを追加）
- [ ] テストページ（`app/admin/repository-test/page.tsx`）を更新してSurvey関連のRepositoryもテスト

---

## 注意事項

- 各タスクを完了したら、該当するチェックボックスにチェックを入れる
- **各優先順位のタスクが完了したら、必ずビルドとブラウザでの動作確認を行う**
- 問題が発生した場合は、TODOリストにメモを追加する
- **質問された場合はコードを書かず、回答のみを行う**

## 必須ブラウザテストURL

各優先順位のタスク完了後、以下のURLで必ずブラウザテストを実施すること：

- http://localhost:3000/admin/customers
- http://localhost:3000/admin/customers/C001
- http://localhost:3000/admin/customers/C001/edit
- http://localhost:3000/admin/events
- http://localhost:3000/admin/events/E010
- http://localhost:3000/admin/events/E001/edit
- http://localhost:3000/admin/events/E001/survey/create
- http://localhost:3000/events/E005/rsvp?token=demo-token
- http://localhost:3000/events/E005/survey/demo-token
- http://localhost:3000/admin/events/E006

