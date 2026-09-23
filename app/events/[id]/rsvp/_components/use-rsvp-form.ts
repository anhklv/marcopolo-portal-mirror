"use client";

import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { submitRsvpAction } from "@/lib/actions/rsvp.actions";
import { COMMUNITY_CODE } from "@/lib/constants/community";
import type { SerializedRsvpPageData } from "@/lib/types/serialized";

// ============================================================
// 型定義
// ============================================================

/** フォーム上の出欠選択値 */
type FormStatus = "attend" | "online" | "decline";

/** 懇親会の選択値（DB enum値をそのまま使用） */
type FormAfterPartyStatus = "attending" | "not_attending";

type AgreementAnswer = "agree" | "disagree" | null;

interface UseRsvpFormProps {
  data: SerializedRsvpPageData;
}

// ============================================================
// ヘルパー
// ============================================================

/** DB status → フォーム status 変換 */
function dbStatusToFormStatus(dbStatus: string): FormStatus | null {
  switch (dbStatus) {
    case "attending":
      return "attend";
    case "online":
      return "online";
    case "absent":
      return "decline";
    default:
      return null;
  }
}

/** フォーム status → DB status 変換 */
function formStatusToDbStatus(
  formStatus: FormStatus
): "attending" | "online" | "absent" {
  switch (formStatus) {
    case "attend":
      return "attending";
    case "online":
      return "online";
    case "decline":
      return "absent";
  }
}

// ============================================================
// カスタムフック
// ============================================================

export function useRsvpForm({ data }: UseRsvpFormProps) {
  const [isPending, startTransition] = useTransition();

  // 回答済みかどうか（初回表示 or 送信後）
  const isAlreadyResponded = data.rsvp.status !== "pending";
  const [submitted, setSubmitted] = useState(isAlreadyResponded);

  // フォーム状態（回答済みの場合は既存値を復元）
  const [status, setStatus] = useState<FormStatus | null>(
    dbStatusToFormStatus(data.rsvp.status)
  );
  const [afterPartyStatus, setAfterPartyStatus] =
    useState<FormAfterPartyStatus | null>(
      (data.rsvp.afterPartyStatus as FormAfterPartyStatus) ?? null
    );
  const [comment, setComment] = useState(data.rsvp.comment ?? "");
  const [antiSocialForcesAnswer, setAntiSocialForcesAnswer] =
    useState<AgreementAnswer>(null);
  const [participationRulesAnswer, setParticipationRulesAnswer] =
    useState<AgreementAnswer>(null);
  const [informationSharingAnswer, setInformationSharingAnswer] =
    useState<AgreementAnswer>(null);
  const termsAgreed =
    antiSocialForcesAnswer === "agree" &&
    participationRulesAnswer === "agree" &&
    informationSharingAnswer === "agree";

  const requiresTermsAgreement =
    data.event.community.code === COMMUNITY_CODE.NAIKAN_MEETUP;

  // 回答期限チェック
  const isDeadlinePassed = useMemo(() => {
    const deadline = data.event.responseDeadline ?? data.event.date;
    return new Date() > new Date(deadline);
  }, [data.event.responseDeadline, data.event.date]);

  // 出欠変更ハンドラ
  const handleStatusChange = (value: string) => {
    const newStatus = value as FormStatus;
    setStatus(newStatus);
    if (newStatus !== "attend") {
      setAfterPartyStatus(null);
    }
  };

  // 送信ハンドラ
  const handleSubmit = () => {
    if (!status) {
      toast.error("出欠を選択してください");
      return;
    }

    if (
      data.event.hasAfterParty &&
      status === "attend" &&
      !afterPartyStatus
    ) {
      toast.error("懇親会の参加可否を選択してください");
      return;
    }

    if (requiresTermsAgreement && !termsAgreed) {
      toast.error("3つの確認事項すべてに同意してください");
      return;
    }

    startTransition(async () => {
      try {
        const result = await submitRsvpAction({
          token: data.rsvp.token,
          status: formStatusToDbStatus(status),
          afterPartyStatus:
            status === "attend" ? afterPartyStatus : null,
          comment: comment || undefined,
          termsAgreed: requiresTermsAgreement ? termsAgreed : undefined,
        });

        if (result.success) {
          setAntiSocialForcesAnswer(null);
          setParticipationRulesAnswer(null);
          setInformationSharingAnswer(null);
          setSubmitted(true);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("エラーが発生しました");
      }
    });
  };

  // 回答変更ハンドラ
  const handleChangeResponse = () => {
    setSubmitted(false);
  };

  return {
    isPending,
    submitted,
    status,
    afterPartyStatus,
    setAfterPartyStatus,
    comment,
    setComment,
    requiresTermsAgreement,
    termsAgreed,
    antiSocialForcesAnswer,
    setAntiSocialForcesAnswer,
    participationRulesAnswer,
    setParticipationRulesAnswer,
    informationSharingAnswer,
    setInformationSharingAnswer,
    isDeadlinePassed,
    handleStatusChange,
    handleSubmit,
    handleChangeResponse,
  };
}
