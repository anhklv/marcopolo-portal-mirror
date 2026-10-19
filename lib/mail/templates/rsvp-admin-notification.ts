import type { AfterPartyStatus, RsvpStatus } from "@/lib/generated/prisma";
import { formatDateTime, formatEventDate } from "@/lib/utils/event";

const NOTIFICATION_RSVP_STATUS_LABELS: Record<RsvpStatus, string> = {
  pending: "未回答",
  attending: "現地参加",
  online: "オンライン参加",
  absent: "参加しない",
};

const NOTIFICATION_AFTER_PARTY_STATUS_LABELS: Record<
  AfterPartyStatus,
  string
> = {
  attending: "参加する",
  not_attending: "参加しない",
};

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
  participationOptionEnabled: boolean;
  hasAfterParty: boolean;
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

interface ResponseLine {
  text: string;
  changed: boolean;
}

function buildResponseLines(
  previous: RsvpResponseSnapshot,
  current: RsvpResponseSnapshot,
  participationOptionEnabled: boolean,
  hasAfterParty: boolean
): ResponseLine[] {
  const lines: ResponseLine[] = [];

  const statusChanged = previous.status !== current.status;
  lines.push({
    text: statusChanged
      ? `・参加ステータス：${NOTIFICATION_RSVP_STATUS_LABELS[previous.status]} → ${NOTIFICATION_RSVP_STATUS_LABELS[current.status]}`
      : `・参加ステータス：${NOTIFICATION_RSVP_STATUS_LABELS[current.status]}`,
    changed: statusChanged,
  });

  if (
    participationOptionEnabled &&
    (current.status === "attending" || current.status === "online") &&
    current.participationOptionLabel?.trim()
  ) {
    const participationOptionChanged =
      previous.participationOptionId !== current.participationOptionId;
    const previousLabel = nullableLabel(
      previous.participationOptionLabel,
      "未選択"
    );
    const currentLabel = nullableLabel(
      current.participationOptionLabel,
      "未選択"
    );
    lines.push({
      text: participationOptionChanged
        ? `・参加内容：${previousLabel} → ${currentLabel}`
        : `・参加内容：${currentLabel}`,
      changed: participationOptionChanged,
    });
  }

  // 懇親会は現地参加の場合のみ回答対象となるため、それ以外は通知へ表示しない。
  if (
    hasAfterParty &&
    current.status === "attending" &&
    current.afterPartyStatus
  ) {
    const afterPartyChanged =
      previous.afterPartyStatus !== current.afterPartyStatus;
    const before = previous.afterPartyStatus
      ? NOTIFICATION_AFTER_PARTY_STATUS_LABELS[previous.afterPartyStatus]
      : "未回答";
    const after = NOTIFICATION_AFTER_PARTY_STATUS_LABELS[current.afterPartyStatus];
    lines.push({
      text: afterPartyChanged
        ? `・懇親会：${before} → ${after}`
        : `・懇親会：${after}`,
      changed: afterPartyChanged,
    });
  }

  if (current.comment?.trim()) {
    const commentChanged = previous.comment !== current.comment;
    const previousComment = nullableLabel(previous.comment, "未入力");
    lines.push({
      text: commentChanged
        ? `・メッセージ・連絡事項：${previousComment} → ${current.comment}`
        : `・メッセージ・連絡事項：${current.comment}`,
      changed: commentChanged,
    });
  }

  return lines;
}

export function generateRsvpAdminNotification(
  params: GenerateRsvpAdminNotificationParams
): { subject: string; text: string; html: string } {
  const responseLines = buildResponseLines(
    params.previous,
    params.current,
    params.participationOptionEnabled,
    params.hasAfterParty
  );
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
    ...responseLines.map((line) => line.text),
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
  const htmlResponseLines = responseLines
    .map((line) => {
      const htmlLine = textToHtml(line.text);
      return line.changed ? `<strong>${htmlLine}</strong>` : htmlLine;
    })
    .join("<br>");
  const html = [
    '<div style="font-family: sans-serif; line-height: 1.7;">',
    "<p>関係者各位</p>",
    `<p>「${textToHtml(params.eventTitle)}」の参加回答が更新されましたので、お知らせいたします。</p>`,
    `<p>■カテゴリー<br>${textToHtml(params.communityName)}</p>`,
    `<p>■イベント名<br>${textToHtml(params.eventTitle)}</p>`,
    `<p>■開催日時<br>${textToHtml(eventDate)}</p>`,
    `<p>■回答者<br><strong>${textToHtml(params.customerName)} 様</strong></p>`,
    `<p><strong>■変更内容</strong><br>${htmlResponseLines}</p>`,
    `<p>■回答日時<br>${textToHtml(respondedAt)}</p>`,
    `<p>■管理画面<br><a href="${escapedAdminUrl}">${escapedAdminUrl}</a></p>`,
    "<p>※本メールは、参加者による参加回答の更新に伴い、自動送信されています。</p>",
    "</div>",
  ].join("");

  return { subject, text, html };
}
