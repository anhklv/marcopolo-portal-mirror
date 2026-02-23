"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  requireAuthenticatedAdmin,
  canAccessEvent,
} from "@/lib/auth/permissions";
import { inviteSchema, testInviteSchema } from "@/lib/validations/invite";
import { sendMail } from "@/lib/mail/send";
import { generateRsvpToken, buildRsvpUrl, replacePlaceholders } from "@/lib/helpers/invite";

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
    select: { id: true },
  });
  if (!event) {
    return { success: false, error: "イベントが見つかりません" };
  }

  const hasAccess = await canAccessEvent(admin, eventId);
  if (!hasAccess) {
    return { success: false, error: "このイベントへのアクセス権がありません" };
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
    // 既存RSVPのcustomerIdを取得（重複招待防止）
    const existingRsvps = await prisma.rsvp.findMany({
      where: { eventId },
      select: { customerId: true },
    });
    const existingCustomerIds = new Set(existingRsvps.map((r) => r.customerId));

    // 新規送信対象のみ抽出
    const newCustomerIds = customerIds.filter((id) => !existingCustomerIds.has(id));

    if (newCustomerIds.length === 0) {
      return { success: false, error: "選択された顧客は全て案内済みです" };
    }

    // 顧客情報取得（メール送信用）
    const customers = await prisma.customer.findMany({
      where: { id: { in: newCustomerIds }, deletedAt: null },
      select: { id: true, lastName: true, firstName: true, email: true },
    });

    if (customers.length === 0) {
      return { success: false, error: "有効な送信先が見つかりません" };
    }

    const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
    const from = process.env.SMTP_FROM ?? "noreply@example.com";

    // トークンを事前生成（メモリ上に保持）
    const tokenMap = new Map<number, string>();
    for (const c of customers) {
      tokenMap.set(c.id, generateRsvpToken());
    }

    // メール送信（バッチ処理で段階的に送信）
    const BATCH_SIZE = 10;
    const sendResults: PromiseSettledResult<Awaited<ReturnType<typeof sendMail>>>[] = [];

    for (let i = 0; i < customers.length; i += BATCH_SIZE) {
      const batch = customers.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map((customer) => {
          const token = tokenMap.get(customer.id) ?? "";
          const rsvpUrl = buildRsvpUrl(baseUrl, eventId, token);
          const customerName = `${customer.lastName} ${customer.firstName}`;
          const text = replacePlaceholders(emailBody, { rsvpUrl, customerName });

          return sendMail({
            from,
            to: customer.email,
            subject: emailTitle,
            text,
          });
        })
      );
      sendResults.push(...batchResults);
    }

    // 結果集計 + 成功分のみRSVP作成データを収集
    const failedNames: string[] = [];
    const successRsvpData: { eventId: number; customerId: number; token: string }[] = [];
    let sentCount = 0;
    let failedCount = 0;

    sendResults.forEach((result, index) => {
      const customer = customers[index];
      if (result.status === "fulfilled" && result.value.success) {
        sentCount++;
        successRsvpData.push({
          eventId,
          customerId: customer.id,
          token: tokenMap.get(customer.id) ?? "",
        });
      } else {
        failedCount++;
        failedNames.push(`${customer.lastName} ${customer.firstName}`);
      }
    });

    // 送信成功分のみRSVPレコード作成
    if (successRsvpData.length > 0) {
      await prisma.rsvp.createMany({ data: successRsvpData, skipDuplicates: true });
    }

    revalidatePath(`/admin/events/${eventId}`);

    return { success: true, sentCount, failedCount, failedNames };
  } catch (error) {
    console.error("sendInviteAction error:", error);
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

  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
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
