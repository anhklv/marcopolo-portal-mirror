import type { EventType } from "@/lib/types";

// イベント種別の選択肢
export const EVENT_TYPES: readonly EventType[] = [
  "ベンチャー監査役の会",
  "ないかんMeetup",
  "その他",
] as const;

// RSVPステータスの選択肢
export const RSVP_STATUSES = [
  { value: "未回答", label: "未回答" },
  { value: "参加", label: "参加" },
  { value: "オンライン参加", label: "オンライン参加" },
  { value: "不参加", label: "不参加" },
] as const;

// 参加タイプの選択肢
export const ATTENDANCE_TYPES = [
  "通常参加",
  "オンライン参加",
] as const;

// 懇親会ステータスの選択肢
export const AFTER_PARTY_STATUSES = [
  "参加",
  "不参加",
] as const;

