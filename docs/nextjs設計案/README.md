# Next.js設計案

このディレクトリには、Next.js App Routerを使ったシステム設計の2つの案をまとめています。

## 設計案一覧

### 01-Rails-Laravel経験者向け設計案.md

Rails/LaravelのMVC + Service層パターンに慣れ親しんだ開発者にとって理解しやすい設計パターンです。

**特徴**:
- Model層、Repository層、Service層、Controller層が明確に分離
- Rails/Laravelの経験を活かしやすい
- API Routesを活用したREST API設計

**適用シーン**:
- Rails/Laravel経験者がメインのチーム
- 既存のRails/Laravelアプリケーションからの移行
- REST APIを外部に公開する必要がある場合

### 02-Next.jsベストプラクティス設計案.md

Next.js App Routerのベストプラクティスに完全に準拠した設計パターンです。

**特徴**:
- Server Componentsをデフォルトで使用
- Server Actionsでフォーム処理
- Client Componentsは必要最小限のみ
- パフォーマンスが最適化される

**適用シーン**:
- Next.jsの最新機能を最大限活用したい場合
- パフォーマンスを最優先したい場合
- モダンなReact開発パターンを採用したい場合

## 比較表

| 項目 | Rails/Laravel向け設計案 | Next.jsベストプラクティス設計案 |
|------|------------------------|-------------------------------|
| **データ取得** | API Routes経由 | Server Componentsで直接 |
| **フォーム処理** | API Routes + fetch | Server Actions |
| **キャッシュ管理** | 手動 | `revalidatePath`で自動 |
| **初期ロード** | クライアント側で取得 | サーバー側でレンダリング |
| **バンドルサイズ** | 大きめ | 小さめ（Server Components） |
| **学習コスト** | Rails/Laravel経験者には低い | Next.js特有の概念を理解する必要 |
| **パフォーマンス** | 良好 | 最適化されている |

## 推奨

**現時点での推奨**: **02-Next.jsベストプラクティス設計案**

理由:
1. Next.js App Routerの最新機能を最大限活用できる
2. パフォーマンスが最適化される
3. 将来的な拡張性が高い
4. Next.jsコミュニティのベストプラクティスに沿っている

ただし、チームの経験や要件に応じて、01の設計案を選択することも可能です。

## 実装の進め方

どちらの設計案を選ぶ場合でも、以下の順序で実装を進めることを推奨します：

1. **Service層の追加**
   - ビジネスロジックをページコンポーネントから分離
   - 再利用可能なロジックを集約

2. **Repository層の追加**
   - データアクセスを抽象化
   - 将来のDB導入に備える

3. **Server Actions / API Routesの追加**
   - フォーム処理を改善
   - データ更新処理を分離

4. **段階的なリファクタリング**
   - 既存のコードを少しずつ新しい構造に移行
   - 一度にすべてを変更しない

## 参考資料

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

