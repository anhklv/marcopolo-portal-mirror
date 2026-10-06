import type { AfterPartyStatus, RsvpStatus } from "@/lib/generated/prisma";
import {
  AFTER_PARTY_STATUS_CONFIG,
  RSVP_STATUS_CONFIG,
} from "@/lib/constants/event";
import { formatDateTime, formatEventDate } from "@/lib/utils/event";

export interface RsvpResponseSnapshot
  extends Record<string, string | number | null> {
  status: RsvpStatus;
  afterPartyStatus: AfterPartyStatus | null;
  participationOptionId: number | null;
  participationOptionLabel: string | null;
  comment: string | null;
}

interface GenerateRsvpAdminNotificationParams {
  communityName: string;
  eventTitle: string;
  eventDate: Date;
  customerName: string;
  previous: RsvpResponseSnapshot;
  current: RsvpResponseSnapshot;
  respondedAt: Date;
  adminEventUrl: string;
}

function nullableLabel(value: string | null, emptyLabel: string): string {
  return value?.trim() ? value : emptyLabel;
}

function buildChangeLines(
  previous: RsvpResponseSnapshot,
  current: RsvpResponseSnapshot
): string[] {
  const lines: string[] = [];

  if (previous.status !== current.status) {
    lines.push(
      `・参加ステータス：${RSVP_STATUS_CONFIG[previous.status].label} → ${RSVP_STATUS_CONFIG[current.status].label}`
    );
  }
  if (previous.afterPartyStatus !== current.afterPartyStatus) {
    const before = previous.afterPartyStatus
      ? AFTER_PARTY_STATUS_CONFIG[previous.afterPartyStatus].label
      : "未回答";
    const after = current.afterPartyStatus
      ? AFTER_PARTY_STATUS_CONFIG[current.afterPartyStatus].label
      : "未回答";
    lines.push(`・懇親会：${before} → ${after}`);
  }
  if (previous.participationOptionId !== current.participationOptionId) {
    lines.push(
      `・参加内容：${nullableLabel(previous.participationOptionLabel, "未選択")} → ${nullableLabel(current.participationOptionLabel, "未選択")}`
    );
  }
  if (previous.comment !== current.comment) {
    lines.push(
      `・コメント：${nullableLabel(previous.comment, "未入力")} → ${nullableLabel(current.comment, "未入力")}`
    );
  }

  return lines;
}

export function generateRsvpAdminNotification(
  params: GenerateRsvpAdminNotificationParams
): { subject: string; body: string } {
  const changes = buildChangeLines(params.previous, params.current);
  const subject = `【${params.eventTitle}】参加回答更新のお知らせ（${params.customerName}様）`;
  const body = [
    "関係者各位",
    "",
    "イベントの参加回答が更新されました。",
    "",
    `カテゴリー：${params.communityName}`,
    `イベント：${params.eventTitle}`,
    `開催日時：${formatEventDate(params.eventDate)}`,
    `回答者：${params.customerName}様`,
    "",
    "変更内容：",
    ...changes,
    "",
    `回答日時：${formatDateTime(params.respondedAt)}`,
    `管理画面：${params.adminEventUrl}`,
    "",
    "※このメールはシステムから自動送信されています。",
  ].join("\n");

  return { subject, body };
}
