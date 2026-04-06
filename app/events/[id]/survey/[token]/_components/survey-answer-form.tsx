"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
// ヘルパー
// ============================================================

const getRatingBoxClass = (selected: boolean) =>
  selected
    ? "border-blue-500 bg-blue-50 text-blue-900"
    : "border-muted bg-muted/50 hover:bg-accent hover:text-accent-foreground";

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
                <Stack key={question.id} gap="md">
                  <Label className="text-base font-medium">
                    {question.title}{" "}
                    <span className="text-destructive">*</span>
                  </Label>

                  <RadioGroup
                    value={questionAnswers[question.id]?.rating || ""}
                    onValueChange={(value) =>
                      updateQuestionAnswer(question.id, "rating", value)
                    }
                    className="grid grid-cols-4 gap-4"
                  >
                    {SURVEY_RATING_OPTIONS.map((rating) => (
                      <div key={rating}>
                        <RadioGroupItem
                          value={rating}
                          id={`question-${question.id}-${rating}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`question-${question.id}-${rating}`}
                          className={`flex flex-col items-center justify-center rounded-md border-2 px-4 py-6 cursor-pointer text-center transition-colors ${getRatingBoxClass(questionAnswers[question.id]?.rating === rating)}`}
                        >
                          <span className="font-semibold">
                            {SURVEY_RATING_LABELS[rating]}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <FormField label="上記を選んだ理由を、具体的に教えて下さい。">
                    <Textarea
                      id={`reason-${question.id}`}
                      value={questionAnswers[question.id]?.reason || ""}
                      onChange={(e) =>
                        updateQuestionAnswer(
                          question.id,
                          "reason",
                          e.target.value
                        )
                      }
                      rows={4}
                    />
                  </FormField>
                </Stack>
              ))}

              {/* 懇親会 */}
              {showAfterParty && (
                <Stack gap="md">
                  <Label className="text-base font-medium">懇親会</Label>

                  <RadioGroup
                    value={afterPartyRating || ""}
                    onValueChange={(value) =>
                      setAfterPartyRating(
                        value as typeof afterPartyRating
                      )
                    }
                    className="grid grid-cols-4 gap-4"
                  >
                    {SURVEY_RATING_OPTIONS.map((rating) => (
                      <div key={rating}>
                        <RadioGroupItem
                          value={rating}
                          id={`after-party-${rating}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`after-party-${rating}`}
                          className={`flex flex-col items-center justify-center rounded-md border-2 px-4 py-6 cursor-pointer text-center transition-colors ${getRatingBoxClass(afterPartyRating === rating)}`}
                        >
                          <span className="font-semibold">
                            {SURVEY_RATING_LABELS[rating]}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <FormField label="上記を選んだ理由を、具体的に教えて下さい。">
                    <Textarea
                      id="after-party-reason"
                      value={afterPartyReason}
                      onChange={(e) =>
                        setAfterPartyReason(e.target.value)
                      }
                      rows={4}
                    />
                  </FormField>
                </Stack>
              )}

              {/* 今後の参加について（必須） */}
              <Stack gap="md">
                <Label className="text-base font-medium">
                  今後の参加について{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <RadioGroup
                  value={futureParticipation || ""}
                  onValueChange={(value) =>
                    setFutureParticipation(
                      value as typeof futureParticipation
                    )
                  }
                  className="grid grid-cols-3 gap-4"
                >
                  {FUTURE_PARTICIPATION_OPTIONS.map((option) => (
                    <div key={option}>
                      <RadioGroupItem
                        value={option}
                        id={`future-participation-${option}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`future-participation-${option}`}
                        className={`flex flex-col items-center justify-center rounded-md border-2 px-4 py-6 cursor-pointer text-center transition-colors ${getRatingBoxClass(futureParticipation === option)}`}
                      >
                        <span className="font-semibold">
                          {FUTURE_PARTICIPATION_LABELS[option]}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <FormField label="上記を選んだ理由を、具体的に教えて下さい。">
                  <Textarea
                    id="future-participation-reason"
                    value={futureParticipationReason}
                    onChange={(e) =>
                      setFutureParticipationReason(e.target.value)
                    }
                    rows={4}
                  />
                </FormField>
              </Stack>

              {/* ベンチャー監査役の会への入会について */}
              {showMembership && (
                <Stack gap="md">
                  <Label className="text-base font-medium">
                    ベンチャー監査役の会への入会について
                  </Label>

                  <RadioGroup
                    value={membership || ""}
                    onValueChange={(value) =>
                      setMembership(value as typeof membership)
                    }
                    className="grid grid-cols-3 gap-4"
                  >
                    {MEMBERSHIP_INTEREST_OPTIONS.map((option) => (
                      <div key={option}>
                        <RadioGroupItem
                          value={option}
                          id={`membership-${option}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`membership-${option}`}
                          className={`flex flex-col items-center justify-center rounded-md border-2 px-4 py-6 cursor-pointer text-center transition-colors ${getRatingBoxClass(membership === option)}`}
                        >
                          <span className="font-semibold">
                            {MEMBERSHIP_INTEREST_LABELS[option]}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <FormField label="上記を選んだ理由を、具体的に教えて下さい。">
                    <Textarea
                      id="membership-reason"
                      value={membershipReason}
                      onChange={(e) =>
                        setMembershipReason(e.target.value)
                      }
                      rows={4}
                    />
                  </FormField>
                </Stack>
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
