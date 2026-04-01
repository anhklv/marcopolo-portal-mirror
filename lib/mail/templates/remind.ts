/**
 * リマインドメールテンプレート
 */

import { formatEventDate } from "@/lib/utils/event";

interface RemindTemplateParams {
  eventTitle: string;
  eventDate: string;
  eventLocation: string | null;
  eventDescription: string | null;
  eventTimetable: string | null;
  eventNote: string | null;
}

/**
 * リマインドメールのタイトル生成
 */
export function generateRemindSubject(params: RemindTemplateParams): string {
  return `【${params.eventTitle}】参加可否のご回答をお願いします`;
}

/**
 * リマインドメールの本文生成
 * - {CUSTOMER_NAME} … 姓 名（送信時に置換。本文では `{CUSTOMER_NAME}様` と書くと「姓 名様」になる）
 * - {RSVP_URL} … RSVP回答URL
 */
export function generateRemindBody(params: RemindTemplateParams): string {
  const sections: string[] = [];

  sections.push(`{CUSTOMER_NAME}様`);
  sections.push(`いつも大変お世話になっております。`);
  sections.push(`${params.eventTitle}のご案内です。`);

  if (params.eventDescription) {
    sections.push(`【イベント概要】\n${params.eventDescription}`);
  }

  if (params.eventDate) {
    sections.push(`【開催日時】\n${formatEventDate(params.eventDate)}`);
  }

  if (params.eventTimetable) {
    sections.push(`【タイムテーブル】\n${params.eventTimetable}`);
  }

  if (params.eventLocation) {
    sections.push(`【場所】\n${params.eventLocation}`);
  }

  sections.push(
    `まだ参加可否のご回答をいただいておりません。\nお忙しい中恐縮ですが、以下のURLよりご回答をお願いいたします。\n{RSVP_URL}`
  );

  if (params.eventNote) {
    sections.push(`【備考】\n${params.eventNote}`);
  }

  sections.push(`よろしくお願いいたします。`);

  return sections.join("\n\n");
}
