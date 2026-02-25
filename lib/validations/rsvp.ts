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
