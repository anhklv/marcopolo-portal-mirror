"use server";

import { revalidatePath } from "next/cache";
import { rsvpResponseSchema } from "@/lib/validations/rsvp";
import * as rsvpRepo from "@/lib/repositories/rsvp.repository";
import { logServerError } from "@/lib/utils/log-error";

// ============================================================
// 型定義
// ============================================================

type SubmitRsvpResult =
  | { success: true }
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
