import { z } from "zod";

/**
 * RSVP回答送信のバリデーションスキーマ
 */
export const rsvpResponseSchema = z.object({
  token: z.string().min(1, "無効なトークンです"),
  status: z.enum(["attending", "online", "absent"], {
    message: "出欠を選択してください",
  }),
  afterPartyStatus: z
    .enum(["attending", "not_attending"])
    .nullable()
    .optional()
    .transform((val) => val ?? null),
  comment: z
    .string()
    .max(1000, "メッセージは1000文字以内で入力してください")
    .optional()
    .transform((val) => val?.trim() || null),
});

export type RsvpResponseInput = z.infer<typeof rsvpResponseSchema>;

/**
 * 管理者によるRSVP更新のバリデーションスキーマ
 */
export const adminRsvpUpdateSchema = z.object({
  rsvpId: z.coerce.number().int().positive("RSVP IDが不正です"),
  eventId: z.coerce.number().int().positive("イベントIDが不正です"),
  status: z.enum(["attending", "online", "absent"], {
    message: "出欠を選択してください",
  }),
  afterPartyStatus: z
    .enum(["attending", "not_attending"])
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  comment: z
    .string()
    .max(1000, "メッセージは1000文字以内で入力してください")
    .optional()
    .transform((value) => value?.trim() || null),
});

export type AdminRsvpUpdateInput = z.infer<typeof adminRsvpUpdateSchema>;
