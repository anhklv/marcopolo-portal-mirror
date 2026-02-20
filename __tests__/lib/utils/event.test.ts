import { describe, it, expect } from "vitest";
import { getEventDisplayStatus } from "@/lib/utils/event";

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
