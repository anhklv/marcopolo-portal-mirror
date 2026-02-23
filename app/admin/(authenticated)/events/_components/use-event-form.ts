"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createEventAction, updateEventAction } from "@/lib/actions/event.actions";
import type { EventActionResult } from "@/lib/actions/event.actions";
import type { CommunityOption } from "@/lib/types/serialized";
import { eventSchema } from "@/lib/validations/event";

// ============================================================
// 型定義
// ============================================================

export interface EventInitialData {
  id: number;
  communityId: number;
  title: string;
  date: string;
  location: string | null;
  description: string | null;
  timetable: string | null;
  note: string | null;
  responseDeadline: string | null;
  allowsOnline: boolean;
  hasAfterParty: boolean;
}

interface UseEventFormProps {
  mode: "create" | "edit";
  initialData?: EventInitialData;
  communities: CommunityOption[];
  isSuper: boolean;
  scopedCommunityIds: number[];
}

export type CommunitySelectMode = "select" | "fixed";

// ============================================================
// ヘルパー
// ============================================================

/**
 * "YYYY/MM/DD" + "HH:mm" → ISO文字列
 * @param dateStr 日付文字列（YYYY/MM/DD）
 * @param timeStr 時刻文字列（HH:mm）。未入力時は defaultTime を使用
 * @param defaultTime timeStr未入力時のデフォルト値。undefinedの場合は空文字を返す
 */
function combineDateAndTime(dateStr: string, timeStr: string, defaultTime?: string): string {
  if (!dateStr) return "";
  const time = timeStr || defaultTime;
  if (!time) return "";
  const match = dateStr.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return "";
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${time}:00`;
}

/** ISO形式(YYYY-MM-DDまたはYYYY-MM-DDTHH:mm:ss.sssZ) → 表示形式(YYYY/MM/DD) */
function isoToDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 10).replace(/-/g, "/");
}

/** ISO形式 → 時刻文字列(HH:mm) */
function isoToTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const match = dateStr.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : "";
}

// ============================================================
// カスタムフック
// ============================================================

export function useEventForm({
  mode,
  initialData,
  communities,
  isSuper,
  scopedCommunityIds,
}: UseEventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ステップ管理（create時のみ使用）
  const [step, setStep] = useState<"form" | "success">("form");
  const [createdEventId, setCreatedEventId] = useState<number | null>(null);

  // コミュニティ選択モード判定
  const communitySelectMode: CommunitySelectMode =
    isSuper || scopedCommunityIds.length > 1 ? "select" : "fixed";

  // コミュニティ選択肢（super: 全件、community_admin: スコープ内のみ）
  const availableCommunities = isSuper
    ? communities
    : communities.filter((c) => scopedCommunityIds.includes(c.id));

  // 初期コミュニティID
  const initialCommunityId = initialData
    ? initialData.communityId
    : communitySelectMode === "fixed" && availableCommunities.length === 1
      ? availableCommunities[0].id
      : availableCommunities.length > 0
        ? availableCommunities[0].id
        : 0;

  // フォーム状態
  const [communityId, setCommunityId] = useState<number>(initialCommunityId);
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [eventDate, setEventDate] = useState(isoToDisplay(initialData?.date));
  const [eventTime, setEventTime] = useState(isoToTime(initialData?.date));
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [timetable, setTimetable] = useState(initialData?.timetable ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [note, setNote] = useState(initialData?.note ?? "");
  const [deadlineDate, setDeadlineDate] = useState(isoToDisplay(initialData?.responseDeadline));
  const [deadlineTime, setDeadlineTime] = useState(isoToTime(initialData?.responseDeadline));
  const [allowsOnline, setAllowsOnline] = useState(initialData?.allowsOnline ?? false);
  const [hasAfterParty, setHasAfterParty] = useState(initialData?.hasAfterParty ?? false);

  // エラー状態
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // フィールドエラーのクリア（onChange時に使用）
  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // フォーム送信
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    // 日時結合（開催日時は時刻必須、回答期限は時刻未入力時23:59をデフォルト）
    const dateTimeStr = combineDateAndTime(eventDate, eventTime);
    const deadlineStr = combineDateAndTime(deadlineDate, deadlineTime, "23:59");

    const formData = {
      title,
      communityId,
      date: dateTimeStr || undefined,
      location,
      description,
      timetable,
      note,
      responseDeadline: deadlineStr || undefined,
      allowsOnline,
      hasAfterParty,
    };

    // クライアント側Zodバリデーション
    const parsed = eventSchema.safeParse(formData);
    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!errors[key]) errors[key] = [];
        errors[key].push(issue.message);
      }
      // 日付・時刻のエラーを適切なフィールドに振り分け
      if (errors["date"]) {
        if (eventDate && !eventTime) {
          // 日付は入力済み・時刻が未入力 → 時刻側のみ
          errors["eventTime"] = ["時刻を入力してください"];
          delete errors["date"];
        } else if (!eventDate && eventTime) {
          // 時刻は入力済み・日付が未入力 → 日付側のみ
          errors["date"] = ["開催日を入力してください"];
        } else if (!eventDate && !eventTime) {
          // 両方未入力 → 両方にエラー表示
          errors["date"] = ["開催日を入力してください"];
          errors["eventTime"] = ["時刻を入力してください"];
        }
      }
      setFieldErrors(errors);
      toast.error("入力内容に誤りがあります");
      return;
    }

    setFieldErrors({});
    startTransition(async () => {
      try {
        if (mode === "create") {
          const result: EventActionResult = await createEventAction(formData);

          if (result.success) {
            setCreatedEventId(result.eventId);
            setStep("success");
            toast.success("イベントを作成しました");
          } else {
            if (result.fieldErrors) {
              setFieldErrors(result.fieldErrors);
              toast.error("入力内容に誤りがあります");
            } else if (result.error) {
              setGeneralError(result.error);
              toast.error(result.error);
            }
          }
        } else {
          const result = await updateEventAction(initialData!.id, formData);

          // redirect が成功した場合はここに来ない
          if (result && !result.success) {
            if (result.fieldErrors) {
              setFieldErrors(result.fieldErrors);
              toast.error("入力内容に誤りがあります");
            } else if (result.error) {
              setGeneralError(result.error);
              toast.error(result.error);
            }
          }
        }
      } catch (err) {
        // redirect() は例外を投げるので、NEXT_REDIRECT は正常動作
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
          toast.success("イベント情報を更新しました");
          return;
        }
        toast.error("エラーが発生しました");
      }
    });
  };

  // 成功画面のナビゲーション（create時のみ使用）
  const handleStartInvite = () => {
    if (createdEventId) {
      router.push(`/admin/events/${createdEventId}/invite`);
    }
  };

  const handleSkipInvite = () => {
    router.push("/admin/events");
  };

  return {
    // トランジション
    isPending,

    // ステップ管理
    step,
    createdEventId,

    // コミュニティ
    communitySelectMode,
    availableCommunities,
    communityId, setCommunityId,

    // フォーム状態
    title, setTitle,
    eventDate, setEventDate,
    eventTime, setEventTime,
    description, setDescription,
    timetable, setTimetable,
    location, setLocation,
    note, setNote,
    deadlineDate, setDeadlineDate,
    deadlineTime, setDeadlineTime,
    allowsOnline, setAllowsOnline,
    hasAfterParty, setHasAfterParty,

    // エラー
    fieldErrors,
    generalError,
    clearFieldError,

    // ハンドラ
    handleSubmit,
    handleStartInvite,
    handleSkipInvite,
  };
}
