import type { EventType } from "@/lib/types";

// イベント種別の選択肢
export const EVENT_TYPES: readonly EventType[] = [
  "ベンチャー監査役の会",
  "ないかんMeetup",
  "AI部会",
  "その他",
] as const;

// RSVPステータスの選択肢
export const RSVP_STATUSES = [
  { value: "pending", label: "未回答" },
  { value: "attending", label: "参加" },
  { value: "online", label: "オンライン参加" },
  { value: "absent", label: "不参加" },
] as const;

// RSVPステータスの表示設定（Badge用）
export const RSVP_STATUS_CONFIG = {
  attending: { label: "参加", variant: "default", description: "通常参加" },
  online: { label: "オンライン参加", variant: "online", description: "オンライン参加（専用バリアント）" },
  absent: { label: "不参加", variant: "destructive", description: "不参加" },
  pending: { label: "未回答", variant: "secondary", description: "未回答" },
} as const;

export type RsvpStatusConfigKey = keyof typeof RSVP_STATUS_CONFIG;

/**
 * イベントの表示用ステータス（算出値）
 * - open: 受付中（期間内かつ停止していない）
 * - paused: 受付中（一時停止フラグON）
 * - waiting: キャンセル待ち/受付終了（開催前だが期限切れ）
 * - closed: 終了（開催日時を過ぎた）
 */
export type EventDisplayStatus = "open" | "paused" | "waiting" | "closed";

// イベントステータスの表示設定（Badge用）
export const EVENT_STATUS_CONFIG: Record<EventDisplayStatus, { label: string, variant: string, description: string }> = {
  open: { label: "受付中", variant: "default", description: "受付中（期間内）" },
  paused: { label: "一時停止中", variant: "destructive", description: "受付期間中だが手動停止中" },
  waiting: { label: "受付終了", variant: "outline", description: "受付終了（開催前）" },
  closed: { label: "終了", variant: "secondary", description: "イベント終了" },
} as const;

export type EventStatusConfigKey = EventDisplayStatus;

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
