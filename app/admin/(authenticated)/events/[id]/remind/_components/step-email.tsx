"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { ActionButton } from "@/components/ui/action-button";
import { FormField } from "@/components/ui/form-field";
import { SectionHeading } from "@/components/ui/section-heading";
import { StepIndicator } from "../../invite/_components/step-indicator";
import { REMIND_STEPS } from "./step-recipients";
import type { SerializedEventForRemind } from "@/lib/types/serialized";
import type { useRemindForm } from "./use-remind-form";

interface StepEmailProps {
  event: SerializedEventForRemind;
  form: ReturnType<typeof useRemindForm>;
}

export function StepEmail({ event, form }: StepEmailProps) {
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        backAction={() => form.setStep("recipients")}
        title={event.title}
        description="リマインドメールのタイトルと本文を編集できます。"
      />

      <StepIndicator currentStep={form.step} steps={REMIND_STEPS} />

      <div className="space-y-6">
        <div className="space-y-2">
          <SectionHeading>メール文作成</SectionHeading>
          <p className="text-sm text-muted-foreground">送信するメールのタイトルと本文を編集してください。</p>
        </div>

        <FormField label="メールタイトル">
          <Input value={form.emailTitle} onChange={(e) => form.setEmailTitle(e.target.value)} placeholder="メールタイトルを入力" />
        </FormField>

        <FormField
          label="メール本文"
          description="{RSVP_URL} は送信時に顧客ごとの回答URLに自動置換されます。"
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
          <ActionButton variant="outline" onClick={() => form.setStep("recipients")}>
            戻る
          </ActionButton>
          <ActionButton onClick={form.handleEmailNext}>次へ</ActionButton>
        </div>
      </div>
    </div>
  );
}
