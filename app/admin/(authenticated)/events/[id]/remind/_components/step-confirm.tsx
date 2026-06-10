"use client";

import Link from "next/link";
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
import { StepIndicator } from "../../invite/_components/step-indicator";
import { REMIND_STEPS } from "./step-recipients";
import type { SerializedEventForRemind } from "@/lib/types/serialized";
import type { useRemindForm } from "./use-remind-form";

interface StepConfirmProps {
  form: ReturnType<typeof useRemindForm>;
  event: SerializedEventForRemind;
}

export function StepConfirm({ form, event }: StepConfirmProps) {
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        backAction={() => form.setStep("email")}
        title={event.title}
        description="送信内容を確認して、テスト送信または送信を実行してください。"
      />

      <StepIndicator currentStep={form.step} steps={REMIND_STEPS} />

      <div className="space-y-6">
        <div className="space-y-4">
          <SectionHeading>送信先</SectionHeading>
          <p className="text-sm text-muted-foreground">{event.pendingCustomers.length}名に送信します</p>
          <div className="space-y-2 text-sm max-h-[300px] overflow-y-auto">
            {event.pendingCustomers.map((customer) => (
              <div key={customer.id}>
                <Link
                  href={`/admin/customers/${customer.id}?from=event`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {customer.lastName} {customer.firstName}
                </Link>
                {customer.company && ` (${customer.company})`}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeading>メール内容</SectionHeading>
          <div className="space-y-4">
            <div>
              <div className="font-medium mb-2">タイトル:</div>
              <div className="text-sm bg-muted p-3 rounded">{form.emailTitle}</div>
            </div>
            <div>
              <div className="font-medium mb-2">本文:</div>
              <div className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">{form.emailBody}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <ActionButton variant="outline" onClick={() => form.setStep("email")}>
            戻る
          </ActionButton>
          <ActionButton variant="outline" onClick={form.handleTestSend} disabled={form.isPending}>
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
                <DialogTitle>リマインドメールを送信しますか？</DialogTitle>
                <DialogDescription>
                  {event.pendingCustomers.length}名にリマインドメールを送信します。この操作は取り消せません。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => form.setConfirmOpen(false)}>
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
