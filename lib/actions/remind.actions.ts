"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  requireAuthenticatedAdmin,
  canAccessEvent,
} from "@/lib/auth/permissions";
import { remindSchema, testRemindSchema } from "@/lib/validations/remind";
import { sendMailBatch } from "@/lib/mail/send";
import { sendTestMailToAdmins } from "@/lib/mail/test-send";
import { getBaseUrl } from "@/lib/helpers/base-url";
import {
  REMIND_TARGET_LABELS,
  buildRemindRsvpWhere,
} from "@/lib/helpers/remind-target";
import { getEventDisplayStatus } from "@/lib/utils/event";
import { logServerError } from "@/lib/utils/log-error";
import { createEventMailHistory } from "@/lib/repositories/event-mail.repository";
import { findAdminsForEventTestSend } from "@/lib/repositories/admin.repository";

// ============================================================
// 型定義
// ============================================================

type SendRemindResult =
  | { success: true; sentCount: number; failedCount: number; failedNames: string[] }
  | { success: false; error: string };

type SendTestRemindResult =
  | { success: true }
  | { success: false; error: string };

// ============================================================
// Actions
// ============================================================

/**
 * リマインドメール一括送信（指定された対象の既存RSVPを利用）
 */
export async function sendRemindAction(
  formData: unknown
): Promise<SendRemindResult> {
  // 認証
  const { admin } = await requireAuthenticatedAdmin();

  // バリデーション
  const parsed = remindSchema.safeParse(formData);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message);
    return { success: false, error: messages[0] };
  }

  const { eventId, target, emailTitle, emailBody } = parsed.data;

  // イベント存在チェック + アクセス権チェック
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    select: { id: true, date: true, responseDeadline: true, isPaused: true },
  });
  if (!event) {
    return { success: false, error: "イベントが見つかりません" };
  }

  const hasAccess = await canAccessEvent(admin, eventId);
  if (!hasAccess) {
    return { success: false, error: "このイベントへのアクセス権がありません" };
  }

  if (getEventDisplayStatus(event) !== "receiving") {
    return { success: false, error: "リマインドメールは受付中のイベントのみ送信できます" };
  }

  try {
    // サーバー側で対象RSVPを取得（クライアントからcustomerIdsを受け取らない）
    // 削除済み顧客は除外
    const targetRsvps = await prisma.rsvp.findMany({
      where: {
        eventId,
        ...buildRemindRsvpWhere(target),
        customer: { deletedAt: null },
      },
      include: {
        customer: {
          select: { id: true, lastName: true, firstName: true, email: true, subEmails: true },
        },
      },
    });

    if (targetRsvps.length === 0) {
      return { success: false, error: `${REMIND_TARGET_LABELS[target]}がいません` };
    }

    const customers = targetRsvps.map((r) => r.customer);
    const baseUrl = await getBaseUrl();
    const from = process.env.SMTP_FROM ?? "noreply@example.com";

    // 初回案内時に発行されたtokenを再利用し、参加URLを固定する
    const tokenMap = new Map(
      targetRsvps.map((rsvp) => [rsvp.customerId, rsvp.token])
    );

    // メール送信（バッチ処理）
    const batchResult = await sendMailBatch({
      customers,
      tokenMap,
      eventId,
      baseUrl,
      from,
      emailTitle,
      emailBody,
    });

    const { sentCount, failedCount, failedNames } = batchResult;

    await createEventMailHistory({
      eventId,
      templateName: "リマインドメール",
      kind: "rsvp",
      subject: emailTitle,
      body: emailBody,
      fromAddress: from,
      adminId: admin.id,
      deliveries: batchResult.deliveries,
    });

    revalidatePath(`/admin/events/${eventId}`);

    return { success: true, sentCount, failedCount, failedNames };
  } catch (error) {
    logServerError("sendRemindAction", error);
    return { success: false, error: "リマインドメールの送信中にエラーが発生しました" };
  }
}

/**
 * テスト送信（管理者自身のメールに1通送信）
 */
export async function sendTestRemindAction(
  formData: unknown
): Promise<SendTestRemindResult> {
  const { admin } = await requireAuthenticatedAdmin();

  // バリデーション
  const parsed = testRemindSchema.safeParse(formData);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message);
    return { success: false, error: messages[0] };
  }

  if (!(await canAccessEvent(admin, parsed.data.eventId))) {
    return { success: false, error: "このイベントへのアクセス権がありません" };
  }

  const adminIds = [...new Set(parsed.data.adminIds)];
  const admins = await findAdminsForEventTestSend(parsed.data.eventId, adminIds);
  if (admins.length !== adminIds.length) {
    return {
      success: false,
      error: "選択された送信先の管理者が見つかりません。",
    };
  }

  return sendTestMailToAdmins({
    eventId: parsed.data.eventId,
    subject: parsed.data.emailTitle,
    body: parsed.data.emailBody,
    kind: "rsvp",
    admins,
  });
}
