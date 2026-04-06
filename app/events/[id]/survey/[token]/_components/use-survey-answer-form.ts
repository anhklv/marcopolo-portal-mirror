"use client";

import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { submitSurveyAnswerAction } from "@/lib/actions/survey-answer.actions";
import { COMMUNITY_CODE } from "@/lib/constants/community";
import type { SerializedSurveyAnswerPageData } from "@/lib/types/serialized";
import type {
  SurveyRating,
  FutureParticipation,
  MembershipInterest,
} from "@/lib/generated/prisma";

// ============================================================
// 型定義
// ============================================================

interface QuestionAnswer {
  rating: SurveyRating | "";
  reason: string;
}

interface UseSurveyAnswerFormProps {
  data: SerializedSurveyAnswerPageData;
  isPreview?: boolean;
}

// ============================================================
// カスタムフック
// ============================================================

export function useSurveyAnswerForm({
  data,
  isPreview = false,
}: UseSurveyAnswerFormProps) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  // 管理者設問の回答
  const [questionAnswers, setQuestionAnswers] = useState<
    Record<number, QuestionAnswer>
  >(() => {
    const initial: Record<number, QuestionAnswer> = {};
    data.survey.questions.forEach((q) => {
      initial[q.id] = { rating: "", reason: "" };
    });
    return initial;
  });

  // 固定設問
  const [afterPartyRating, setAfterPartyRating] = useState<
    SurveyRating | ""
  >("");
  const [afterPartyReason, setAfterPartyReason] = useState("");
  const [futureParticipation, setFutureParticipation] = useState<
    FutureParticipation | ""
  >("");
  const [futureParticipationReason, setFutureParticipationReason] =
    useState("");
  const [membership, setMembership] = useState<MembershipInterest | "">(
    ""
  );
  const [membershipReason, setMembershipReason] = useState("");
  const [comments, setComments] = useState("");

  // 表示フラグ
  const showAfterParty = data.event.hasAfterParty;
  const showMembership = useMemo(
    () =>
      data.event.community.code === COMMUNITY_CODE.VENTURE_AUDITOR &&
      !data.customer.isMemberOfVentureAuditor,
    [data.event.community.code, data.customer.isMemberOfVentureAuditor]
  );

  // 設問回答の更新
  const updateQuestionAnswer = (
    questionId: number,
    field: "rating" | "reason",
    value: string
  ) => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }));
  };

  // 送信
  const handleSubmit = () => {
    // クライアント側バリデーション: 管理者設問の rating 必須
    const allAnswered = data.survey.questions.every(
      (q) => questionAnswers[q.id]?.rating
    );
    if (!allAnswered) {
      toast.error("すべての設問に回答してください");
      return;
    }

    // 今後の参加は必須
    if (!futureParticipation) {
      toast.error("今後の参加について回答してください");
      return;
    }

    // プレビューモードは送信しない
    if (isPreview) {
      setSubmitted(true);
      toast.success("アンケートにご回答いただき、ありがとうございました");
      return;
    }

    startTransition(async () => {
      try {
        const result = await submitSurveyAnswerAction({
          token: data.surveyToken.token,
          questionResponses: data.survey.questions.map((q) => ({
            questionId: q.id,
            rating: questionAnswers[q.id].rating as SurveyRating,
            reason: questionAnswers[q.id].reason || undefined,
          })),
          afterPartyRating: afterPartyRating || undefined,
          afterPartyReason: afterPartyReason || undefined,
          futureParticipation,
          futureParticipationReason:
            futureParticipationReason || undefined,
          membership: membership || undefined,
          membershipReason: membershipReason || undefined,
          comments: comments || undefined,
        });

        if (result.success) {
          setSubmitted(true);
          toast.success(
            "アンケートにご回答いただき、ありがとうございました"
          );
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("エラーが発生しました");
      }
    });
  };

  return {
    isPending,
    submitted,
    questionAnswers,
    afterPartyRating,
    setAfterPartyRating,
    afterPartyReason,
    setAfterPartyReason,
    futureParticipation,
    setFutureParticipation,
    futureParticipationReason,
    setFutureParticipationReason,
    membership,
    setMembership,
    membershipReason,
    setMembershipReason,
    comments,
    setComments,
    showAfterParty,
    showMembership,
    updateQuestionAnswer,
    handleSubmit,
  };
}
