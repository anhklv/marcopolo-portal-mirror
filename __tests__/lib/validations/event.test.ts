import { describe, it, expect } from "vitest";
import { eventSchema } from "@/lib/validations/event";

describe("eventSchema", () => {
  it("正常系: 必須項目のみ", () => {
    const result = eventSchema.safeParse({
      title: "テストイベント",
      communityId: 1,
      date: new Date("2026-03-01T18:00:00"),
    });
    expect(result.success).toBe(true);
  });

  it("正常系: 全項目入力", () => {
    const result = eventSchema.safeParse({
      title: "テストイベント",
      communityId: 1,
      date: new Date("2026-03-01T18:00:00"),
      location: "東京都千代田区",
      description: "イベント概要",
      timetable: "18:00 開場\n18:30 開始",
      note: "備考",
      responseDeadline: new Date("2026-02-25T23:59:59"),
      allowsOnline: true,
      hasAfterParty: true,
    });
    expect(result.success).toBe(true);
  });

  it("異常系: タイトルが空", () => {
    const result = eventSchema.safeParse({
      title: "",
      communityId: 1,
      date: new Date("2026-03-01T18:00:00"),
    });
    expect(result.success).toBe(false);
  });

  it("異常系: communityId がない", () => {
    const result = eventSchema.safeParse({
      title: "テストイベント",
      date: new Date("2026-03-01T18:00:00"),
    });
    expect(result.success).toBe(false);
  });

  it("異常系: タイトルが200文字超", () => {
    const result = eventSchema.safeParse({
      title: "あ".repeat(201),
      communityId: 1,
      date: new Date("2026-03-01T18:00:00"),
    });
    expect(result.success).toBe(false);
  });

  it("正常系: responseDeadline が null", () => {
    const result = eventSchema.safeParse({
      title: "テストイベント",
      communityId: 1,
      date: new Date("2026-03-01T18:00:00"),
      responseDeadline: null,
    });
    expect(result.success).toBe(true);
  });
});
