import { z } from "zod";

export const surveyQuestionSchema = z.object({
  id: z.number().int().optional(),
  title: z
    .string()
    .trim()
    .min(1, "設問タイトルを入力してください")
    .max(500, "設問タイトルは500文字以内で入力してください"),
  sortOrder: z.number().int().min(0),
});

export const saveSurveySchema = z.object({
  eventId: z.number().int().positive("イベントIDが不正です"),
  questions: z.array(surveyQuestionSchema),
});
