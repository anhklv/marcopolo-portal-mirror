"use server";

import { revalidatePath } from "next/cache";
import {
  adminRsvpUpdateSchema,
  rsvpResponseSchema,
} from "@/lib/validations/rsvp";
import {
  canAccessEvent,
  requireAuthenticatedAdmin,
} from "@/lib/auth/permissions";
import * as rsvpRepo from "@/lib/repositories/rsvp.repository";
import { getBaseUrl } from "@/lib/helpers/base-url";
import { sendMailBatch } from "@/lib/mail/send";
import { logServerError } from "@/lib/utils/log-error";

// ============================================================
// 型定義
// ============================================================

type SubmitRsvpResult =
  | { success: true }
  | { success: false; error: string };

type AdminUpdateRsvpResult =
  | { success: true; emailWarning?: string }
  | { success: false; error: string };

// ============================================================
// Actions
// ============================================================

/**
 * RSVP回答送信（認証不要、トークンベース）
 */
export async function submitRsvpAction(
  formData: unknown
): Promise<SubmitRsvpResult> {
  // 1. バリデーション
  const parsed = rsvpResponseSchema.safeParse(formData);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message);
    return { success: false, error: messages[0] };
  }

  const { token, status, afterPartyStatus, comment } = parsed.data;

  try {
    // 2. トークンでRSVP取得
    const rsvp = await rsvpRepo.findRsvpByToken(token);
    if (!rsvp) {
      return { success: false, error: "無効なトークンです" };
    }

    // 3. イベント論理削除チェック
    if (rsvp.event.deletedAt) {
      return { success: false, error: "このイベントは終了しました" };
    }

    // 4. 顧客論理削除チェック
    if (rsvp.customer.deletedAt) {
      return { success: false, error: "アクセスできません" };
    }

    // 5. isPausedチェック
    if (rsvp.event.isPaused) {
      return { success: false, error: "現在回答を受け付けていません" };
    }

    // 6. 回答期限チェック（responseDeadline未設定時はevent.dateをデッドラインとする）
    const now = new Date();
    const deadline = rsvp.event.responseDeadline ?? rsvp.event.date;
    if (now > new Date(deadline)) {
      return { success: false, error: "回答期限を過ぎています" };
    }

    // 7. ビジネスロジック: 懇親会の回答必須チェック
    if (
      rsvp.event.hasAfterParty &&
      status === "attending" &&
      !afterPartyStatus
    ) {
      return {
        success: false,
        error: "懇親会の参加可否を選択してください",
      };
    }

    // 8. 不参加/オンラインの場合、afterPartyStatusをnullにする
    const finalAfterPartyStatus =
      status === "attending" ? afterPartyStatus : null;

    // 9. DB更新
    await rsvpRepo.updateRsvpResponse(rsvp.id, {
      status,
      afterPartyStatus: finalAfterPartyStatus,
      comment,
      respondedAt: now,
    });

    // 10. 管理画面のキャッシュ無効化
    revalidatePath(`/admin/events/${rsvp.eventId}`);

    return { success: true };
  } catch (error) {
    logServerError("submitRsvpAction", error);
    return { success: false, error: "回答の送信中にエラーが発生しました" };
  }
}

/**
 * 管理者によるRSVP更新（回答期限・受付停止に関わらず変更可能）
 */
export async function adminUpdateRsvpAction(
  formData: unknown
): Promise<AdminUpdateRsvpResult> {
  const parsed = adminRsvpUpdateSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const {
    rsvpId,
    eventId,
    status,
    afterPartyStatus,
    comment,
    adminNote,
    notifyCustomerByEmail,
    emailSubject,
    emailBody,
  } = parsed.data;

  try {
    const { admin } = await requireAuthenticatedAdmin();
    const hasAccess = await canAccessEvent(admin, eventId);
    if (!hasAccess) {
      return {
        success: false,
        error: "このイベントへのアクセス権がありません",
      };
    }

    const rsvp = await rsvpRepo.findRsvpByIdForAdmin(rsvpId, eventId);
    if (!rsvp) {
      return { success: false, error: "参加者が見つかりません" };
    }

    if (rsvp.customer.deletedAt) {
      return { success: false, error: "この顧客は削除されています" };
    }

    if (
      rsvp.event.hasAfterParty &&
      status === "attending" &&
      !afterPartyStatus
    ) {
      return {
        success: false,
        error: "懇親会の参加可否を選択してください",
      };
    }

    await rsvpRepo.updateRsvpResponse(rsvp.id, {
      status,
      afterPartyStatus: status === "attending" ? afterPartyStatus : null,
      comment,
      adminNote,
      respondedAt: new Date(),
    });

    let emailWarning: string | undefined;
    if (notifyCustomerByEmail) {
      try {
        const batchResult = await sendMailBatch({
          customers: [rsvp.customer],
          tokenMap: new Map([[rsvp.customer.id, rsvp.token]]),
          eventId,
          baseUrl: await getBaseUrl(),
          from: process.env.SMTP_FROM ?? "noreply@example.com",
          emailTitle: emailSubject?.trim() ?? "",
          emailBody: emailBody?.trim() ?? "",
        });

        if (batchResult.failedCount > 0) {
          emailWarning =
            "参加ステータスは更新しましたが、通知メールの送信に失敗しました";
        }
      } catch (error) {
        logServerError("adminUpdateRsvpAction:sendNotification", error);
        emailWarning =
          "参加ステータスは更新しましたが、通知メールの送信に失敗しました";
      }
    }

    revalidatePath(`/admin/events/${eventId}`);

    return emailWarning ? { success: true, emailWarning } : { success: true };
  } catch (error) {
    logServerError("adminUpdateRsvpAction", error);
    return {
      success: false,
      error: "参加ステータスの更新に失敗しました",
    };
  }
}
