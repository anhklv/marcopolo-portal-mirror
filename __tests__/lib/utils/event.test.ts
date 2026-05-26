import { describe, it, expect } from "vitest";
import {
  dateToEventFormIsoWithOffset,
  formatDateTime,
  formatEventDate,
  getEventDisplayStatus,
} from "@/lib/utils/event";

describe("getEventDisplayStatus", () => {
  it("回答期限前 + 未停止 → receiving", () => {
    const event = {
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1週間後
      responseDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3日後
      isPaused: false,
    };
    expect(getEventDisplayStatus(event)).toBe("receiving");
  });

  it("回答期限後〜開催日前 → waiting", () => {
    const event = {
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1週間後
      responseDeadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1日前（期限切れ）
      isPaused: false,
    };
    expect(getEventDisplayStatus(event)).toBe("waiting");
  });

  it("開催日後 → closed", () => {
    const event = {
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1日前
      responseDeadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      isPaused: false,
    };
    expect(getEventDisplayStatus(event)).toBe("closed");
  });

  it("停止中 → paused", () => {
    const event = {
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      responseDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      isPaused: true,
    };
    expect(getEventDisplayStatus(event)).toBe("paused");
  });

  it("回答期限なし → 開催日前なら receiving", () => {
    const event = {
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      responseDeadline: null,
      isPaused: false,
    };
    expect(getEventDisplayStatus(event)).toBe("receiving");
  });

  it("開催日時ちょうど → closed（境界値: eventDate <= now）", () => {
    const now = new Date();
    const event = {
      date: now,
      responseDeadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      isPaused: false,
    };
    expect(getEventDisplayStatus(event)).toBe("closed");
  });

  it("過去日 + isPaused=true → closed（pausedではなくclosedが優先）", () => {
    const event = {
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1日前
      responseDeadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      isPaused: true,
    };
    expect(getEventDisplayStatus(event)).toBe("closed");
  });

  it("文字列形式の日付でも正しく判定できる", () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const futureDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const event = {
      date: futureDate.toISOString(),
      responseDeadline: futureDeadline.toISOString(),
      isPaused: false,
    };
    expect(getEventDisplayStatus(event)).toBe("receiving");
  });
});

describe("formatEventDate", () => {
  it("UTCインスタントを東京の壁時計と曜日で表示する", () => {
    expect(formatEventDate("2026-04-15T10:00:00.000Z")).toBe(
      "2026年4月15日(水) 19:00"
    );
  });
});

describe("formatDateTime", () => {
  it("UTCインスタントを東京の壁時計で表示する", () => {
    expect(formatDateTime("2026-04-15T10:00:00.000Z")).toBe(
      "2026年4月15日 19:00"
    );
  });

  it("Date型の引数を受け付ける", () => {
    expect(
      formatDateTime(new Date("2026-01-15T10:00:00.000Z"))
    ).toBe("2026年1月15日 19:00");
  });

  it("不正な文字列はそのまま返す", () => {
    expect(formatDateTime("invalid-date")).toBe("invalid-date");
  });
});

describe("dateToEventFormIsoWithOffset", () => {
  it("DBの瞬間を業務TZのISO（+09:00付き）にする", () => {
    expect(
      dateToEventFormIsoWithOffset(new Date("2026-04-15T10:00:00.000Z"))
    ).toBe("2026-04-15T19:00:00+09:00");
  });
});