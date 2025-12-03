# マルコポーロ 顧客管理・イベント管理システム モックアップ

このディレクトリには、システムのUI/UXを確認するための**モックアップ（プロトタイプ）**が格納されています。
仕様の詳細は `spec/` ディレクトリ内のドキュメントを参照してください。

- [要件定義書](../spec/要件定義書.md): 機能要件の詳細
- [画面設計書](../spec/画面設計書.md): 画面遷移図、UI構成要素

## 🚀 セットアップ・起動方法

### 前提条件
- Node.js 24.9.0（Cloud Run本番と同じバージョン）
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
- **認証**: `middleware.ts` でBasic認証を実装。`NODE_ENV=production` または `BASIC_AUTH_ENABLED=true` のときのみ有効で、ローカル開発では自動的に無効になります。認証情報は環境変数（`BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD`）から取得され、未設定の場合はエラーを返します。
- **メール送信**: 実際のメール送信は行われず、トースト通知でエミュレートしています。

## 🚢 Google Cloud Run へのデプロイ

### GitHub Actions による自動デプロイ（推奨）

本システムは **GitHub Actions による自動デプロイ**が設定されています。

#### デプロイの流れ

1. **トリガー**: `main` ブランチへの push またはマージ
2. **ワークフロー**: `.github/workflows/deploy.yml` が自動実行
3. **ビルド**: `cloudbuild.yaml` を使用してDockerイメージをビルド
4. **プッシュ**: Artifact Registry にイメージをプッシュ
5. **デプロイ**: Cloud Run に最新イメージをデプロイ

#### 必要な設定

GitHubリポジトリのシークレットに以下を設定してください：

- **`GCP_CREDENTIALS`**: Google Cloud サービスアカウントのJSONキー（全体）
- **`BASIC_AUTH_USER`**: Basic認証のユーザー名（オプション、デフォルト: `marcopolo`）
- **`BASIC_AUTH_PASSWORD`**: Basic認証のパスワード（オプション、デフォルト: `marcopolo_2025`）

#### デプロイ後の確認

デプロイが成功すると、GitHub ActionsのログにService URLが表示されます：

```
Service URL: https://marcopolo-mockup-671631815586.asia-northeast1.run.app
```

ブラウザでアクセスして動作確認してください。

CLIでBasic認証の挙動を確認する場合：

```bash
# 認証なし: 401が返る
curl -I https://marcopolo-mockup-671631815586.asia-northeast1.run.app/admin

# 認証あり: 200が返る
curl -I -u marcopolo:marcopolo_2025 \
  https://marcopolo-mockup-671631815586.asia-northeast1.run.app/admin
```

### 手動デプロイ（補足）

GitHub Actionsが利用できない場合や、緊急時の手動デプロイが必要な場合のみ使用してください。

#### 前提条件

- Google Cloud SDK (`gcloud`) がインストールされていること
- サービスアカウントキー（JSONファイル）が用意されていること
- プロジェクトID: `sandbox-337508`
- リージョン: `asia-northeast1`

#### 手順

```bash
# 1. サービスアカウントでの認証
gcloud auth activate-service-account --key-file=sandbox-337508-3d697bcf25ae.json
gcloud config set project sandbox-337508

# 2. Artifact Registryへのビルドとプッシュ
gcloud builds submit --config cloudbuild.yaml .

# 3. Cloud Run へのデプロイ
gcloud run deploy marcopolo-mockup \
  --image asia-northeast1-docker.pkg.dev/sandbox-337508/marcopolo-mockup/marcopolo-mockup \
  --region asia-northeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars "BASIC_AUTH_ENABLED=true,BASIC_AUTH_USER=marcopolo,BASIC_AUTH_PASSWORD=marcopolo_2025"
```

**Basic認証設定**:
- `BASIC_AUTH_ENABLED=true`: Basic認証を有効化
- `BASIC_AUTH_USER=marcopolo`: 認証ID（環境変数から取得、未設定時はエラー）
- `BASIC_AUTH_PASSWORD=marcopolo_2025`: 認証パスワード（環境変数から取得、未設定時はエラー）

**注意**: 環境変数は一度設定するとCloud Runサービスに保存され、以降のデプロイでも引き継がれます。変更したい場合は `--update-env-vars` を使用してください。

### 注意事項

- **デプロイ方法**: 通常はGitHub Actionsによる自動デプロイを使用してください。`main` ブランチへの push で自動的にデプロイされます
- **環境変数**: Dockerfileで `SPEC_DIR=/app/spec` が設定されており、Markdownファイルは `/app/spec` から読み込まれます
- **Basic認証**: 本番環境（Cloud Run）ではBasic認証が有効になっています。認証情報は環境変数（`BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD`）から取得されます
- **開発環境**: ローカル開発環境（`npm run dev`）ではBasic認証は無効です
- **ビルド時間**: 初回ビルドは5-10分程度かかることがあります
- **コスト**: Cloud Run は従量課金制です。無料枠の範囲内であれば費用はかかりません
