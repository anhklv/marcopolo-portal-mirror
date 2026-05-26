"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Send, Mail } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ActionButton } from "@/components/ui/action-button";
import { SectionHeading } from "@/components/ui/section-heading";
import { StepIndicator } from "@/app/admin/(authenticated)/events/[id]/invite/_components/step-indicator";
import { SURVEY_STEPS } from "@/lib/constants/survey";
import type { SerializedEventForSurvey } from "@/lib/types/serialized";
import type { useSurveySendForm } from "./use-survey-send-form";

interface StepConfirmProps {
  event: SerializedEventForSurvey;
  form: ReturnType<typeof useSurveySendForm>;
}

export function StepConfirm({ event, form }: StepConfirmProps) {
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        backAction={() => form.setStep("email")}
        title={event.title}
        description="送信内容を確認して、テスト送信または送信を実行してください。"
      />

      <StepIndicator currentStep={form.step} steps={SURVEY_STEPS} />

      <div className="space-y-6">
        <div className="space-y-4">
          <SectionHeading>送信先</SectionHeading>
          <p className="text-sm text-muted-foreground">
            {form.selectedAttendees.length}名に送信します
          </p>
          <div className="space-y-2 text-sm max-h-[300px] overflow-y-auto">
            {form.selectedAttendees.map((attendee) => (
              <div key={attendee.id}>
                {attendee.lastName} {attendee.firstName}
                {attendee.company && ` (${attendee.company})`}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeading>メール内容</SectionHeading>
          <div className="space-y-4">
            <div>
              <div className="font-medium mb-2">タイトル:</div>
              <div className="text-sm bg-muted p-3 rounded">
                {form.emailTitle}
              </div>
            </div>
            <div>
              <div className="font-medium mb-2">本文:</div>
              <div className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">
                {form.emailBody}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <ActionButton
            variant="outline"
            onClick={() => form.setStep("email")}
          >
            戻る
          </ActionButton>
          <ActionButton
            variant="outline"
            onClick={form.handleTestSend}
            disabled={form.isPending}
          >
            <Mail className="h-4 w-4" />
            テスト送信
          </ActionButton>
          <Dialog open={form.confirmOpen} onOpenChange={form.setConfirmOpen}>
            <DialogTrigger asChild>
              <ActionButton disabled={form.isPending}>
                <Send className="h-4 w-4" />
                送信
              </ActionButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>アンケートメールを送信しますか？</DialogTitle>
                <DialogDescription>
                  {form.selectedAttendees.length}
                  名にアンケートメールを送信します。この操作は取り消せません。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => form.setConfirmOpen(false)}
                >
                  キャンセル
                </Button>
                <Button onClick={form.handleSend} disabled={form.isPending}>
                  {form.isPending ? "送信中..." : "送信する"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
