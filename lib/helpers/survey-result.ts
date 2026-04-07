// アンケート結果画面のヘルパー関数（純粋関数、テスト対象）

import type {
  SurveyRating,
  FutureParticipation,
  MembershipInterest,
} from "@/lib/generated/prisma";
import {
  SURVEY_RATING_OPTIONS,
  SURVEY_RATING_LABELS,
  FUTURE_PARTICIPATION_OPTIONS,
  FUTURE_PARTICIPATION_LABELS,
  MEMBERSHIP_INTEREST_OPTIONS,
  MEMBERSHIP_INTEREST_LABELS,
} from "@/lib/constants/survey";
import { COMMUNITY_CODE } from "@/lib/constants/community";
import type { SerializedSurveyResult } from "@/lib/types/serialized";

// ============================================================
// 型定義
// ============================================================

export interface RatingCount {
  key: string;
  label: string;
  count: number;
}

export interface QuestionAggregation {
  questionId: number;
  title: string;
  ratingCounts: RatingCount[];
}

export interface SurveyAggregation {
  questions: QuestionAggregation[];
  afterParty: RatingCount[] | null;
  futureParticipation: RatingCount[] | null;
  membership: RatingCount[] | null;
}

export interface SurveyResultRow {
  customerId: number;
  lastName: string;
  firstName: string;
  company: string | null;
  isMemberOfVentureAuditor: boolean;
  questionResponses: Map<
    number,
    { rating: string | null; reason: string | null }
  >;
  afterPartyRating: string | null;
  afterPartyReason: string | null;
  futureParticipation: string | null;
  futureParticipationReason: string | null;
  membership: string | null;
  membershipReason: string | null;
  comments: string | null;
  respondedAt: string | null;
}

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * 集計データを計算
 */
export function computeSurveyAggregation(
  data: SerializedSurveyResult,
  hasAfterParty: boolean,
  communityCode: string
): SurveyAggregation {
  const nonMemberIds = new Set(
    data.respondents
      .filter((r) => !r.isMemberOfVentureAuditor)
      .map((r) => r.id)
  );

  // カスタム設問ごとの評価カウント
  const questions: QuestionAggregation[] = data.questions.map((q) => {
    const responses = data.questionResponses.filter(
      (qr) => qr.questionId === q.id
    );
    const ratingCounts: RatingCount[] = SURVEY_RATING_OPTIONS.map((key) => ({
      key,
      label: SURVEY_RATING_LABELS[key],
      count: responses.filter((r) => r.rating === key).length,
    }));
    return { questionId: q.id, title: q.title, ratingCounts };
  });

  // 懇親会
  let afterParty: RatingCount[] | null = null;
  if (hasAfterParty) {
    afterParty = SURVEY_RATING_OPTIONS.map((key) => ({
      key,
      label: SURVEY_RATING_LABELS[key],
      count: data.fixedResponses.filter((fr) => fr.afterPartyRating === key)
        .length,
    }));
  }

  // 今後の参加（非会員のみ）
  let futureParticipation: RatingCount[] | null = null;
  if (nonMemberIds.size > 0) {
    futureParticipation = FUTURE_PARTICIPATION_OPTIONS.map((key) => ({
      key,
      label: FUTURE_PARTICIPATION_LABELS[key],
      count: data.fixedResponses.filter(
        (fr) =>
          nonMemberIds.has(fr.customerId) &&
          fr.futureParticipation === key
      ).length,
    }));
  }

  // 入会について（ベンチャー監査役の会の非会員のみ）
  let membership: RatingCount[] | null = null;
  if (nonMemberIds.size > 0 && communityCode === COMMUNITY_CODE.VENTURE_AUDITOR) {
    membership = MEMBERSHIP_INTEREST_OPTIONS.map((key) => ({
      key,
      label: MEMBERSHIP_INTEREST_LABELS[key],
      count: data.fixedResponses.filter(
        (fr) =>
          nonMemberIds.has(fr.customerId) &&
          fr.membership === key
      ).length,
    }));
  }

  return { questions, afterParty, futureParticipation, membership };
}

/**
 * テーブル表示用の行データに変換
 */
export function toSurveyResultRows(
  data: SerializedSurveyResult
): SurveyResultRow[] {
  return data.respondents.map((respondent) => {
    const fixedResponse = data.fixedResponses.find(
      (fr) => fr.customerId === respondent.id
    );
    const qrMap = new Map<
      number,
      { rating: string | null; reason: string | null }
    >();
    for (const qr of data.questionResponses) {
      if (qr.customerId === respondent.id) {
        qrMap.set(qr.questionId, { rating: qr.rating, reason: qr.reason });
      }
    }

    return {
      customerId: respondent.id,
      lastName: respondent.lastName,
      firstName: respondent.firstName,
      company: respondent.company,
      isMemberOfVentureAuditor: respondent.isMemberOfVentureAuditor,
      questionResponses: qrMap,
      afterPartyRating: fixedResponse?.afterPartyRating ?? null,
      afterPartyReason: fixedResponse?.afterPartyReason ?? null,
      futureParticipation: fixedResponse?.futureParticipation ?? null,
      futureParticipationReason:
        fixedResponse?.futureParticipationReason ?? null,
      membership: fixedResponse?.membership ?? null,
      membershipReason: fixedResponse?.membershipReason ?? null,
      comments: fixedResponse?.comments ?? null,
      respondedAt: fixedResponse?.respondedAt ?? null,
    };
  }).sort((a, b) => {
    if (!a.respondedAt && !b.respondedAt) return 0;
    if (!a.respondedAt) return 1;
    if (!b.respondedAt) return -1;
    return b.respondedAt.localeCompare(a.respondedAt);
  });
}

/**
 * 評価値に対応するBadge背景色クラスを返す
 */
export function getSurveyRatingBgClass(rating: string | null): string {
  switch (rating as SurveyRating | FutureParticipation | MembershipInterest | null) {
    case "excellent":
    case "definitely_yes":
    case "want_to_join":
      return "!bg-gray-50 !text-gray-800";
    case "good":
    case "considering":
      return "!bg-gray-100 !text-gray-800";
    case "fair":
    case "not_interested":
      return "!bg-gray-200 !text-gray-800";
    case "poor":
    case "no":
      return "!bg-gray-300 !text-gray-800";
    default:
      return "";
  }
}
