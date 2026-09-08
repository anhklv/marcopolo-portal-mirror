/**
 * 参加ステータス更新通知メールテンプレート
 */

import { formatEventDate } from "@/lib/utils/event";

interface StatusUpdateTemplateParams {
  eventTitle: string;
  eventDate: string;
  participationStatus: string;
  afterPartyStatus: string | null;
}

/**
 * 参加ステータス更新通知メールのタイトル生成
 */
export function generateStatusUpdateSubject(
  params: StatusUpdateTemplateParams
): string {
  return `【${params.eventTitle}】参加ステータス更新のお知らせ`;
}

/**
 * 参加ステータス更新通知メールの本文生成
 * - {CUSTOMER_NAME} … 姓 名（モーダル表示時に対象顧客名へ置換）
 * - {RSVP_URL} … RSVP回答URL
 */
export function generateStatusUpdateBody(
  params: StatusUpdateTemplateParams
): string {
  const sections = [
    "{CUSTOMER_NAME} 様",
    "いつもお世話になっております。",
    `「${params.eventTitle}」の参加ステータスが更新されましたので、お知らせいたします。`,
    `■イベント名\n${params.eventTitle}`,
    `■開催日時\n${formatEventDate(params.eventDate)}`,
    `■参加ステータス\n${params.participationStatus}`,
  ];

  if (params.afterPartyStatus) {
    sections.push(`■懇親会\n${params.afterPartyStatus}`);
  }

  sections.push(
    "詳細については、以下の参加URLよりご確認ください。",
    "{RSVP_URL}",
    "※本メールは、管理者による参加ステータスの更新に伴い、自動送信されています。"
  );

  return sections.join("\n\n");
}
