import { z } from "zod";

export const eventSchema = z.object({
  title: z
    .string()
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
});

export type EventInput = z.infer<typeof eventSchema>;
