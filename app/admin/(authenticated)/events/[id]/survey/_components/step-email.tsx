"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { ActionButton } from "@/components/ui/action-button";
import { FormField } from "@/components/ui/form-field";
import { SectionHeading } from "@/components/ui/section-heading";
import { StepIndicator } from "@/app/admin/(authenticated)/events/[id]/invite/_components/step-indicator";
import { SURVEY_STEPS } from "@/lib/constants/survey";
import type { SerializedEventForSurvey } from "@/lib/types/serialized";
import type { useSurveySendForm } from "./use-survey-send-form";

interface StepEmailProps {
  event: SerializedEventForSurvey;
  form: ReturnType<typeof useSurveySendForm>;
}

export function StepEmail({ event, form }: StepEmailProps) {
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        backAction={() => form.setStep("select")}
        title={event.title}
        description="アンケートメールのタイトルと本文を編集できます。"
      />

      <StepIndicator currentStep={form.step} steps={SURVEY_STEPS} />

      <div className="space-y-6">
        <div className="space-y-2">
          <SectionHeading>メール文を作成</SectionHeading>
          <p className="text-sm text-muted-foreground">
            送信するメールのタイトルと本文を編集してください。
          </p>
        </div>

        <FormField label="メールタイトル">
          <Input
            value={form.emailTitle}
            onChange={(e) => form.setEmailTitle(e.target.value)}
            placeholder="メールタイトルを入力"
          />
        </FormField>

        <FormField
          label="メール本文"
          description="{SURVEY_URL} はアンケートURL、{CUSTOMER_NAME} は姓 名に、送信時に顧客ごとに自動置換されます（例: {CUSTOMER_NAME}様 → 山田 太郎様）。"
        >
          <Textarea
            value={form.emailBody}
            onChange={(e) => form.setEmailBody(e.target.value)}
            placeholder="メール本文を入力"
            rows={30}
            className="min-h-[480px]"
          />
        </FormField>

        <div className="flex justify-center gap-4 pt-4">
          <ActionButton
            variant="outline"
            onClick={() => form.setStep("select")}
          >
            戻る
          </ActionButton>
          <ActionButton onClick={form.handleCustomizeNext}>次へ</ActionButton>
        </div>
      </div>
    </div>
  );
}
