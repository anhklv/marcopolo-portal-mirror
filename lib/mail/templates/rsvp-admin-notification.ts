import type { AfterPartyStatus, RsvpStatus } from "@/lib/generated/prisma";
import {
  AFTER_PARTY_STATUS_CONFIG,
  RSVP_STATUS_CONFIG,
} from "@/lib/constants/event";
import { formatDateTime, formatEventDate } from "@/lib/utils/event";

export interface RsvpResponseSnapshot {
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function textToHtml(value: string): string {
  return escapeHtml(value).replaceAll("\n", "<br>");
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

  // 不参加の場合、参加内容と懇親会は回答対象外のため通知へ表示しない。
  if (
    current.status !== "absent" &&
    previous.afterPartyStatus !== current.afterPartyStatus
  ) {
    const before = previous.afterPartyStatus
      ? AFTER_PARTY_STATUS_CONFIG[previous.afterPartyStatus].label
      : "未回答";
    const after = current.afterPartyStatus
      ? AFTER_PARTY_STATUS_CONFIG[current.afterPartyStatus].label
      : "未回答";
    lines.push(`・懇親会：${before} → ${after}`);
  }

  if (
    current.status !== "absent" &&
    previous.participationOptionId !== current.participationOptionId
  ) {
    lines.push(
      `・参加内容：${nullableLabel(previous.participationOptionLabel, "未選択")} → ${nullableLabel(current.participationOptionLabel, "未選択")}`
    );
  }

  if (previous.comment !== current.comment) {
    lines.push(
      `・メッセージ・連絡事項：${nullableLabel(previous.comment, "未入力")} → ${nullableLabel(current.comment, "未入力")}`
    );
  }

  return lines;
}

export function generateRsvpAdminNotification(
  params: GenerateRsvpAdminNotificationParams
): { subject: string; text: string; html: string } {
  const changes = buildChangeLines(params.previous, params.current);
  const subject = `【${params.eventTitle}】参加回答更新のお知らせ（${params.customerName}様）`;
  const eventDate = formatEventDate(params.eventDate);
  const respondedAt = formatDateTime(params.respondedAt);
  const text = [
    "関係者各位",
    "",
    `「${params.eventTitle}」の参加回答が更新されましたので、お知らせいたします。`,
    "",
    "■カテゴリー",
    params.communityName,
    "",
    "■イベント名",
    params.eventTitle,
    "",
    "■開催日時",
    eventDate,
    "",
    "■回答者",
    `${params.customerName} 様`,
    "",
    "■変更内容",
    ...changes,
    "",
    "■回答日時",
    respondedAt,
    "",
    "■管理画面",
    params.adminEventUrl,
    "",
    "※本メールは、参加者による参加回答の更新に伴い、自動送信されています。",
  ].join("\n");

  const escapedAdminUrl = escapeHtml(params.adminEventUrl);
  const htmlChanges = changes
    .map((change) => `<strong>${textToHtml(change)}</strong>`)
    .join("<br>");
  const html = [
    '<div style="font-family: sans-serif; line-height: 1.7;">',
    "<p>関係者各位</p>",
    `<p>「${textToHtml(params.eventTitle)}」の参加回答が更新されましたので、お知らせいたします。</p>`,
    `<p>■カテゴリー<br>${textToHtml(params.communityName)}</p>`,
    `<p>■イベント名<br>${textToHtml(params.eventTitle)}</p>`,
    `<p>■開催日時<br>${textToHtml(eventDate)}</p>`,
    `<p>■回答者<br><strong>${textToHtml(params.customerName)} 様</strong></p>`,
    `<p><strong>■変更内容</strong><br>${htmlChanges}</p>`,
    `<p>■回答日時<br>${textToHtml(respondedAt)}</p>`,
    `<p>■管理画面<br><a href="${escapedAdminUrl}">${escapedAdminUrl}</a></p>`,
    "<p>※本メールは、参加者による参加回答の更新に伴い、自動送信されています。</p>",
    "</div>",
  ].join("");

  return { subject, text, html };
}
