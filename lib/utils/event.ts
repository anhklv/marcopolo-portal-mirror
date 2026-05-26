import {
  EVENT_TIMEZONE,
  EVENT_TZ_OFFSET,
  type EventDisplayStatus,
} from "@/lib/constants/event";

function partsRecord(date: Date): Record<string, string> {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const rec: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== "literal") {
      rec[p.type] = p.value;
    }
  }
  return rec;
}

/** weekday: short は ja ロケール前提（水 等） */
function weekdayJaShortFromUtcDate(date: Date): string {
  const wf = new Intl.DateTimeFormat("ja-JP", {
    timeZone: EVENT_TIMEZONE,
    weekday: "short",
  });
  return wf.format(date);
}

/**
 * DB の Date / ISO 文字列を、業務 TZ（東京）の壁時計で YYYY-MM-DDTHH:mm:ss+09:00 にする。
 * 編集フォーム initialData 用。
 */
export function dateToEventFormIsoWithOffset(date: Date): string {
  const p = partsRecord(date);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${EVENT_TZ_OFFSET}`;
}

/**
 * 日付フォーマット: ISO8601形式 → "2028年6月15日(水) 18:00"形式（東京の壁時計）
 */
export function formatEventDate(dateStr: string | Date): string {
  try {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) {
      return String(dateStr);
    }
    const p = partsRecord(date);
    const w = weekdayJaShortFromUtcDate(date);
    const month = String(Number(p.month));
    const day = String(Number(p.day));
    return `${p.year}年${month}月${day}日(${w}) ${p.hour}:${p.minute}`;
  } catch {
    return String(dateStr);
  }
}

/**
 * 日時フォーマット: ISO8601形式 → "2024年12月1日 23:59"形式（曜日なし、東京の壁時計）
 * 回答日時の表示用
 */
export function formatDateTime(dateStr: string | Date): string {
  try {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) {
      return String(dateStr);
    }
    const p = partsRecord(date);
    const month = String(Number(p.month));
    const day = String(Number(p.day));
    return `${p.year}年${month}月${day}日 ${p.hour}:${p.minute}`;
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
