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
}).superRefine((data, ctx) => {
  if (data.responseDeadline && data.date && data.responseDeadline > data.date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "回答期限は開催日時より前に設定してください",
      path: ["responseDeadline"],
    });
  }
});

export type EventInput = z.infer<typeof eventSchema>;

/** フォームから送信される生データの型（Server Action引数） */
export type EventFormInput = {
  title: string;
  communityId: number;
  date: string | Date;
  location?: string;
  description?: string;
  timetable?: string;
  note?: string;
  responseDeadline?: string | Date | null;
  allowsOnline?: boolean;
  hasAfterParty?: boolean;
};
