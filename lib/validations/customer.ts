import { z } from "zod";

// null/undefined/""/0 を null にし、正の整数のみ受け付けるオプショナルID
const optionalId = z.preprocess(
  (v) => (v === null || v === undefined || v === "" || v === 0 ? null : Number(v)),
  z.number().int().positive().nullable().optional()
);

// ============================================================
// 共通バリデーション関数（クライアント・サーバー両方で使用）
// ============================================================

export function validateKatakana(value: string): string | null {
  if (!value) return null;
  if (!/^[ァ-ヺー・\s　]*$/.test(value)) return "カタカナで入力してください";
  return null;
}

export function validatePhone(value: string): string | null {
  if (!value) return null;
  if (!/^[0-9]*$/.test(value)) return "数字のみで入力してください";
  if (value.length < 10 || value.length > 11) return "電話番号は数字10桁または11桁で入力してください";
  return null;
}

export function validatePostalCode(value: string): string | null {
  if (!value) return null;
  if (!/^[0-9]*$/.test(value)) return "数字のみで入力してください";
  if (value.length !== 7) return "郵便番号は数字7桁で入力してください";
  return null;
}

function refineWithValidator(validate: (v: string) => string | null) {
  return (v: string, ctx: z.RefinementCtx) => {
    const error = validate(v);
    if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
  };
}

// ============================================================
// Zodスキーマ
// ============================================================

export const customerSchema = z.object({
  firstName: z
    .string()
    .min(1, "名を入力してください")
    .max(100, "名は100文字以内で入力してください"),
  lastName: z
    .string()
    .min(1, "姓を入力してください")
    .max(100, "姓は100文字以内で入力してください"),
  firstNameKana: z
    .string()
    .max(100, "メイは100文字以内で入力してください")
    .superRefine(refineWithValidator(validateKatakana))
    .optional()
    .or(z.literal("")),
  lastNameKana: z
    .string()
    .max(100, "セイは100文字以内で入力してください")
    .superRefine(refineWithValidator(validateKatakana))
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください")
    .max(255, "メールアドレスは255文字以内で入力してください"),
  subEmails: z
    .array(z.string().email("有効なメールアドレスを入力してください"))
    .max(3, "サブメールアドレスは最大3つまでです")
    .optional(),
  company: z
    .string()
    .max(200, "会社名は200文字以内で入力してください")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .superRefine(refineWithValidator(validatePhone))
    .optional()
    .or(z.literal("")),
  postalCode: z
    .string()
    .superRefine(refineWithValidator(validatePostalCode))
    .optional()
    .or(z.literal("")),
  prefectureId: optionalId,
  city: z
    .string()
    .max(255, "市区町村は255文字以内で入力してください")
    .optional()
    .or(z.literal("")),
  gender: z
    .enum(["male", "female"])
    .optional()
    .nullable(),
  listingCategoryId: optionalId,
  memberCategory: z
    .enum(["member", "sponsor", "observer"])
    .optional()
    .nullable(),
  contractType: z
    .enum(["corporate", "individual"])
    .optional()
    .nullable(),
  jobChangeIntent: z
    .enum(["active", "considering", "if_good", "not_thinking"])
    .optional()
    .nullable(),
  note: z
    .string()
    .optional()
    .or(z.literal("")),
});

const optionalDateString = z
  .string()
  .refine(
    (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),
    "有効な日付を入力してください"
  )
  .refine(
    (v) => {
      const d = new Date(v + "T00:00:00");
      if (isNaN(d.getTime())) return false;
      const [y, m, day] = v.split("-").map(Number);
      return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day;
    },
    "存在しない日付です"
  )
  .nullable()
  .optional();

export const customerCommunitySchema = z.object({
  communityId: z.coerce.number().int().positive("コミュニティIDは正の整数を指定してください"),
  joinedAt: optionalDateString,
  resignedAt: optionalDateString,
  auditMemberType: z
    .enum(["regular", "online"])
    .nullable()
    .optional(),
  auditMemberPremium: z.boolean().nullable().optional(),
  affiliationId: optionalId,
  originIndustryId: optionalId,
  membershipQualificationId: optionalId,
});

export const customerFormSchema = customerSchema.extend({
  communities: z.array(customerCommunitySchema).optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type CustomerCommunityInput = z.infer<typeof customerCommunitySchema>;
export type CustomerFormInput = z.infer<typeof customerFormSchema>;
