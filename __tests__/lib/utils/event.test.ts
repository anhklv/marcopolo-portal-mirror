import { describe, it, expect } from "vitest";
import { formatDateTime, getEventDisplayStatus } from "@/lib/utils/event";

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

describe("formatDateTime", () => {
  it("ISO文字列を「YYYY年M月D日 HH:mm」形式にフォーマットする", () => {
    // ローカルタイムゾーンに依存するため、Dateで構築
    const date = new Date(2024, 11, 1, 23, 59); // 2024年12月1日 23:59
    const result = formatDateTime(date);
    expect(result).toBe("2024年12月1日 23:59");
  });

  it("Date型の引数を受け付ける", () => {
    const date = new Date(2026, 0, 15, 9, 0); // 2026年1月15日 09:00
    const result = formatDateTime(date);
    expect(result).toBe("2026年1月15日 09:00");
  });

  it("時刻が0埋めされる", () => {
    const date = new Date(2026, 5, 3, 8, 5); // 2026年6月3日 08:05
    const result = formatDateTime(date);
    expect(result).toBe("2026年6月3日 08:05");
  });

  it("不正な文字列はそのまま返す", () => {
    const result = formatDateTime("invalid-date");
    expect(result).toBe("invalid-date");
  });
});
