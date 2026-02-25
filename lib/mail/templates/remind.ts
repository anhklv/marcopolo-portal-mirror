/**
 * リマインドメールテンプレート
 */

interface RemindTemplateParams {
  eventTitle: string;
  eventDate: string;
  eventLocation: string | null;
  eventDescription: string | null;
  eventTimetable: string | null;
  eventNote: string | null;
}

/**
 * 日付フォーマット: ISO8601 → "2028年6月15日(月) 18:00"
 */
function formatEventDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const weekday = weekdays[date.getDay()];
    return `${year}年${month}月${day}日(${weekday}) ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

/**
 * リマインドメールのタイトル生成
 */
export function generateRemindSubject(params: RemindTemplateParams): string {
  return `【${params.eventTitle}】参加可否のご回答をお願いします`;
}

/**
 * リマインドメールの本文生成
 * {RSVP_URL} プレースホルダを含む
 */
export function generateRemindBody(params: RemindTemplateParams): string {
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
    `まだ参加可否のご回答をいただいておりません。\nお忙しい中恐縮ですが、以下のURLよりご回答をお願いいたします。\n{RSVP_URL}`
  );

  if (params.eventNote) {
    sections.push(`【備考】\n${params.eventNote}`);
  }

  sections.push(`よろしくお願いいたします。`);

  return sections.join("\n\n");
}
