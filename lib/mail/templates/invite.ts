/**
 * イベント案内メールテンプレート
 */

import { formatEventDate } from "@/lib/utils/event";

interface InviteTemplateParams {
  eventTitle: string;
  eventDate: string;
  eventLocation: string | null;
  eventDescription: string | null;
  eventTimetable: string | null;
  eventNote: string | null;
}

/**
 * 案内メールのタイトル生成
 */
export function generateInviteSubject(params: InviteTemplateParams): string {
  return `【${params.eventTitle}】ご案内`;
}

/**
 * 案内メールの本文生成
 * {RSVP_URL} プレースホルダを含む
 */
export function generateInviteBody(params: InviteTemplateParams): string {
  const sections: string[] = [];

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
    `ご参加の可否について、以下のURLよりご回答をお願いいたします。\n{RSVP_URL}`
  );

  if (params.eventNote) {
    sections.push(`【備考】\n${params.eventNote}`);
  }

  sections.push(`よろしくお願いいたします。`);

  return sections.join("\n\n");
}
