"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  requireAuthenticatedAdmin,
  canAccessEvent,
} from "@/lib/auth/permissions";
import { inviteSchema, testInviteSchema } from "@/lib/validations/invite";
import { sendMail, sendMailBatch } from "@/lib/mail/send";
import { getBaseUrl } from "@/lib/helpers/base-url";
import { generateRsvpToken, buildRsvpUrl, replacePlaceholders } from "@/lib/helpers/invite";
import { getEventDisplayStatus } from "@/lib/utils/event";
import { logServerError } from "@/lib/utils/log-error";
import { createEventMailHistory } from "@/lib/repositories/event-mail.repository";

// ============================================================
// 型定義
// ============================================================

type SendInviteResult =
  | { success: true; sentCount: number; failedCount: number; failedNames: string[] }
  | { success: false; error: string };

type SendTestInviteResult =
  | { success: true }
  | { success: false; error: string };

// ============================================================
// Actions
// ============================================================

/**
 * 案内メール一括送信
 */
export async function sendInviteAction(
  formData: unknown
): Promise<SendInviteResult> {
  // 認証
  const { admin, scopedCommunityIds } = await requireAuthenticatedAdmin();

  // バリデーション
  const parsed = inviteSchema.safeParse(formData);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message);
    return { success: false, error: messages[0] };
  }

  const { eventId, customerIds, emailTitle, emailBody } = parsed.data;

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
    return { success: false, error: "案内メールは受付中のイベントのみ送信できます" };
  }

  // community_admin の場合、全顧客がスコープ内か検証
  if (admin.role !== "super") {
    const scopedCustomers = await prisma.customerCommunity.findMany({
      where: {
        customerId: { in: customerIds },
        communityId: { in: scopedCommunityIds },
      },
      select: { customerId: true },
      distinct: ["customerId"],
    });
    const scopedCustomerIdSet = new Set(scopedCustomers.map((c) => c.customerId));
    const outOfScope = customerIds.some((id) => !scopedCustomerIdSet.has(id));
    if (outOfScope) {
      return { success: false, error: "選択された顧客へのアクセス権がありません" };
    }
  }

  try {
    // 既存RSVPを取得（再送時は既存tokenを再利用する）
    const existingRsvps = await prisma.rsvp.findMany({
      where: { eventId },
      select: { customerId: true, status: true, token: true },
    });
    const existingRsvpMap = new Map(existingRsvps.map((r) => [r.customerId, r]));

    // 回答済み（attending/online/absent）のIDを除外。pendingは再送対象
    const answeredStatuses = new Set(["attending", "online", "absent"]);
    const targetCustomerIds = customerIds.filter((id) => {
      const existingRsvp = existingRsvpMap.get(id);
      return !existingRsvp || !answeredStatuses.has(existingRsvp.status);
    });

    if (targetCustomerIds.length === 0) {
      return { success: false, error: "選択された顧客は全て回答済みです" };
    }

    // 新規顧客を特定（pending再送は既存RSVPをそのまま利用）
    const newCustomerIds = targetCustomerIds.filter((id) => !existingRsvpMap.has(id));

    // 顧客情報取得（メール送信用。メイン＋サブメールアドレスへ送信）
    const customers = await prisma.customer.findMany({
      where: { id: { in: targetCustomerIds }, deletedAt: null },
      select: { id: true, lastName: true, firstName: true, email: true, subEmails: true },
    });

    if (customers.length === 0) {
      return { success: false, error: "有効な送信先が見つかりません" };
    }

    const baseUrl = await getBaseUrl();
    const from = process.env.SMTP_FROM ?? "noreply@example.com";

    // 新規顧客のみtokenを生成し、pending再送では既存tokenを再利用
    const tokenMap = new Map<number, string>();
    for (const c of customers) {
      const existingToken = existingRsvpMap.get(c.id)?.token;
      tokenMap.set(c.id, existingToken ?? generateRsvpToken());
    }

    // URLを受信したメールが必ず利用できるよう、SMTP送信前にRSVPを保存する。
    const newRsvpData = newCustomerIds.map((customerId) => ({
      eventId,
      customerId,
      token: tokenMap.get(customerId) ?? "",
    }));
    if (newRsvpData.length > 0) {
      await prisma.rsvp.createMany({ data: newRsvpData, skipDuplicates: true });
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

    const { sentCount, failedCount, failedNames, successCustomerIds } = batchResult;

    // 全アドレスが失敗した新規顧客は、従来どおり案内済みとして残さない。
    const successCustomerIdSet = new Set(successCustomerIds);
    const failedNewCustomerIds = newCustomerIds.filter(
      (customerId) => !successCustomerIdSet.has(customerId)
    );
    if (failedNewCustomerIds.length > 0) {
      await prisma.rsvp.deleteMany({
        where: {
          eventId,
          customerId: { in: failedNewCustomerIds },
          status: "pending",
        },
      });
    }

    await createEventMailHistory({
      eventId,
      templateName: "案内メール",
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
    logServerError("sendInviteAction", error);
    return { success: false, error: "案内メールの送信中にエラーが発生しました" };
  }
}

/**
 * テスト送信（管理者自身のメールに1通送信）
 */
export async function sendTestInviteAction(
  formData: unknown
): Promise<SendTestInviteResult> {
  // 認証
  const session = await requireAuth();
  const adminId = Number(session.user.id);

  // バリデーション
  const parsed = testInviteSchema.safeParse(formData);
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
