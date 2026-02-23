import type { EventDisplayStatus } from "@/lib/constants/event";

/**
 * 日付フォーマット: ISO8601形式 → "2028年6月15日(月) 18:00"形式
 */
export function formatEventDate(dateStr: string | Date): string {
  try {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    const dayOfWeek = date.getDay();
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const weekday = weekdays[dayOfWeek];

    return `${year}年${month}月${day}日(${weekday}) ${hours}:${minutes}`;
  } catch {
    return String(dateStr);
  }
}

/**
 * 日時フォーマット: ISO8601形式 → "2024年12月1日 23:59"形式（曜日なし）
 * 回答日時の表示用
 */
export function formatDateTime(dateStr: string | Date): string {
  try {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) {
      return String(dateStr);
    }
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  } catch {
    return String(dateStr);
  }
}

/**
 * イベントの表示ステータスを判定する
 * - receiving: 受付中（回答期限前 + 未停止）
 * - waiting: 開催待ち（回答期限後〜開催日前）
 * - closed: 終了（開催日後）
 * - paused: 停止中（isPaused=true）
 */
export function getEventDisplayStatus(event: {
  date: Date | string;
  responseDeadline?: Date | string | null;
  isPaused?: boolean;
}): EventDisplayStatus {
  const now = new Date();
  const eventDate = new Date(event.date);

  // 終了判定を最優先: 開催日を過ぎたイベントは isPaused に関係なく closed
  if (eventDate <= now) {
    return "closed";
  }

  if (event.isPaused) {
    return "paused";
  }

  const deadline = event.responseDeadline
    ? new Date(event.responseDeadline)
    : eventDate;
  if (deadline <= now) {
    return "waiting";
  }

  return "receiving";
}
