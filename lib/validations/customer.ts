import { z } from "zod";

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
    .optional()
    .or(z.literal("")),
  lastNameKana: z
    .string()
    .max(100, "セイは100文字以内で入力してください")
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
    .max(20, "電話番号は20文字以内で入力してください")
    .optional()
    .or(z.literal("")),
  postalCode: z
    .string()
    .max(10, "郵便番号は10文字以内で入力してください")
    .optional()
    .or(z.literal("")),
  prefecture: z
    .string()
    .max(20, "都道府県は20文字以内で入力してください")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .max(255, "市区町村は255文字以内で入力してください")
    .optional()
    .or(z.literal("")),
  gender: z
    .enum(["male", "female"])
    .optional()
    .nullable(),
  listingCategory: z
    .string()
    .max(100, "上場区分は100文字以内で入力してください")
    .optional()
    .or(z.literal("")),
  originIndustry: z
    .string()
    .max(100, "出身業種は100文字以内で入力してください")
    .optional()
    .or(z.literal("")),
  membershipQualification: z
    .string()
    .max(100, "入会資格は100文字以内で入力してください")
    .optional()
    .or(z.literal("")),
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

export const customerCommunitySchema = z.object({
  communityId: z.number().int().positive("コミュニティIDは正の整数を指定してください"),
  joinedAt: z.string().nullable().optional(),
  resignedAt: z.string().nullable().optional(),
  auditMemberType: z
    .enum(["regular", "online"])
    .nullable()
    .optional(),
  auditMemberPremium: z.boolean().nullable().optional(),
  affiliation: z
    .string()
    .max(100, "所属は100文字以内で入力してください")
    .nullable()
    .optional()
    .or(z.literal("")),
});

export const customerFormSchema = customerSchema.extend({
  communities: z.array(customerCommunitySchema).optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type CustomerCommunityInput = z.infer<typeof customerCommunitySchema>;
export type CustomerFormInput = z.infer<typeof customerFormSchema>;
