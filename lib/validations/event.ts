import { z } from "zod";

export const eventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "タイトルを入力してください")
    .max(200, "タイトルは200文字以内で入力してください"),
  communityId: z
    .number()
    .int()
    .positive("コミュニティを選択してください"),
  date: z
    .coerce.date({ message: "開催日時を入力してください" }),
  location: z
    .string()
    .max(255, "開催場所は255文字以内で入力してください")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .optional()
    .or(z.literal("")),
  timetable: z
    .string()
    .optional()
    .or(z.literal("")),
  note: z
    .string()
    .optional()
    .or(z.literal("")),
  responseDeadline: z
    .union([z.coerce.date(), z.literal(""), z.null(), z.undefined()])
    .transform((val) => (val === "" || val === undefined ? null : val))
    .nullable()
    .optional(),
  allowsOnline: z
    .boolean()
    .optional(),
  hasAfterParty: z
    .boolean()
    .optional(),
  participationMode: z
    .enum(["disabled", "optional", "required"])
    .optional()
    .default("disabled"),
  participationOptions: z
    .array(
      z.object({
        id: z.number().int().positive().optional(),
        label: z
          .string()
          .trim()
          .min(1, "参加の選択肢に空のラベルがあります")
          .max(200, "参加の選択肢は200文字以内で入力してください"),
      })
    )
    .optional()
    .default([]),
}).superRefine((data, ctx) => {
  if (data.responseDeadline && data.date && data.responseDeadline > data.date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "回答期限は開催日時より前に設定してください",
      path: ["responseDeadline"],
    });
  }

  if (
    data.participationMode === "required" &&
    data.participationOptions.length === 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "必須の場合は参加の選択肢を1つ以上登録してください",
      path: ["participationOptions"],
    });
  }

  if (
    data.participationMode === "disabled" &&
    data.participationOptions.length > 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "参加の選択肢を使用する場合は必須または任意を選択してください",
      path: ["participationMode"],
    });
  }

  const labels = data.participationOptions.map((option) => option.label.trim());
  if (new Set(labels).size !== labels.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "同じ参加の選択肢が登録されています",
      path: ["participationOptions"],
    });
  }
});

/** イベント参加状況 CSV エクスポート（Server Action 入力） */
export const exportEventAttendeesCsvSchema = z.object({
  eventId: z.coerce.number().int().positive(),
  keyword: z.string().optional().default(""),
  statuses: z
    .array(z.enum(["pending", "attending", "online", "absent"]))
    .optional()
    .default([]),
});

export type ExportEventAttendeesCsvInput = z.infer<
  typeof exportEventAttendeesCsvSchema
>;

