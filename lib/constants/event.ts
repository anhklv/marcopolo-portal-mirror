import type { AfterPartyStatus, RsvpStatus } from "@/lib/generated/prisma";
import type { BadgeVariant } from "@/components/ui/badge";

/** イベント開催日時・回答期限の業務タイムゾーン（壁時計） */
export const EVENT_TIMEZONE = "Asia/Tokyo";

/** フォーム送信用の ISO 8601 オフセット（日本標準時） */
export const EVENT_TZ_OFFSET = "+09:00";

// RSVPステータスの選択肢
export const RSVP_STATUSES: readonly { value: RsvpStatus; label: string }[] = [
  { value: "pending", label: "未回答" },
  { value: "attending", label: "参加" },
  { value: "online", label: "オンライン参加" },
  { value: "absent", label: "不参加" },
] as const;

// RSVPステータスの表示設定（Badge用）
export const RSVP_STATUS_CONFIG: Record<RsvpStatus, { label: string; variant: BadgeVariant; description: string }> = {
  attending: { label: "参加", variant: "default", description: "通常参加" },
  online: { label: "オンライン参加", variant: "online", description: "オンライン参加（専用バリアント）" },
  absent: { label: "不参加", variant: "destructive-outline", description: "不参加" },
  pending: { label: "未回答", variant: "secondary", description: "未回答" },
} as const;

/**
 * イベントの表示用ステータス（算出値）
 * - receiving: 受付中（回答期限前 + 未停止）
 * - waiting: 開催待ち（回答期限後〜開催日前）
 * - closed: 終了（開催日後）
 * - paused: 停止中（isPaused=true）
 */
export type EventDisplayStatus = "receiving" | "paused" | "waiting" | "closed";

// イベントステータスの表示設定（Badge用）
export const EVENT_STATUS_CONFIG: Record<EventDisplayStatus, { label: string; variant: BadgeVariant; description: string }> = {
  receiving: { label: "受付中", variant: "default", description: "受付中（期間内）" },
  paused: { label: "一時停止中", variant: "destructive-outline", description: "受付期間中だが手動停止中" },
  waiting: { label: "受付終了", variant: "outline", description: "受付終了（開催前）" },
  closed: { label: "終了", variant: "secondary", description: "イベント終了" },
} as const;

// 懇親会ステータスの表示設定
export const AFTER_PARTY_STATUS_CONFIG: Record<AfterPartyStatus, { label: string }> = {
  attending: { label: "参加" },
  not_attending: { label: "不参加" },
} as const;
