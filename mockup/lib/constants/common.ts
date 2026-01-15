import type { MemberCategory, ContractType } from "@/lib/types";

// 会員区分の表示ラベル（会員の場合のみ）
export const MEMBER_CATEGORY_LABELS: Record<MemberCategory, string> = {
  "member": "会員",
  "sponsor": "スポンサー",
  "observer": "オブザーバー",
} as const;

// 契約主体の表示ラベル
export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  "corporate": "法人",
  "individual": "個人",
} as const;

// 性別の表示ラベル
export const GENDER_LABELS: Record<"male" | "female", string> = {
  "male": "男性",
  "female": "女性",
} as const;

