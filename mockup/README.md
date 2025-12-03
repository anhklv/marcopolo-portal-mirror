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

## 🚢 Google Cloud Run へのデプロイ

### 前提条件

- Google Cloud SDK (`gcloud`) がインストールされていること
- サービスアカウントキー（JSONファイル）が用意されていること
- プロジェクトID: `sandbox-337508`
- リージョン: `asia-northeast1`

### デプロイ手順

#### 1. サービスアカウントでの認証

```bash
# プロジェクトルートディレクトリから実行
gcloud auth activate-service-account --key-file=sandbox-337508-3d697bcf25ae.json
gcloud config set project sandbox-337508
```

#### 2. ビルドとプッシュ

```bash
# プロジェクトルートディレクトリから実行
gcloud builds submit --config cloudbuild.yaml .
```

このコマンドで以下が実行されます：
- Dockerイメージのビルド（`mockup/Dockerfile` を使用）
- Container Registry へのプッシュ（`gcr.io/sandbox-337508/marcopolo-mockup`）

#### 3. Cloud Run へのデプロイ

```bash
gcloud run deploy marcopolo-mockup \
  --image gcr.io/sandbox-337508/marcopolo-mockup \
  --region asia-northeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars "BASIC_AUTH_ENABLED=true,BASIC_AUTH_USER=marcopolo,BASIC_AUTH_PASSWORD=marcopolo_2025"
```

**Basic認証設定**:
- `BASIC_AUTH_ENABLED=true`: Basic認証を有効化
- `BASIC_AUTH_USER=marcopolo`: 認証ID
- `BASIC_AUTH_PASSWORD=marcopolo_2025`: 認証パスワード

#### 4. 公開アクセスの設定（初回のみ）

サービスアカウントに適切な権限がある場合、デプロイ時に自動的に設定されます。
もし403エラーが出る場合は、以下のコマンドで手動設定：

```bash
gcloud run services add-iam-policy-binding marcopolo-mockup \
  --region=asia-northeast1 \
  --member=allUsers \
  --role=roles/run.invoker
```

### デプロイ後の確認

デプロイが成功すると、以下のようなService URLが表示されます：

```
Service URL: https://marcopolo-mockup-671631815586.asia-northeast1.run.app
```

ブラウザでアクセスして動作確認してください。

### 注意事項

- **環境変数**: Dockerfileで `SPEC_DIR=/app/spec` が設定されており、Markdownファイルは `/app/spec` から読み込まれます
- **Basic認証**: 本番環境（Cloud Run）ではBasic認証が有効になっています。ID: `marcopolo`, PW: `marcopolo_2025`
- **開発環境**: ローカル開発環境（`npm run dev`）ではBasic認証は無効です
- **ビルド時間**: 初回ビルドは5-10分程度かかることがあります
- **コスト**: Cloud Run は従量課金制です。無料枠の範囲内であれば費用はかかりません
