"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  requireAuthenticatedAdmin,
  canAccessEvent,
} from "@/lib/auth/permissions";
import { remindSchema, testRemindSchema } from "@/lib/validations/remind";
import { sendMail, sendMailBatch } from "@/lib/mail/send";
import { getBaseUrl } from "@/lib/helpers/base-url";
import { generateRsvpToken, buildRsvpUrl, replacePlaceholders } from "@/lib/helpers/invite";
import { getEventDisplayStatus } from "@/lib/utils/event";
import { logServerError } from "@/lib/utils/log-error";

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
 * リマインドメール一括送信（pending RSVP のみ対象）
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

  const { eventId, emailTitle, emailBody } = parsed.data;

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
    // サーバー側でpending RSVPを取得（クライアントからcustomerIdsを受け取らない）
    // 削除済み顧客は除外
    const pendingRsvps = await prisma.rsvp.findMany({
      where: { eventId, status: "pending", customer: { deletedAt: null } },
      include: {
        customer: {
          select: { id: true, lastName: true, firstName: true, email: true, subEmails: true },
        },
      },
    });

    if (pendingRsvps.length === 0) {
      return { success: false, error: "未回答の参加者がいません" };
    }

    const customers = pendingRsvps.map((r) => r.customer);
    const baseUrl = await getBaseUrl();
    const from = process.env.SMTP_FROM ?? "noreply@example.com";

    // トークンを事前生成（メモリ上に保持）
    const tokenMap = new Map<number, string>();
    for (const c of customers) {
      tokenMap.set(c.id, generateRsvpToken());
    }

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

    let { sentCount, failedCount } = batchResult;
    const { failedNames, successCustomerIds } = batchResult;

    // 送信成功分のみトークン更新（既存RSVPのupdate）
    for (const customerId of successCustomerIds) {
      try {
        await prisma.rsvp.update({
          where: { eventId_customerId: { eventId, customerId } },
          data: { token: tokenMap.get(customerId) ?? "" },
        });
      } catch (err) {
        logServerError(
          `sendRemindAction:rsvpTokenUpdate eventId=${eventId} customerId=${customerId}`,
          err
        );
        sentCount--;
        failedCount++;
        const customer = customers.find((c) => c.id === customerId);
        if (customer) {
          failedNames.push(`${customer.lastName} ${customer.firstName}`);
        }
      }
    }

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
  // 認証
  const session = await requireAuth();
  const adminId = Number(session.user.id);

  // バリデーション
  const parsed = testRemindSchema.safeParse(formData);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message);
    return { success: false, error: messages[0] };
  }

  // 管理者メール取得
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { email: true },
  });

  if (!admin) {
    return { success: false, error: "管理者が見つかりません" };
  }

  const baseUrl = await getBaseUrl();
  const from = process.env.SMTP_FROM ?? "noreply@example.com";
  const dummyUrl = buildRsvpUrl(baseUrl, parsed.data.eventId, "test-dummy-token");
  const text = replacePlaceholders(parsed.data.emailBody, {
    rsvpUrl: dummyUrl,
    customerName: "テスト 太郎",
  });

  const result = await sendMail({
    from,
    to: admin.email,
    subject: `[テスト] ${parsed.data.emailTitle}`,
    text,
  });

  if (!result.success) {
    return { success: false, error: result.error ?? "テスト送信に失敗しました" };
  }

  return { success: true };
}
