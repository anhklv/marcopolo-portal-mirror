import { describe, it, expect } from "vitest";
import { filterAndSortEvents, type FilterableEvent, type EventListFilters } from "@/lib/helpers/event-filter";

// 1週間後・3日後・1日前などの日付ヘルパー
const daysFromNow = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

describe("event-filter", () => {
  const mockEvents: FilterableEvent[] = [
    {
      id: 1,
      title: "ベンチャー監査役の会 第10回",
      date: daysFromNow(7),
      location: "東京都千代田区",
      description: "定例会です",
      note: null,
      isPaused: false,
      responseDeadline: daysFromNow(3),
      community: { code: "audit" },
    },
    {
      id: 2,
      title: "ないかんMeetup #5",
      date: daysFromNow(14),
      location: "オンライン",
      description: null,
      note: "Zoom開催",
      isPaused: false,
      responseDeadline: daysFromNow(10),
      community: { code: "naikan" },
    },
    {
      id: 3,
      title: "AI部会 勉強会",
      date: daysFromNow(-3),
      location: "大阪市北区",
      description: "過去のイベント",
      note: null,
      isPaused: false,
      responseDeadline: daysFromNow(-10),
      community: { code: "ai" },
    },
    {
      id: 4,
      title: "ベンチャー監査役の会 特別セミナー",
      date: daysFromNow(5),
      location: null,
      description: null,
      note: null,
      isPaused: true,
      responseDeadline: daysFromNow(2),
      community: { code: "audit" },
    },
    {
      id: 5,
      title: "ないかんMeetup #4",
      date: daysFromNow(-7),
      location: "東京都港区",
      description: null,
      note: null,
      isPaused: false,
      responseDeadline: daysFromNow(-14),
      community: { code: "naikan" },
    },
  ];

  const defaultFilters: EventListFilters = {
    keyword: "",
    statuses: [],
    eventTypeCodes: [],
  };

  // ============================================================
  // キーワード検索
  // ============================================================

  it("キーワードなしで全件返ること", () => {
    const result = filterAndSortEvents(mockEvents, defaultFilters);
    expect(result).toHaveLength(5);
  });

  it("タイトルでキーワード検索できること", () => {
    const result = filterAndSortEvents(mockEvents, { ...defaultFilters, keyword: "監査役" });
    expect(result.map((e) => e.id).sort()).toEqual([1, 4]);
  });

  it("場所でキーワード検索できること", () => {
    const result = filterAndSortEvents(mockEvents, { ...defaultFilters, keyword: "オンライン" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it("概要でキーワード検索できること", () => {
    const result = filterAndSortEvents(mockEvents, { ...defaultFilters, keyword: "定例会" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("備考でキーワード検索できること", () => {
    const result = filterAndSortEvents(mockEvents, { ...defaultFilters, keyword: "Zoom" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it("大文字小文字を区別しないこと", () => {
    const result = filterAndSortEvents(mockEvents, { ...defaultFilters, keyword: "zoom" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it("スペース区切りでAND検索できること", () => {
    const result = filterAndSortEvents(mockEvents, { ...defaultFilters, keyword: "監査役 第10回" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("全角スペース区切りでもAND検索できること", () => {
    const result = filterAndSortEvents(mockEvents, { ...defaultFilters, keyword: "Meetup\u3000オンライン" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it("AND検索で全トークンが含まれない場合はヒットしないこと", () => {
    const result = filterAndSortEvents(mockEvents, { ...defaultFilters, keyword: "監査役 オンライン" });
    expect(result).toHaveLength(0);
  });

  // ============================================================
  // ステータスフィルタ
  // ============================================================

  it("ステータスフィルタなしで全件返ること", () => {
    const result = filterAndSortEvents(mockEvents, defaultFilters);
    expect(result).toHaveLength(5);
  });

  it("receivingでフィルタできること", () => {
    const result = filterAndSortEvents(mockEvents, { ...defaultFilters, statuses: ["receiving"] });
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id).sort()).toEqual([1, 2]);
  });

  it("closedでフィルタできること", () => {
    const result = filterAndSortEvents(mockEvents, { ...defaultFilters, statuses: ["closed"] });
    expect(result.every((e) => e.displayStatus === "closed")).toBe(true);
    expect(result.map((e) => e.id).sort()).toEqual([3, 5]);
  });

  it("pausedでフィルタできること", () => {
    const result = filterAndSortEvents(mockEvents, { ...defaultFilters, statuses: ["paused"] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(4);
  });

  it("waitingでフィルタできること", () => {
    // mockEventsにはwaiting状態のイベントがないため0件
    const result = filterAndSortEvents(mockEvents, { ...defaultFilters, statuses: ["waiting"] });
    expect(result).toHaveLength(0);

    // waiting状態のイベントを追加して検証
    const waitingEvent: FilterableEvent = {
      id: 99,
      title: "待機中イベント",
      date: daysFromNow(7),
      location: null,
      description: null,
      note: null,
      isPaused: false,
      responseDeadline: daysFromNow(-1), // 期限切れ + 開催日前 = waiting
      community: { code: "audit" },
    };
    const withWaiting = filterAndSortEvents([...mockEvents, waitingEvent], { ...defaultFilters, statuses: ["waiting"] });
    expect(withWaiting).toHaveLength(1);
    expect(withWaiting[0].id).toBe(99);
  });

  it("複数ステータスでOR条件フィルタできること", () => {
    const result = filterAndSortEvents(mockEvents, { ...defaultFilters, statuses: ["receiving", "paused"] });
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.id).sort()).toEqual([1, 2, 4]);
  });

  // ============================================================
  // イベント種別フィルタ
  // ============================================================

  it("イベント種別でフィルタできること", () => {
    const result = filterAndSortEvents(mockEvents, { ...defaultFilters, eventTypeCodes: ["audit"] });
    expect(result.every((e) => e.community.code === "audit")).toBe(true);
    expect(result.map((e) => e.id).sort()).toEqual([1, 4]);
  });

  it("複数イベント種別でOR条件フィルタできること", () => {
    const result = filterAndSortEvents(mockEvents, { ...defaultFilters, eventTypeCodes: ["audit", "ai"] });
    expect(result.map((e) => e.id).sort()).toEqual([1, 3, 4]);
  });

  // ============================================================
  // 複合条件
  // ============================================================

  it("キーワード + ステータスの複合条件でフィルタできること", () => {
    const result = filterAndSortEvents(mockEvents, {
      ...defaultFilters,
      keyword: "Meetup",
      statuses: ["closed"],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(5);
  });

  it("キーワード + イベント種別の複合条件でフィルタできること", () => {
    const result = filterAndSortEvents(mockEvents, {
      ...defaultFilters,
      keyword: "セミナー",
      eventTypeCodes: ["audit"],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(4);
  });

  // ============================================================
  // ソート
  // ============================================================

  it("終了イベントが後段にソートされること", () => {
    const result = filterAndSortEvents(mockEvents, defaultFilters);
    const closedIndex = result.findIndex((e) => e.displayStatus === "closed");
    const nonClosedAfterClosed = result.slice(closedIndex).some((e) => e.displayStatus !== "closed");
    // closedが出始めたら、それ以降はすべてclosed
    if (closedIndex !== -1) {
      expect(nonClosedAfterClosed).toBe(false);
    }
  });

  it("未終了イベントは日付昇順でソートされること", () => {
    const result = filterAndSortEvents(mockEvents, defaultFilters);
    const nonClosed = result.filter((e) => e.displayStatus !== "closed");
    for (let i = 1; i < nonClosed.length; i++) {
      expect(new Date(nonClosed[i].date).getTime()).toBeGreaterThanOrEqual(
        new Date(nonClosed[i - 1].date).getTime()
      );
    }
  });

  it("終了イベントは日付降順でソートされること", () => {
    const result = filterAndSortEvents(mockEvents, defaultFilters);
    const closed = result.filter((e) => e.displayStatus === "closed");
    for (let i = 1; i < closed.length; i++) {
      expect(new Date(closed[i].date).getTime()).toBeLessThanOrEqual(
        new Date(closed[i - 1].date).getTime()
      );
    }
  });

  // ============================================================
  // displayStatus の付与
  // ============================================================

  it("各イベントにdisplayStatusが付与されること", () => {
    const result = filterAndSortEvents(mockEvents, defaultFilters);
    result.forEach((event) => {
      expect(["receiving", "paused", "waiting", "closed"]).toContain(event.displayStatus);
    });
  });

  it("該当なしの場合は空配列が返ること", () => {
    const result = filterAndSortEvents(mockEvents, { ...defaultFilters, keyword: "存在しないキーワード" });
    expect(result).toHaveLength(0);
  });
});
