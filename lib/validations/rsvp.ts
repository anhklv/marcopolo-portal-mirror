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
export const adminRsvpUpdateSchema = z
  .object({
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
    adminNote: z
      .string()
      .optional()
      .transform((value) => value?.trim() || null),
    notifyCustomerByEmail: z.boolean().optional().default(false),
    emailSubject: z.string().optional(),
    emailBody: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.notifyCustomerByEmail) {
      return;
    }

    const subject = data.emailSubject?.trim() ?? "";
    const body = data.emailBody?.trim() ?? "";

    if (!subject) {
      ctx.addIssue({
        code: "custom",
        path: ["emailSubject"],
        message: "メールタイトルを入力してください",
      });
    } else if (subject.length > 200) {
      ctx.addIssue({
        code: "custom",
        path: ["emailSubject"],
        message: "メールタイトルは200文字以内で入力してください",
      });
    }

    if (!body) {
      ctx.addIssue({
        code: "custom",
        path: ["emailBody"],
        message: "メール本文を入力してください",
      });
    } else if (body.length > 50000) {
      ctx.addIssue({
        code: "custom",
        path: ["emailBody"],
        message: "メール本文は50000文字以内で入力してください",
      });
    }
  });

export type AdminRsvpUpdateInput = z.infer<typeof adminRsvpUpdateSchema>;
