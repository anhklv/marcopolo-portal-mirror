
「gemini案.md」として、これまでの議論を凝縮した推奨構成案をノートにまとめました。
モック運用から本番DBへの移行、そして新機能のプロトタイプ開発までをスムーズに進めるためのガイドとして活用してください。開発を進める中でまた迷うことがあれば、いつでも相談に乗ります！
Google Keep gemini案.mdGemini案：Next.js小規模業務システム推奨構成

1. ディレクトリ構造
リポジトリパターンを軸に、モック運用からMySQL移行までをスムーズにする構成。

src/
├── app/ # 【表示・ルーティング】
│ └── admin/
│ └── customers/
│ ├── page.tsx # サーバーコンポーネント（データ表示）
│ └── actions.ts # 画面専用アクション（バリデーション・Service呼出）
├── services/ # 【業務ロジック】メール送信、複数DB更新の調整
│ └── customer.service.ts
├── repositories/ # 【データアクセス】
│ ├── index.ts # モック/本番の切り替え
│ ├── customer.repository.ts (Interface)
│ ├── customer.mock.ts # 現在の.tsデータ実装
│ └── customer.prisma.ts # 将来のMySQL実装
├── lib/ # 【共通ツール】Prisma、メールクライアント等
└── types/ # 【型定義】エンティティ、共通インターフェース

2. 責務の分担（レイヤー）
表示層 (page.tsx): 画面の構築。データの表示。Repositoryを直接呼んでデータ取得OK
入口層 (actions.ts): バリデーション(Zod等)とエラーハンドリング。Serviceを呼び出す
業務層 (services/): 業務ルール、外部連携（メール等）、複数更新の整合性。Repositoryを操作する
データ層 (repositories/): データの永続化（保存・取得）。外部(DB/File)との通信のみ

3. 運用のポイント
・参照（Read）: 複雑な加工がなければ、page.tsxからRepositoryを直接叩くことで冗長さを排除する。
・更新（Write）: 副作用（メール送信やステータス変更）を伴うため、必ずServiceを経由させる。
・モック混在: 新機能を作る際、repositories/index.tsで特定の機能だけMock実装をエクスポートすることで、DB設計を待たずに開発可能。
・Actionの場所: 各画面フォルダの隣にactions.tsを置く。100行を超えるほど複雑化したら共通化を検討する。


Next.js小規模システム構成ベストプラクティスがgeminiにある
