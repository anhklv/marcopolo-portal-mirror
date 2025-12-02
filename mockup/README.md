# マルコポーロ 顧客管理・イベント管理システム モックアップ

このディレクトリには、システムのUI/UXを確認するための**モックアップ（プロトタイプ）**が格納されています。
仕様の詳細は `spec/` ディレクトリ内のドキュメントを参照してください。

- [要件定義書](../spec/要件定義書.md): 機能要件の詳細
- [画面設計書](../spec/画面設計書.md): 画面遷移図、UI構成要素

## 🚀 セットアップ・起動方法

### 前提条件
- Node.js 18以上
- npm または yarn

### インストール
```bash
cd mockup
npm install
```

### 開発サーバーの起動
```bash
npm run dev
```
ブラウザで [http://localhost:3000/admin](http://localhost:3000/admin) を開いてください。

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **UIライブラリ**: shadcn/ui (Radix UI + Tailwind CSS)
- **アイコン**: lucide-react
- **通知**: sonner
- **スタイリング**: Tailwind CSS

## 📁 ディレクトリ構造

```
mockup/
├── app/                    # Next.js App Router
│   ├── admin/             # 管理者画面
│   │   ├── customers/     # 顧客管理
│   │   └── events/        # イベント管理
│   └── events/            # ユーザー回答画面
├── components/
│   ├── layout/            # レイアウトコンポーネント（サイドバーなど）
│   └── ui/                # shadcn/uiコンポーネント
├── lib/
│   ├── data/
│   │   └── mock.ts        # ダミーデータ
│   └── utils.ts           # ユーティリティ関数
└── public/                # 静的ファイル
```

## 📝 実装メモ

- **データ永続化**: 現状は `lib/data/mock.ts` のメモリ内データを使用しており、リロードするとリセットされます。
- **認証**: 未実装です。`/admin` へのアクセスは認証なしで可能です。
- **メール送信**: 実際のメール送信は行われず、トースト通知でエミュレートしています。
