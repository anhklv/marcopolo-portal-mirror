"use client";

import { useState, useMemo, useTransition, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { SerializedEventForRemind } from "@/lib/types/serialized";
import type { AdminForTestSend } from "@/lib/types/test-send";
import { sendRemindAction, sendTestRemindAction } from "@/lib/actions/remind.actions";
import { useTestSendDialog } from "@/app/admin/(authenticated)/events/_components/use-test-send-dialog";

// ============================================================
// 型定義
// ============================================================

export type RemindStep = "recipients" | "email" | "confirm";

export interface UseRemindFormProps {
  event: SerializedEventForRemind;
  testSendAdmins: AdminForTestSend[];
  defaultEmailTitle: string;
  defaultEmailBody: string;
}

// ============================================================
// Hook
// ============================================================

export function useRemindForm({
  event,
  testSendAdmins,
  defaultEmailTitle,
  defaultEmailBody,
}: UseRemindFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // ステップ管理（URLベース: ?step=email, ?step=confirm, デフォルトはrecipients）
  const rawStep = searchParams.get("step");
  const urlStep: RemindStep = (rawStep === "email" || rawStep === "confirm") ? rawStep : "recipients";

  const buildStepUrl = useCallback((newStep: RemindStep) => {
    const targetQuery = `target=${event.remindTarget}`;
    return newStep === "recipients"
      ? `/admin/events/${event.id}/remind?${targetQuery}`
      : `/admin/events/${event.id}/remind?${targetQuery}&step=${newStep}`;
  }, [event.id, event.remindTarget]);

  const setStep = useCallback((newStep: RemindStep) => {
    router.push(buildStepUrl(newStep));
  }, [router, buildStepUrl]);

  const replaceStep = useCallback((newStep: RemindStep) => {
    router.replace(buildStepUrl(newStep));
  }, [router, buildStepUrl]);

  // フォーム状態
  const [emailTitle, setEmailTitle] = useState(defaultEmailTitle);
  const [emailBody, setEmailBody] = useState(defaultEmailBody);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const sendTestMail = useCallback(
    (adminIds: number[]) =>
      sendTestRemindAction({
        eventId: event.id,
        adminIds,
        emailTitle,
        emailBody,
      }),
    [emailBody, emailTitle, event.id]
  );
  const testSendDialog = useTestSendDialog({ onSend: sendTestMail });

  // リロード時フォールバック: pendingCustomersがいなければrecipientsに戻す
  const step: RemindStep = useMemo(() => {
    if (urlStep === "email" && event.pendingCustomers.length === 0) return "recipients";
    if (urlStep === "confirm" && (event.pendingCustomers.length === 0 || !emailTitle.trim() || !emailBody.trim())) return "recipients";
    return urlStep;
  }, [urlStep, event.pendingCustomers.length, emailTitle, emailBody]);

  useEffect(() => {
    if (step !== urlStep) replaceStep(step);
  }, [step, urlStep, replaceStep]);

  // ============================================================
  // ハンドラ
  // ============================================================

  const handleRecipientsNext = () => {
    setStep("email");
  };

  const handleEmailNext = () => {
    if (!emailTitle.trim()) {
      toast.error("メールタイトルを入力してください");
      return;
    }
    if (!emailBody.trim()) {
      toast.error("メール本文を入力してください");
      return;
    }
    setStep("confirm");
  };

  const handleSend = () => {
    setConfirmOpen(false);
    startTransition(async () => {
      try {
        const result = await sendRemindAction({
          eventId: event.id,
          target: event.remindTarget,
          emailTitle,
          emailBody,
        });
        if (result.success) {
          const msg =
            result.failedCount > 0
              ? `${result.sentCount}名に送信しました（${result.failedCount}名失敗: ${result.failedNames.join(", ")}）`
              : `${result.sentCount}名にリマインドメールを送信しました`;
          toast.success(msg);
          router.push(`/admin/events/${event.id}`);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("リマインドメールの送信中にエラーが発生しました");
      }
    });
  };

  return {
    // ステップ
    step,
    setStep,
    // フォーム値
    emailTitle,
    setEmailTitle,
    emailBody,
    setEmailBody,
    // ダイアログ
    confirmOpen,
    setConfirmOpen,
    testSendAdmins,
    testSendDialog,
    // アクション
    isPending,
    handleRecipientsNext,
    handleEmailNext,
    handleSend,
  };
}
