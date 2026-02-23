import { z } from "zod";

export const adminCreateSchema = z.object({
  firstName: z
    .string()
    .min(1, "名を入力してください")
    .max(50, "名は50文字以内で入力してください"),
  lastName: z
    .string()
    .min(1, "姓を入力してください")
    .max(50, "姓は50文字以内で入力してください"),
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください")
    .max(255, "メールアドレスは255文字以内で入力してください"),
  password: z
    .string()
    .min(12, "パスワードは12文字以上で入力してください"),
  passwordConfirm: z
    .string()
    .min(1, "パスワード（確認）を入力してください"),
  role: z.enum(["super", "community_admin"]),
  communityIds: z
    .array(z.number().int().positive())
    .optional(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "パスワードが一致しません",
  path: ["passwordConfirm"],
}).refine((data) => {
  if (data.role === "community_admin") {
    return data.communityIds && data.communityIds.length > 0;
  }
  return true;
}, {
  message: "コミュニティ管理者にはコミュニティを1つ以上選択してください",
  path: ["communityIds"],
});

export const adminUpdateSchema = z.object({
  firstName: z
    .string()
    .min(1, "名を入力してください")
    .max(50, "名は50文字以内で入力してください"),
  lastName: z
    .string()
    .min(1, "姓を入力してください")
    .max(50, "姓は50文字以内で入力してください"),
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください")
    .max(255, "メールアドレスは255文字以内で入力してください"),
  role: z.enum(["super", "community_admin"]),
  communityIds: z
    .array(z.number().int().positive())
    .optional(),
}).refine((data) => {
  if (data.role === "community_admin") {
    return data.communityIds && data.communityIds.length > 0;
  }
  return true;
}, {
  message: "コミュニティ管理者にはコミュニティを1つ以上選択してください",
  path: ["communityIds"],
});

export const passwordChangeSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "現在のパスワードを入力してください"),
  newPassword: z
    .string()
    .min(12, "新しいパスワードは12文字以上で入力してください"),
  newPasswordConfirm: z
    .string()
    .min(1, "新しいパスワード（確認）を入力してください"),
}).refine((data) => data.newPassword === data.newPasswordConfirm, {
  message: "パスワードが一致しません",
  path: ["newPasswordConfirm"],
});
