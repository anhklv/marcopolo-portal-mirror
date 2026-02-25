"use client";

import { useState, useMemo, useTransition, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { SerializedEventForRemind } from "@/lib/types/serialized";
import { sendRemindAction, sendTestRemindAction } from "@/lib/actions/remind.actions";

// ============================================================
// 型定義
// ============================================================

export type RemindStep = "recipients" | "email" | "confirm";

export interface UseRemindFormProps {
  event: SerializedEventForRemind;
  adminEmail: string;
  defaultEmailTitle: string;
  defaultEmailBody: string;
}

// ============================================================
// Hook
// ============================================================

export function useRemindForm({
  event,
  adminEmail,
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
    return newStep === "recipients"
      ? `/admin/events/${event.id}/remind`
      : `/admin/events/${event.id}/remind?step=${newStep}`;
  }, [event.id]);

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

  const handleTestSend = () => {
    startTransition(async () => {
      try {
        const result = await sendTestRemindAction({
          eventId: event.id,
          emailTitle,
          emailBody,
        });
        if (result.success) {
          toast.success(`テストメールを ${adminEmail} に送信しました`);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("テスト送信中にエラーが発生しました");
      }
    });
  };

  const handleSend = () => {
    setConfirmOpen(false);
    startTransition(async () => {
      try {
        const result = await sendRemindAction({
          eventId: event.id,
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
    // アクション
    isPending,
    handleRecipientsNext,
    handleEmailNext,
    handleTestSend,
    handleSend,
  };
}
