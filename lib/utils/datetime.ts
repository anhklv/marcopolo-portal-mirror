import { EVENT_TIMEZONE, EVENT_TZ_OFFSET } from "@/lib/constants/event";

/** 同一瞬間を東京の壁時計（年〜秒）で分解する */
export function getTokyoWallClockParts(date: Date): Record<string, string> {
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

/** API / クライアントへ渡す用（DB は引き続き timestamptz＝UTC 瞬間） */
export function toTokyoOffsetIsoString(date: Date): string {
  const p = getTokyoWallClockParts(date);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${EVENT_TZ_OFFSET}`;
}

export function toTokyoOffsetIsoStringOrNull(
  date: Date | null | undefined
): string | null {
  if (date == null) return null;
  return toTokyoOffsetIsoString(date);
}

/** 表示用 YYYY/MM/DD（東京の暦） */
export function formatDateTokyoYmdSlash(date: Date): string {
  const p = getTokyoWallClockParts(date);
  return `${p.year}/${p.month}/${p.day}`;
}

/** ダウンロードファイル名用 YYYY-MM-DD（東京の暦） */
export function tokyoCalendarDateForFilename(date: Date = new Date()): string {
  const p = getTokyoWallClockParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}
