"use client";

import { useState, useMemo, useTransition, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type {
  SerializedEventForSurvey,
  SerializedAttendee,
} from "@/lib/types/serialized";
import {
  sendSurveyAction,
  sendTestSurveyAction,
} from "@/lib/actions/survey-send.actions";

// ============================================================
// 型定義
// ============================================================

export type Step = "select" | "email" | "confirm";

export interface UseSurveySendFormProps {
  event: SerializedEventForSurvey;
  attendees: SerializedAttendee[];
  adminEmail: string;
  defaultEmailTitle: string;
  defaultEmailBody: string;
}

// ============================================================
// Hook
// ============================================================

export function useSurveySendForm({
  event,
  attendees,
  adminEmail,
  defaultEmailTitle,
  defaultEmailBody,
}: UseSurveySendFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // ステップ管理（URLベース）
  const rawStep = searchParams.get("step");
  const urlStep: Step =
    rawStep === "email" || rawStep === "confirm" ? rawStep : "select";

  const buildStepUrl = useCallback(
    (newStep: Step) => {
      return newStep === "select"
        ? `/admin/events/${event.id}/survey`
        : `/admin/events/${event.id}/survey?step=${newStep}`;
    },
    [event.id]
  );

  const setStep = useCallback(
    (newStep: Step) => {
      router.push(buildStepUrl(newStep));
    },
    [router, buildStepUrl]
  );

  const replaceStep = useCallback(
    (newStep: Step) => {
      router.replace(buildStepUrl(newStep));
    },
    [router, buildStepUrl]
  );

  // 選択状態（初期値: 全参加者を選択）
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<number[]>(
    () => attendees.map((a) => a.id)
  );
  const [emailTitle, setEmailTitle] = useState(defaultEmailTitle);
  const [emailBody, setEmailBody] = useState(defaultEmailBody);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 確認画面用: 選択済み参加者情報
  const selectedAttendees = useMemo(() => {
    return attendees.filter((a) => selectedAttendeeIds.includes(a.id));
  }, [attendees, selectedAttendeeIds]);

  // リロード時フォールバック
  const step: Step = useMemo(() => {
    if (urlStep === "email" && selectedAttendeeIds.length === 0)
      return "select";
    if (
      urlStep === "confirm" &&
      (selectedAttendeeIds.length === 0 ||
        !emailTitle.trim() ||
        !emailBody.trim())
    )
      return "select";
    return urlStep;
  }, [urlStep, selectedAttendeeIds.length, emailTitle, emailBody]);

  useEffect(() => {
    if (step !== urlStep) replaceStep(step);
  }, [step, urlStep, replaceStep]);

  // ============================================================
  // ハンドラ
  // ============================================================

  const handleSelectNext = () => {
    if (selectedAttendeeIds.length === 0) {
      toast.error("送信先を選択してください");
      return;
    }
    setStep("email");
  };

  const handleCustomizeNext = () => {
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
        const result = await sendTestSurveyAction({
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
        const result = await sendSurveyAction({
          eventId: event.id,
          customerIds: selectedAttendeeIds,
          emailTitle,
          emailBody,
        });
        if (result.success) {
          const msg =
            result.failedCount > 0
              ? `${result.sentCount}名に送信しました（${result.failedCount}名失敗: ${result.failedNames.join(", ")}）`
              : `${result.sentCount}名にアンケートメールを送信しました`;
          toast.success(msg);
          router.push(`/admin/events/${event.id}`);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("アンケートメールの送信中にエラーが発生しました");
      }
    });
  };

  const toggleAttendee = (attendeeId: number) => {
    setSelectedAttendeeIds((prev) =>
      prev.includes(attendeeId)
        ? prev.filter((id) => id !== attendeeId)
        : [...prev, attendeeId]
    );
  };

  const toggleAllAttendees = () => {
    if (
      selectedAttendeeIds.length === attendees.length &&
      attendees.length > 0
    ) {
      setSelectedAttendeeIds([]);
    } else {
      setSelectedAttendeeIds(attendees.map((a) => a.id));
    }
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
    // 選択
    selectedAttendeeIds,
    selectedAttendees,
    toggleAttendee,
    toggleAllAttendees,
    // 全参加者
    attendees,
    // ダイアログ
    confirmOpen,
    setConfirmOpen,
    // アクション
    isPending,
    handleSelectNext,
    handleCustomizeNext,
    handleTestSend,
    handleSend,
  };
}
