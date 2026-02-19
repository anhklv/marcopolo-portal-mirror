import type { MemberCategory, ContractType, Gender, AuditMemberType, JobChangeIntent } from "@/lib/generated/prisma";

// ベンチャー監査役の会の会員種別
export const AUDIT_MEMBER_TYPES: readonly { value: AuditMemberType; label: string }[] = [
  { value: "regular", label: "正会員" },
  { value: "online", label: "オンライン会員" },
] as const;

// 会員区分の表示ラベル
export const MEMBER_CATEGORY_LABELS: Record<MemberCategory, string> = {
  member: "会員",
  sponsor: "スポンサー",
  observer: "オブザーバー",
} as const;

// 契約主体の表示ラベル
export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  corporate: "法人",
  individual: "個人",
} as const;

// 性別の表示ラベル
export const GENDER_LABELS: Record<Gender, string> = {
  male: "男性",
  female: "女性",
} as const;

// 転職意欲の選択肢
export const JOB_CHANGE_INTENT_OPTIONS: readonly {
  value: JobChangeIntent;
  label: string;
}[] = [
  { value: "active", label: "積極的に検討中" },
  { value: "considering", label: "検討している" },
  { value: "if_good", label: "よい案件があれば" },
  { value: "not_thinking", label: "全く考えていない" },
] as const;

export const JOB_CHANGE_INTENT_LABELS: Record<JobChangeIntent, string> = {
  active: "積極的に検討中",
  considering: "検討している",
  if_good: "よい案件があれば",
  not_thinking: "全く考えていない",
} as const;

// ユーザーロール（会員区分）の表示設定
export const USER_ROLE_CONFIG = {
  member: { label: "会員", variant: "default", description: "通常会員" },
  sponsor: { label: "スポンサー", variant: "outline", description: "スポンサー会員" },
  observer: { label: "オブザーバー", variant: "outline", description: "オブザーバー会員" },
  retired: { label: "退会", variant: "destructive-outline", description: "退会済み" },
  premium: { label: "プレミアム", variant: "premium", description: "プレミアム会員（専用バリアント）" },
} as const;

export type UserRoleConfigKey = keyof typeof USER_ROLE_CONFIG;
