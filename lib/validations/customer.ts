import { z } from "zod";

// null/undefined/""/0 を null にし、正の整数のみ受け付けるオプショナルID
const optionalId = z.preprocess(
  (v) =>
    v === null || v === undefined || v === "" || v === 0 ? null : Number(v),
  z.number().int().positive().nullable().optional(),
);

const requiredDepartmentIds = z.preprocess(
  (v) => (Array.isArray(v) ? v : []),
  z
    .array(z.coerce.number().int().positive())
    .min(1, "所属部署を1つ以上選択してください"),
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
  if (value.length < 10 || value.length > 11)
    return "電話番号は数字10桁または11桁で入力してください";
  return null;
}

export function validatePostalCode(value: string): string | null {
  if (!value) return null;
  if (!/^[0-9]*$/.test(value)) return "数字のみで入力してください";
  if (value.length !== 7) return "郵便番号は数字7桁で入力してください";
  return null;
}

export function validateDateInput(value: string): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return "YYYY/MM/DD形式で入力してください";
  const year = parseInt(match[1]);
  const month = parseInt(match[2]) - 1;
  const day = parseInt(match[3]);
  const d = new Date(year, month, day);
  if (
    isNaN(d.getTime()) ||
    d.getFullYear() !== year ||
    d.getMonth() !== month ||
    d.getDate() !== day
  ) {
    return "存在しない日付です";
  }
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
  position: z
    .string()
    .max(50, "役職は50文字以内で入力してください")
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
  gender: z.enum(["male", "female"]).optional().nullable(),
  listingCategoryId: optionalId,
  memberCategory: z
    .enum(["member", "sponsor", "observer"])
    .optional()
    .nullable(),
  contractType: z.enum(["corporate", "individual"]).optional().nullable(),
  jobChangeIntent: z
    .enum(["active", "considering", "if_good", "not_thinking"])
    .optional()
    .nullable(),
  note: z.string().optional().or(z.literal("")),
});

const optionalDateString = z
  .string()
  .superRefine(refineWithValidator(validateDateInput))
  .transform((v) => {
    if (!v) return null;
    const match = v.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (!match) return null;
    return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  })
  .nullable()
  .optional();

const customerCommunitySchema = z.object({
  communityId: z.coerce
    .number()
    .int()
    .positive("コミュニティIDは正の整数を指定してください"),
  joinedAt: optionalDateString,
  resignedAt: optionalDateString,
  auditMemberType: z.enum(["regular", "online"]).nullable().optional(),
  auditMemberPremium: z.boolean().nullable().optional(),
  affiliationId: optionalId,
  originIndustryId: optionalId,
  membershipQualificationId: optionalId,
});

export const customerFormSchema = customerSchema
  .extend({
    departmentIds: requiredDepartmentIds,
    otherDepartmentId: optionalId,
    departmentOtherNote: z.string().optional().or(z.literal("")),
    communities: z.array(customerCommunitySchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.otherDepartmentId &&
      data.departmentIds.includes(data.otherDepartmentId) &&
      !data.departmentOtherNote?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "その他の所属を入力してください",
        path: ["departmentOtherNote"],
      });
    }
  });

export type CustomerFormInput = z.infer<typeof customerFormSchema>;

/**
 * customerFormSchema transforms community dates to the database-friendly
 * YYYY-MM-DD representation. Server actions may receive an already parsed
 * payload from the CSV preview, so convert those dates back to schema input
 * before performing the mandatory server-side validation.
 */
export function normalizeCustomerFormDatesForValidation(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.communities)) return raw;
  return {
    ...data,
    communities: data.communities.map((community) => {
      if (!community || typeof community !== "object") return community;
      const entry = community as Record<string, unknown>;
      return {
        ...entry,
        joinedAt:
          typeof entry.joinedAt === "string"
            ? entry.joinedAt.replace(/-/g, "/")
            : entry.joinedAt,
        resignedAt:
          typeof entry.resignedAt === "string"
            ? entry.resignedAt.replace(/-/g, "/")
            : entry.resignedAt,
      };
    }),
  };
}
