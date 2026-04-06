"use server";

import { surveyAnswerSchema } from "@/lib/validations/survey-answer";
import * as surveyRepo from "@/lib/repositories/survey.repository";
import { COMMUNITY_CODE } from "@/lib/constants/community";

type SubmitSurveyAnswerResult =
  | { success: true }
  | { success: false; error: string };

export async function submitSurveyAnswerAction(
  formData: unknown
): Promise<SubmitSurveyAnswerResult> {
  // 1. バリデーション
  const parsed = surveyAnswerSchema.safeParse(formData);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message);
    return { success: false, error: messages[0] };
  }

  const data = parsed.data;

  try {
    // 2. トークンでDB取得
    const surveyToken = await surveyRepo.findSurveyTokenByToken(data.token);
    if (!surveyToken) {
      return { success: false, error: "無効なトークンです" };
    }

    const { survey, customer } = surveyToken;
    const event = survey.event;

    // 3. イベント論理削除チェック
    if (event.deletedAt) {
      return { success: false, error: "このイベントは終了しました" };
    }

    // 4. 顧客論理削除チェック
    if (customer.deletedAt) {
      return { success: false, error: "アクセスできません" };
    }

    // 5. 二重回答チェック
    const alreadyResponded = await surveyRepo.findExistingResponses(
      survey.id,
      customer.id
    );
    if (alreadyResponded) {
      return { success: false, error: "既に回答済みです" };
    }

    // 6. questionId 重複チェック
    const submittedIds = data.questionResponses.map((qr) => qr.questionId);
    if (new Set(submittedIds).size !== submittedIds.length) {
      return { success: false, error: "設問IDが重複しています" };
    }

    // 7. questionId 整合性チェック
    const validQuestionIds = new Set(survey.questions.map((q) => q.id));
    const allQuestionsValid = data.questionResponses.every((qr) =>
      validQuestionIds.has(qr.questionId)
    );
    if (!allQuestionsValid) {
      return { success: false, error: "不正な設問が含まれています" };
    }

    // 8. 設問数一致チェック
    if (data.questionResponses.length !== survey.questions.length) {
      return {
        success: false,
        error: "すべての設問に回答してください",
      };
    }

    // 9. 条件付き設問のサーバー側正規化
    const isMemberOfVentureAuditor = customer.customerCommunities.some(
      (cc) =>
        cc.community.code === COMMUNITY_CODE.VENTURE_AUDITOR &&
        cc.resignedAt === null
    );
    const finalAfterPartyRating = event.hasAfterParty
      ? (data.afterPartyRating ?? null)
      : null;
    const finalAfterPartyReason = event.hasAfterParty
      ? (data.afterPartyReason ?? null)
      : null;
    const showMembership =
      event.community.code === COMMUNITY_CODE.VENTURE_AUDITOR &&
      !isMemberOfVentureAuditor;
    const finalMembership = showMembership
      ? (data.membership ?? null)
      : null;
    const finalMembershipReason = showMembership
      ? (data.membershipReason ?? null)
      : null;

    // 10. DB保存
    await surveyRepo.saveSurveyResponses({
      surveyTokenId: surveyToken.id,
      surveyId: survey.id,
      customerId: customer.id,
      questionResponses: data.questionResponses.map((qr) => ({
        questionId: qr.questionId,
        rating: qr.rating,
        reason: qr.reason ?? null,
      })),
      afterPartyRating: finalAfterPartyRating,
      afterPartyReason: finalAfterPartyReason,
      futureParticipation: data.futureParticipation,
      futureParticipationReason: data.futureParticipationReason ?? null,
      membership: finalMembership,
      membershipReason: finalMembershipReason,
      comments: data.comments ?? null,
    });

    return { success: true };
  } catch (error) {
    console.error("submitSurveyAnswerAction error:", error);
    return { success: false, error: "回答の送信中にエラーが発生しました" };
  }
}
