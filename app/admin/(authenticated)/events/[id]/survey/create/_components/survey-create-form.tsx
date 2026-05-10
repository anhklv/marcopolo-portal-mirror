"use client";

import Link from "next/link";
import { Plus, Trash2, Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { ActionButton } from "@/components/ui/action-button";
import { useSurveyForm, type QuestionItem } from "./use-survey-form";

type SurveyCreateFormProps = {
  eventId: number;
  initialQuestions: QuestionItem[];
};

export function SurveyCreateForm({ eventId, initialQuestions }: SurveyCreateFormProps) {
  const {
    isPending,
    questions,
    fieldErrors,
    generalError,
    addQuestion,
    removeQuestion,
    updateQuestionTitle,
    handleSave,
    handlePreview,
    handleSkip,
  } = useSurveyForm({ eventId, initialQuestions });

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        backHref={`/admin/events/${eventId}`}
        title="アンケート管理"
        description="アンケートの設問を編集します。固定の質問があるため、設問を設定しなくてもアンケート案内は可能です。"
      />

      <div className="space-y-4">
        <div className="space-y-2">
          <SectionHeading>アンケート設問</SectionHeading>
          <p className="text-sm text-muted-foreground">
            設問を追加してアンケートを作成します。各設問には評価と理由を入力してもらいます。
          </p>
        </div>

        {generalError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {generalError}
          </div>
        )}

        <div className="space-y-4">
          {questions.map((question, index) => (
            <div
              key={question.clientId}
              className="flex flex-col gap-2 p-4 border rounded-lg bg-card"
            >
              <Label htmlFor={`question-${question.clientId}`}>
                設問 {index + 1}
              </Label>
              <div className="flex min-w-0 items-center gap-4">
                <Input
                  id={`question-${question.clientId}`}
                  className="min-w-0 flex-1"
                  value={question.title}
                  onChange={(e) => updateQuestionTitle(question.clientId, e.target.value)}
                  placeholder="設問タイトルを入力"
                  disabled={isPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeQuestion(question.clientId)}
                  disabled={isPending}
                  aria-label={`設問${index + 1}を削除`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {fieldErrors[`questions.${index}.title`] && (
                <p className="text-sm text-destructive">
                  {fieldErrors[`questions.${index}.title`][0]}
                </p>
              )}
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addQuestion}
            className="w-full"
            disabled={isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            設問を追加
          </Button>
        </div>
      </div>

      <div className="flex justify-center gap-4 flex-wrap">
        <ActionButton variant="outline" asChild>
          <Link href={`/admin/events/${eventId}`}>キャンセル</Link>
        </ActionButton>
        <ActionButton variant="outline" onClick={handlePreview} disabled={isPending}>
          <Eye className="h-4 w-4 mr-2" />
          プレビュー
        </ActionButton>
        <ActionButton variant="outline" onClick={handleSkip} disabled={isPending}>
          スキップしてアンケートを送る
        </ActionButton>
        <ActionButton onClick={handleSave} disabled={isPending}>
          <Save className="h-4 w-4 mr-2" />
          保存
        </ActionButton>
      </div>
    </div>
  );
}
