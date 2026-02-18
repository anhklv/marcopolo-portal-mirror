# DB設計改善：VARCHARカラムのENUM化検討

## 1. 背景・課題

- 現在、`listing_category`（上場区分）や `origin_industry`（出身業種）などが `VARCHAR`（自由入力文字列）として定義されている。
- アプリケーション側（`constants.ts`）では定数リストとして管理されているが、DBレベルでの制約がないため、定義外の不正な文字列が保存されるリスクがある。
- 一方で、`gender`（性別）などは `ENUM` で管理されており、設計思想が一貫していない（ダブルスタンダード状態）。
- データの整合性と堅牢性を高めるため、選択肢が固定的である項目については `ENUM` 化を検討する。

## 2. 検討対象のカラム

以下の5項目は、国の制度や会の規約に基づくものであり、頻繁に変更されるものではないため、検討対象とする。

1.  **上場区分** (`listing_category`)
2.  **出身業種** (`origin_industry`)
3.  **入会資格** (`membership_qualification`)
4.  **都道府県** (`prefecture`)
5.  **所属** (`affiliation` / ないかんMeetup・AI部会用)

## 3. 比較検討

| 管理手法 | 特徴 | メリット | デメリット |
| :--- | :--- | :--- | :--- |
| **VARCHAR** (現状) | 文字列として保存 | アプリ側の変更だけで選択肢を増やせる（柔軟性が高い）。 | DBに不正な値が入るリスクがある。<br>型安全性が低い。<br>表記揺れが発生しやすい。 |
| **ENUM** (提案) | DB型として定義 | **データの整合性が保証される**。<br>TypeScriptの型安全性が高い。<br>DBを見るだけで意味が分かる。 | 選択肢の追加・変更時にDBマイグレーションが必要。<br>PostgreSQLでは値の削除ができない。 |
| **Master Table** | 別テーブルで管理 | 管理画面等で動的に選択肢を増減できる。<br>メタデータ（表示順など）を持たせやすい。 | テーブル結合が必要でクエリが少し複雑になる。<br>単純な区分値にはオーバーエンジニアリングになる場合がある。 |

## 4. 結論の方向性

- 対象の5項目については、選択肢が安定的であり、データの品質担保が優先されるため、**`ENUM` 化を採用する方向で検討**。
- これにより、DBレベルでの完全な整合性と、Prisma/TypeScriptによる高い開発効率（型安全性）を両立させる。

## 5. 具体的なENUM値の案

### listing_category (上場区分)
- `unlisted` (未上場)
- `tse_prime` (東京・プライム)
- `tse_standard` (東京・スタンダード)
- `tse_growth` (東京・グロース)
- `tse_pro` (東京・PRO Market)
- `nse_premier` (名古屋・プレミア)
- `nse_main` (名古屋・メイン)
- `nse_next` (名古屋・ネクスト)
- `fse_main` (福岡・本則)
- `fse_q_board` (福岡・Q-Board)
- `fse_pro` (福岡・PRO Market)
- `sse_main` (札幌・本則)
- `sse_ambitious` (札幌・アンビシャス)

### origin_industry (出身業種)
- `business` (事業会社)
- `cpa` (公認会計士)
- `bank` (銀行)
- `internal` (内部)
- `securities` (証券会社)
- `lawyer` (弁護士)
- `sharoushi` (社労士)
- `insurance_non_life` (損保)
- `vc` (VC)
- `insurance_life` (生保)
- `judicial_scrivener` (司法書士)
- `university` (大学教員)
- `other` (その他)

### membership_qualification (入会資格)
- `auditor` (監査役)
- `former_auditor` (元監査役)
- `audit_committee` (監査等委員)
- `auditor_candidate` (監査役候補)
- `former_inspector` (元監事)
- `audit_commissioner` (監査委員)
- `business_audit` (事業会社・内部監査部門)
- `business_other` (事業会社・内部監査部門以外)
- `other` (その他)

### prefecture (都道府県)
- `hokkaido`, `aomori`, ... (ローマ字表記)
- `other` (その他)

### affiliation (所属)
- `internal_audit` (内部監査部門)
- `full_time_auditor` (常勤監査役・常勤監査等委員)
- `representative` (代表者・社長・CEO)
- `cfo` (CFO)
- `admin_manager` (管理部門長)
- `accounting` (経理部門)
- `legal` (法務部門)
- `general_affairs` (総務部門)
- `is` (情報システム部門)
- `planning` (経営企画部門)
- `president_office` (社長室)
- `hr` (人事部門)
- `ir` (IR部門)
- `other` (その他)
