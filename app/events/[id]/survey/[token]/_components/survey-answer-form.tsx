"use client";

import { Textarea } from "@/components/ui/textarea";
import { Stack } from "@/components/ui/stack";
import { FormField } from "@/components/ui/form-field";
import { ActionButton } from "@/components/ui/action-button";
import { CheckCircle2 } from "lucide-react";
import { formatEventDate } from "@/lib/utils/event";
import {
  SURVEY_RATING_OPTIONS,
  SURVEY_RATING_LABELS,
  FUTURE_PARTICIPATION_OPTIONS,
  FUTURE_PARTICIPATION_LABELS,
  MEMBERSHIP_INTEREST_OPTIONS,
  MEMBERSHIP_INTEREST_LABELS,
} from "@/lib/constants/survey";
import { SurveyRatingField } from "./survey-rating-field";
import { useSurveyAnswerForm } from "./use-survey-answer-form";
import type { SerializedSurveyAnswerPageData } from "@/lib/types/serialized";

// ============================================================
// Props
// ============================================================

interface SurveyAnswerFormProps {
  data: SerializedSurveyAnswerPageData;
  isPreview?: boolean;
}

// ============================================================
// メインコンポーネント
// ============================================================

export function SurveyAnswerForm({
  data,
  isPreview = false,
}: SurveyAnswerFormProps) {
  const {
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
  } = useSurveyAnswerForm({ data, isPreview });

  const { event } = data;

  // 完了画面
  if (submitted) {
    return (
      <div className="min-h-screen bg-muted py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-lg border bg-card p-6 shadow-sm text-center">
            <Stack gap="md">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                回答ありがとうございました
              </h1>
              <p className="text-sm text-muted-foreground">
                アンケートへのご回答を受け付けました。
              </p>
            </Stack>
          </div>
        </div>
      </div>
    );
  }

  // 回答フォーム
  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Stack gap="lg">
          {/* イベント情報 */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight">
              {event.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              開催日時: {formatEventDate(event.date)}
            </p>
          </div>

          {/* アンケートフォーム */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <Stack gap="xl">
              <div>
                <h2 className="text-lg font-semibold">アンケート</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  ご回答をお願いいたします。
                </p>
              </div>

              {/* 管理者設問 */}
              {data.survey.questions.map((question) => (
                <SurveyRatingField
                  key={question.id}
                  label={question.title}
                  required
                  options={SURVEY_RATING_OPTIONS}
                  labels={SURVEY_RATING_LABELS}
                  value={questionAnswers[question.id]?.rating || null}
                  onValueChange={(value) =>
                    updateQuestionAnswer(question.id, "rating", value)
                  }
                  reason={questionAnswers[question.id]?.reason || ""}
                  onReasonChange={(value) =>
                    updateQuestionAnswer(question.id, "reason", value)
                  }
                  idPrefix={`question-${question.id}`}
                />
              ))}

              {/* 懇親会 */}
              {showAfterParty && (
                <SurveyRatingField
                  label="懇親会"
                  options={SURVEY_RATING_OPTIONS}
                  labels={SURVEY_RATING_LABELS}
                  value={afterPartyRating}
                  onValueChange={(value) =>
                    setAfterPartyRating(value as typeof afterPartyRating)
                  }
                  reason={afterPartyReason}
                  onReasonChange={setAfterPartyReason}
                  idPrefix="after-party"
                />
              )}

              {/* 今後の参加について（必須） */}
              <SurveyRatingField
                label="今後の参加について"
                required
                options={FUTURE_PARTICIPATION_OPTIONS}
                labels={FUTURE_PARTICIPATION_LABELS}
                value={futureParticipation}
                onValueChange={(value) =>
                  setFutureParticipation(value as typeof futureParticipation)
                }
                reason={futureParticipationReason}
                onReasonChange={setFutureParticipationReason}
                idPrefix="future-participation"
                cols={3}
              />

              {/* ベンチャー監査役の会への入会について */}
              {showMembership && (
                <SurveyRatingField
                  label="ベンチャー監査役の会への入会について"
                  options={MEMBERSHIP_INTEREST_OPTIONS}
                  labels={MEMBERSHIP_INTEREST_LABELS}
                  value={membership}
                  onValueChange={(value) =>
                    setMembership(value as typeof membership)
                  }
                  reason={membershipReason}
                  onReasonChange={setMembershipReason}
                  idPrefix="membership"
                  cols={3}
                />
              )}

              {/* ご意見・ご提案・感想等 */}
              <div className="border-t pt-6">
                <FormField label="さいごに、ご意見・ご提案・感想等があればお聞かせください。">
                  <Textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={6}
                  />
                </FormField>
              </div>

              {/* 送信ボタン */}
              <div className="flex justify-center pt-4">
                <ActionButton
                  onClick={handleSubmit}
                  disabled={isPending}
                >
                  {isPending ? "送信中..." : "送信"}
                </ActionButton>
              </div>
            </Stack>
          </div>
        </Stack>
      </div>
    </div>
  );
}
