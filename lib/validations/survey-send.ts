import { z } from "zod";

const surveyEmailBaseSchema = z.object({
  eventId: z.number().int().positive("イベントIDが不正です"),
  emailTitle: z
    .string()
    .trim()
    .min(1, "メールタイトルを入力してください")
    .max(200, "メールタイトルは200文字以内で入力してください"),
  emailBody: z
    .string()
    .trim()
    .min(1, "メール本文を入力してください")
    .max(50000, "メール本文は50000文字以内で入力してください"),
});

export const sendSurveySchema = surveyEmailBaseSchema.extend({
  customerIds: z
    .array(z.number().int().positive())
    .min(1, "送信先を1名以上選択してください"),
});

export const testSurveySchema = surveyEmailBaseSchema;
