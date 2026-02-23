// イベント一覧のクライアントサイドフィルタ・ソートロジック
// event-list.tsx とテストの両方から使用

import { getEventDisplayStatus } from "@/lib/utils/event";
import type { EventDisplayStatus } from "@/lib/constants/event";

export interface EventListFilters {
  keyword: string;
  statuses: EventDisplayStatus[];
  eventTypeCodes: string[];
}

export interface FilterableEvent {
  id: number;
  title: string;
  date: string;
  location: string | null;
  description: string | null;
  note: string | null;
  isPaused: boolean;
  responseDeadline: string | null;
  community: { code: string };
}

type EnrichedEvent<T extends FilterableEvent> = T & {
  displayStatus: EventDisplayStatus;
};

/**
 * イベント一覧のフィルタ・ソート処理
 * 1. displayStatus を付与
 * 2. キーワード・ステータス・イベント種別でフィルタ
 * 3. 終了イベントを後段にソート
 */
export function filterAndSortEvents<T extends FilterableEvent>(
  events: T[],
  filters: EventListFilters
): EnrichedEvent<T>[] {
  const enriched = events.map((event) => ({
    ...event,
    displayStatus: getEventDisplayStatus({
      date: event.date,
      responseDeadline: event.responseDeadline,
      isPaused: event.isPaused,
    }),
  }));

  const filtered = enriched.filter((event) => {
    // キーワード検索
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      const matches =
        event.title.toLowerCase().includes(kw) ||
        (event.location ?? "").toLowerCase().includes(kw) ||
        (event.description ?? "").toLowerCase().includes(kw) ||
        (event.note ?? "").toLowerCase().includes(kw);
      if (!matches) return false;
    }

    // ステータスフィルタ
    if (filters.statuses.length > 0 && !filters.statuses.includes(event.displayStatus)) {
      return false;
    }

    // イベント種別フィルタ
    if (filters.eventTypeCodes.length > 0 && !filters.eventTypeCodes.includes(event.community.code)) {
      return false;
    }

    return true;
  });

  // ソート: 終了イベントを後段、未終了は日付昇順、終了は日付降順
  return filtered.sort((a, b) => {
    const aIsClosed = a.displayStatus === "closed";
    const bIsClosed = b.displayStatus === "closed";

    if (aIsClosed !== bIsClosed) {
      return aIsClosed ? 1 : -1;
    }

    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();

    if (aIsClosed) {
      return dateB - dateA;
    }
    return dateA - dateB;
  });
}
