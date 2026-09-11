import { z } from "zod";
import { REMIND_TARGETS } from "@/lib/helpers/remind-target";

/**
 * リマインドメール送信バリデーション
 * ※ customerIds は不要（サーバー側でpending RSVPを取得するため）
 */
export const remindSchema = z.object({
  eventId: z.number().int().positive("イベントIDが不正です"),
  target: z.enum(REMIND_TARGETS).default("pending"),
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

/**
 * テスト送信バリデーション
 */
export const testRemindSchema = z.object({
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
