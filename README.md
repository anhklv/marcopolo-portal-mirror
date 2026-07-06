# マルコポーロ ポータル

マルコポーロ合同会社の顧客管理・イベント管理システムです。  
ベンチャー監査役の会・ないかんMeetup・AI部会の会員・イベント参加者を管理します。

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router) / React 19 / TypeScript |
| UI | shadcn/ui / Tailwind CSS 4 |
| DB | PostgreSQL 17 / Prisma 7 |
| 認証 | Auth.js v5 (next-auth) |
| メール | nodemailer（開発: Mailpit / 本番: Resend） |
| ホスティング | Vercel |
| テスト | Vitest |

詳細な実装規約は [`docs/実装ガイドライン_20260226.md`](docs/実装ガイドライン_20260226.md) を参照してください。

---

## ローカル開発環境のセットアップ（Mac）

アプリ本体は Mac 上で `npm run dev` し、DB とメール確認用の Mailpit だけ Docker で起動します。

### 前提条件

- Node.js 20 以上（CI と同じ）
- Docker Desktop
- npm

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Docker で DB と Mailpit を起動

```bash
docker compose up -d
```

| サービス | 用途 | 接続先 |
|---|---|---|
| PostgreSQL | ローカル DB | `postgresql://postgres:postgres@localhost:5432/marcopolo_portal_dev` |
| Mailpit | メール送信の確認 | SMTP: `localhost:1025` / 管理画面: http://localhost:8025 |

### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、`AUTH_SECRET` を設定します。

```bash
cp .env.example .env
npx auth secret   # 出力された値を .env の AUTH_SECRET に貼り付け
```

他の項目は `.env.example` のデフォルト値のままで動作します。

### 4. DB のマイグレーションとシード

```bash
npm run db:migrate
npm run db:seed
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000/admin にアクセスします。

#### シードデータの管理者アカウント

| メールアドレス | パスワード | 権限 |
|---|---|---|
| `admin@example.com` | `rara6y` | 特権管理者 |
| `kansa@example.com` | `rara6y` | コミュニティ管理者（ベンチャー監査役の会） |
| `naikan@example.com` | `rara6y` | コミュニティ管理者（ないかんMeetup） |
| `ai@example.com` | `rara6y` | コミュニティ管理者（AI部会） |
| `all@example.com` | `rara6y` | コミュニティ管理者（全コミュニティ） |

### 6. メール送信の確認（ローカル）

案内メール・リマインド・アンケート送信などは、デフォルトで Mailpit に届きます。実メールは送信されません。

- 管理画面: http://localhost:8025
- SMTP: `localhost:1025`（`MAIL_PROVIDER=mailpit` がデフォルト）

---

## 開発用コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run tsc` | 型チェック |
| `npm run lint` | ESLint |
| `npm run test:run` | テスト実行 |
| `npm run build` | 本番ビルド |
| `npm run db:migrate` | Prisma マイグレーション |
| `npm run db:seed` | シードデータ投入 |
| `npm run db:studio` | Prisma Studio 起動 |

改修時は `npm run tsc` と `npm run lint` を通す運用です。コミット前は `npm run test:run` と `npm run build` も実行します。

---

## `_archive` について

`_archive/mockup/` は、開発初期にクライアントへ仕様確認してもらった **旧モックアップ** です。

| 項目 | 内容 |
|---|---|
| 現在の用途 | **参照用アーカイブ**（本番アプリの起動には使わない） |
| UI の正 | 現行アプリ（プロジェクト直下の `app/`）が正。UI は原則このモックを踏襲して実装済み |
| データ | `lib/data/mock.ts` のメモリ内データ。リロードでリセットされる |
| デプロイ | 旧 Cloud Run 向けの GitHub Actions（`.github/workflows/deploy.yml`）が残っているが、`if: false` で無効化済み |

新機能の開発はプロジェクト直下で行い、`_archive` は画面・コンポーネントの参照や仕様確認のために見る程度で十分です。

---

## リリース方法

Vercel と GitHub を連携しており、**ブランチへの push で自動デプロイ**されます。

| ブランチ | 環境 | URL |
|---|---|---|
| `staging` | ステージング | https://staging.marcopolo-portal.jp/admin |
| `main` | 本番 | https://marcopolo-portal.jp/admin |

### 開発フロー

1. 機能ブランチを `staging` から作成して開発
2. `staging` へ PR を作成・マージ → ステージングに自動デプロイ
3. ステージングで動作確認
4. `main` へ PR を作成・マージ → 本番に自動デプロイ

`staging` ブランチへの push / PR では GitHub Actions（`.github/workflows/ci.yml`）で `tsc` / `lint` / `test` / `build` が実行されます。

### ステージングのメール確認（Mailpit）

ステージングから送信したメールは、参加者の実メールアドレスには届きません。専用の Mailpit 管理画面で内容を確認します。

| 項目 | 内容 |
|---|---|
| 管理画面 URL | http://153.127.63.69:8025 |
| Basic認証 ID | `marcopolo` |
| Basic認証 パスワード | `marcopolo_2025` |

本番（`main`）では Resend 経由で実際のメールが送信されます。本番でのメール送信テストは慎重に行ってください。

### 環境変数について

Vercel の各環境（Production / Preview）に環境変数が設定されています。主な項目:

| 変数 | 用途 |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL 接続 |
| `AUTH_SECRET` | 認証セッション署名 |
| `MAIL_PROVIDER` | `resend`（本番）/ `mailpit`（ステージング） |
| `RESEND_API_KEY` | 本番メール送信 |
| `SMTP_HOST` / `SMTP_PORT` | ステージングの Mailpit 接続先 |
| `APP_BASE_URL` | メール内リンクのベース URL |
| `DEBUG_ADMIN_PANEL` | 開発メニュー・スタイルガイドの表示制御 |

環境変数の変更は Vercel ダッシュボードから行います。

---

## ドキュメント

`docs/` 以下はフェーズ1の開発時に使っていた仕様・設計資料です。**参考程度**にご覧ください。ドキュメントと実装が食い違う場合は、コードを正とします。

| ドキュメント | 内容 |
|---|---|
| [`docs/要件定義書.md`](docs/要件定義書.md) | 機能要件 |
| [`docs/画面設計書.md`](docs/画面設計書.md) | 画面遷移・UI 構成 |
| [`docs/実装ガイドライン_20260226.md`](docs/実装ガイドライン_20260226.md) | 実装規約 |
| [`docs/アーキテクチャ設計_20260221.md`](docs/アーキテクチャ設計_20260221.md) | アーキテクチャ |
| [`docs/ページ実装完了リスト_20260220.md`](docs/ページ実装完了リスト_20260220.md) | 実装状況（フェーズ1時点） |
| [`docs/サーバー構成_20260128.md`](docs/サーバー構成_20260128.md) | インフラ構成 |
| [`docs/plans/`](docs/plans/) | フェーズ1の実装計画 |

---

## ディレクトリ構成（概要）

```
marcopolo-portal/
├── _archive/mockup/     # 旧モックアップ（参照用）
├── app/                 # Next.js App Router
├── components/          # UI・レイアウトコンポーネント
├── lib/                 # Server Actions, repositories, validations 等
├── prisma/              # DB スキーマ・マイグレーション
├── __tests__/           # Vitest テスト
├── docs/                # 仕様・設計ドキュメント
└── docker-compose.yml   # PostgreSQL + Mailpit
```
