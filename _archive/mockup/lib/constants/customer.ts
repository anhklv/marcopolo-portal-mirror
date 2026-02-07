// 都道府県一覧
export const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
  "その他",
] as const;

// 出身業種
export const ORIGIN_INDUSTRIES = [
  "事業会社",
  "公認会計士",
  "銀行",
  "内部",
  "証券会社",
  "弁護士",
  "社労士",
  "損保",
  "VC",
  "生保",
  "司法書士",
  "大学教員",
  "その他",
] as const;

// 入会資格
export const MEMBERSHIP_QUALIFICATIONS = [
  "監査役",
  "元監査役",
  "監査等委員",
  "監査役候補",
  "元監事",
  "監査委員",
  "事業会社（内部監査部門）",
  "事業会社（内部監査部門以外）",
  "その他",
] as const;

// 上場区分
export const LISTING_OPTIONS = [
  { exchange: "東京証券取引所", markets: ["プライム", "スタンダード", "グロース", "TOKYO PRO Market"] },
  { exchange: "名古屋証券取引所", markets: ["プレミア", "メイン", "ネクスト"] },
  { exchange: "福岡証券取引所", markets: ["本則市場", "Q-Board", "Fukuoka PRO Market"] },
  { exchange: "札幌証券取引所", markets: ["本則市場", "アンビシャス"] },
] as const;

// ベンチャー監査役の会の会員種別
export const AUDIT_MEMBER_TYPES = [
  { value: "regular", label: "正会員" },
  { value: "online", label: "オンライン会員" },
] as const;

// ないかんMeetup 所属
export const NAIKAN_AFFILIATIONS = [
  "内部監査部門",
  "常勤監査役・常勤監査等委員",
  "代表者（社長・CEO）",
  "CFO",
  "管理部門長",
  "経理部門",
  "法務部門",
  "総務部門",
  "情報システム部門",
  "経営企画部門",
  "社長室",
  "人事部門",
  "IR部門",
  "その他",
] as const;

// AI部会 所属（ないかんMeetupと同じ項目を使用）
export const AI_AFFILIATIONS = NAIKAN_AFFILIATIONS;

// ユーザーロール（会員区分）の表示設定
export const USER_ROLE_CONFIG = {
  member: { label: "会員", variant: "default", description: "通常会員" },
  sponsor: { label: "スポンサー", variant: "outline", description: "スポンサー会員" },
  observer: { label: "オブザーバー", variant: "outline", description: "オブザーバー会員" },
  retired: { label: "退会", variant: "destructive-outline", description: "退会済み" },
  premium: { label: "プレミアム", variant: "premium", description: "プレミアム会員（専用バリアント）" },
} as const;

export type UserRoleConfigKey = keyof typeof USER_ROLE_CONFIG;
