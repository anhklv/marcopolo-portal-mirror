"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  requireAuthenticatedAdmin,
  canManageSurvey,
} from "@/lib/auth/permissions";
import {
  sendSurveySchema,
  testSurveySchema,
} from "@/lib/validations/survey-send";
import { sendMail } from "@/lib/mail/send";
import { sendSurveyMailBatch } from "@/lib/mail/survey-send";
import { getBaseUrl } from "@/lib/helpers/base-url";
import {
  generateSurveyToken,
  buildSurveyUrl,
  replaceSurveyPlaceholders,
} from "@/lib/helpers/survey";
import { findSurveyByEventId, createSurvey } from "@/lib/repositories/survey.repository";
import { getEventDisplayStatus } from "@/lib/utils/event";

// ============================================================
// 型定義
// ============================================================

type SendSurveyResult =
  | {
      success: true;
      sentCount: number;
      failedCount: number;
      failedNames: string[];
    }
  | { success: false; error: string };

type SendTestSurveyResult =
  | { success: true }
  | { success: false; error: string };

// ============================================================
// Actions
// ============================================================

/**
 * アンケート依頼メール一括送信
 */
export async function sendSurveyAction(
  formData: unknown
): Promise<SendSurveyResult> {
  // 認証
  const { admin } = await requireAuthenticatedAdmin();

  // バリデーション
  const parsed = sendSurveySchema.safeParse(formData);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message);
    return { success: false, error: messages[0] };
  }

  const { eventId, customerIds, emailTitle, emailBody } = parsed.data;

  // 権限チェック（スコープ + hasSurvey）
  const hasPermission = await canManageSurvey(admin, eventId);
  if (!hasPermission) {
    return {
      success: false,
      error: "このイベントのアンケート操作権限がありません",
    };
  }

  try {
    // イベント終了チェック
    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: { id: true, date: true, responseDeadline: true, isPaused: true },
    });
    if (!event) {
      return { success: false, error: "イベントが見つかりません" };
    }
    if (getEventDisplayStatus(event) !== "closed") {
      return {
        success: false,
        error: "アンケートメールは終了したイベントのみ送信できます",
      };
    }

    // 参加者検証: customerIds がこのイベントの参加者（attending/online）であることを確認
    const validRsvps = await prisma.rsvp.findMany({
      where: {
        eventId,
        customerId: { in: customerIds },
        status: { in: ["attending", "online"] },
        customer: { deletedAt: null },
      },
      select: { customerId: true },
    });
    const validCustomerIds = validRsvps.map((r) => r.customerId);
    const invalidIds = customerIds.filter((id) => !validCustomerIds.includes(id));
    if (invalidIds.length > 0) {
      return {
        success: false,
        error: "選択された送信先にイベント参加者以外が含まれています",
      };
    }

    // Survey 存在確認 → なければ自動作成
    let survey = await findSurveyByEventId(eventId);
    if (!survey) {
      const created = await createSurvey({ eventId, questions: [] });
      survey = { ...created, questions: [] };
    }
    const surveyId = survey.id;

    // 既存 SurveyToken 取得
    const existingTokens = await prisma.surveyToken.findMany({
      where: { surveyId, customerId: { in: customerIds } },
      select: { customerId: true, token: true },
    });
    const existingTokenMap = new Map(
      existingTokens.map((t) => [t.customerId, t.token])
    );

    // 新規 vs 再送を分類
    const newCustomerIds = customerIds.filter(
      (id) => !existingTokenMap.has(id)
    );
    const resendCustomerIds = customerIds.filter((id) =>
      existingTokenMap.has(id)
    );

    // 顧客情報取得
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds }, deletedAt: null },
      select: {
        id: true,
        lastName: true,
        firstName: true,
        email: true,
        subEmails: true,
      },
    });

    if (customers.length === 0) {
      return { success: false, error: "有効な送信先が見つかりません" };
    }

    const baseUrl = await getBaseUrl();
    const from = process.env.SMTP_FROM ?? "noreply@example.com";

    // トークン生成（新規のみ。再送は既存トークンを利用）
    const tokenMap = new Map<number, string>();
    for (const c of customers) {
      const existing = existingTokenMap.get(c.id);
      tokenMap.set(c.id, existing ?? generateSurveyToken());
    }

    // メール送信（バッチ処理）
    const batchResult = await sendSurveyMailBatch({
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

    // 成功分のDB保存
    const now = new Date();

    // 新規: createMany
    const newTokenData = successCustomerIds
      .filter((id) => newCustomerIds.includes(id))
      .map((customerId) => ({
        surveyId,
        customerId,
        token: tokenMap.get(customerId) ?? "",
        sentAt: now,
      }));

    if (newTokenData.length > 0) {
      await prisma.surveyToken.createMany({
        data: newTokenData,
        skipDuplicates: true,
      });
    }

    // 再送: sentAt 更新
    for (const customerId of successCustomerIds.filter((id) =>
      resendCustomerIds.includes(id)
    )) {
      try {
        await prisma.surveyToken.update({
          where: {
            surveyId_customerId: { surveyId, customerId },
          },
          data: { sentAt: now },
        });
      } catch {
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
    console.error("sendSurveyAction error:", error);
    return {
      success: false,
      error: "アンケートメールの送信中にエラーが発生しました",
    };
  }
}

/**
 * テスト送信（管理者自身のメールに1通送信）
 */
export async function sendTestSurveyAction(
  formData: unknown
): Promise<SendTestSurveyResult> {
  // 認証
  const session = await requireAuth();
  const adminId = Number(session.user.id);

  // バリデーション
  const parsed = testSurveySchema.safeParse(formData);
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
  const dummyUrl = buildSurveyUrl(
    baseUrl,
    parsed.data.eventId,
    "test-dummy-token"
  );
  const text = replaceSurveyPlaceholders(parsed.data.emailBody, {
    surveyUrl: dummyUrl,
    customerName: "テスト 太郎",
  });

  const result = await sendMail({
    from,
    to: admin.email,
    subject: `[テスト] ${parsed.data.emailTitle}`,
    text,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error ?? "テスト送信に失敗しました",
    };
  }

  return { success: true };
}
