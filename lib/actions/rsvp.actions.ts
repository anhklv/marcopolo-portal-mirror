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
import { COMMUNITY_CODE } from "@/lib/constants/community";
import { getBaseUrl } from "@/lib/helpers/base-url";
import { getCommunityNotificationRecipients } from "@/lib/mail/community-notification";
import { sendMail, sendMailBatch } from "@/lib/mail/send";
import {
  generateRsvpAdminNotification,
  type RsvpResponseSnapshot,
} from "@/lib/mail/templates/rsvp-admin-notification";
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

  const {
    token,
    status,
    afterPartyStatus,
    comment,
    termsAgreed,
    participationOptionId,
  } = parsed.data;

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

    // 7. ないかんMeetupの規約同意チェック
    if (
      rsvp.event.community.code === COMMUNITY_CODE.NAIKAN_MEETUP &&
      status !== "absent" &&
      termsAgreed !== true
    ) {
      return {
        success: false,
        error: "3つの確認事項すべてに同意してください",
      };
    }

    // 8. 参加内容チェック
    const isParticipating = status === "attending" || status === "online";
    if (
      isParticipating &&
      rsvp.event.participationMode === "required" &&
      !participationOptionId
    ) {
      return { success: false, error: "参加内容を選択してください" };
    }

    if (isParticipating && participationOptionId) {
      const isActiveOption = rsvp.event.participationOptions.some(
        (option) => option.id === participationOptionId
      );
      const isCurrentOption =
        rsvp.participationOptionId === participationOptionId;
      if (!isActiveOption && !isCurrentOption) {
        return { success: false, error: "参加内容の選択が不正です" };
      }
    }

    // 9. ビジネスロジック: 懇親会の回答必須チェック
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

    // 10. 不参加/オンラインの場合、afterPartyStatusをnullにする
    const finalAfterPartyStatus =
      status === "attending" ? afterPartyStatus : null;

    const finalParticipationOptionId = isParticipating
      ? participationOptionId
      : null;
    const selectedOption = finalParticipationOptionId
      ? rsvp.event.participationOptions.find(
          (option) => option.id === finalParticipationOptionId
        ) ?? rsvp.participationOption
      : null;
    const isInitialResponse = rsvp.respondedAt === null;
    const previous: RsvpResponseSnapshot = {
      status: rsvp.status,
      afterPartyStatus: rsvp.afterPartyStatus,
      participationOptionId: rsvp.participationOptionId,
      participationOptionLabel: rsvp.participationOption?.label ?? null,
      comment: rsvp.comment ?? null,
    };
    const current: RsvpResponseSnapshot = {
      status,
      afterPartyStatus: finalAfterPartyStatus,
      participationOptionId: finalParticipationOptionId,
      participationOptionLabel: selectedOption?.label ?? null,
      comment,
    };
    const hasChanged =
      previous.status !== current.status ||
      previous.afterPartyStatus !== current.afterPartyStatus ||
      previous.participationOptionId !== current.participationOptionId ||
      previous.comment !== current.comment;

    // 同じ回答の再送では、回答日時を更新せず通知も送信しない。
    if (!hasChanged) {
      return { success: true };
    }

    // 11. DB更新
    await rsvpRepo.updateRsvpResponse(rsvp.id, {
      status,
      afterPartyStatus: finalAfterPartyStatus,
      comment,
      participationOptionId: finalParticipationOptionId,
      respondedAt: now,
    });

    // 12. 管理画面のキャッシュ無効化
    revalidatePath(`/admin/events/${rsvp.eventId}`);

    // 初回回答は保存のみ行い、管理者向け通知は送信しない。
    if (isInitialResponse) {
      return { success: true };
    }

    // 13. コミュニティ別メーリングリストへ変更内容を直接通知する。
    // 通知失敗を理由に、保存済みのRSVPを参加者へ再送させない。
    const recipients = getCommunityNotificationRecipients(
      rsvp.event.community.code
    );
    if (recipients.length > 0) {
      try {
        const customerName = `${rsvp.customer.lastName} ${rsvp.customer.firstName}`;
        const mail = generateRsvpAdminNotification({
          communityName: rsvp.event.community.name,
          eventTitle: rsvp.event.title,
          eventDate: rsvp.event.date,
          participationOptionEnabled:
            rsvp.event.participationMode !== "disabled",
          hasAfterParty: rsvp.event.hasAfterParty,
          customerName,
          previous,
          current,
          respondedAt: now,
          adminEventUrl: `${(await getBaseUrl()).replace(/\/$/, "")}/admin/events/${rsvp.eventId}`,
        });
        const result = await sendMail({
          from:
            process.env.SMTP_FROM ?? "noreply@marcopolo-portal.jp",
          to: recipients,
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
        });
        if (!result.success) {
          logServerError(
            `submitRsvpAction:adminNotification rsvpId=${rsvp.id} eventId=${rsvp.eventId} community=${rsvp.event.community.code}`,
            new Error(result.error ?? "メール送信に失敗しました")
          );
        }
      } catch (error) {
        logServerError(
          `submitRsvpAction:adminNotification rsvpId=${rsvp.id} eventId=${rsvp.eventId} community=${rsvp.event.community.code}`,
          error
        );
      }
    }

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
    participationOptionId,
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

    const isParticipating = status === "attending" || status === "online";
    if (
      isParticipating &&
      rsvp.event.participationMode === "required" &&
      !participationOptionId
    ) {
      return { success: false, error: "参加内容を選択してください" };
    }

    if (isParticipating && participationOptionId) {
      const isActiveOption = rsvp.event.participationOptions.some(
        (option) => option.id === participationOptionId
      );
      const isCurrentOption =
        rsvp.participationOptionId === participationOptionId;
      if (!isActiveOption && !isCurrentOption) {
        return { success: false, error: "参加内容の選択が不正です" };
      }
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
      participationOptionId: isParticipating
        ? participationOptionId
        : null,
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
