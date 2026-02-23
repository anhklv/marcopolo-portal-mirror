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

  it("正常系: location が255文字ちょうど", () => {
    const result = eventSchema.safeParse({
      title: "テストイベント",
      communityId: 1,
      date: new Date("2026-03-01T18:00:00"),
      location: "あ".repeat(255),
    });
    expect(result.success).toBe(true);
  });

  it("異常系: location が256文字", () => {
    const result = eventSchema.safeParse({
      title: "テストイベント",
      communityId: 1,
      date: new Date("2026-03-01T18:00:00"),
      location: "あ".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("正常系: description, timetable, note が空文字列", () => {
    const result = eventSchema.safeParse({
      title: "テストイベント",
      communityId: 1,
      date: new Date("2026-03-01T18:00:00"),
      description: "",
      timetable: "",
      note: "",
    });
    expect(result.success).toBe(true);
  });

  it("正常系: allowsOnline=true, hasAfterParty=true", () => {
    const result = eventSchema.safeParse({
      title: "テストイベント",
      communityId: 1,
      date: new Date("2026-03-01T18:00:00"),
      allowsOnline: true,
      hasAfterParty: true,
    });
    expect(result.success).toBe(true);
  });

  it("変換: responseDeadline が空文字列 → null", () => {
    const result = eventSchema.safeParse({
      title: "テストイベント",
      communityId: 1,
      date: new Date("2026-03-01T18:00:00"),
      responseDeadline: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.responseDeadline).toBeNull();
    }
  });

  it("変換: responseDeadline が undefined → null", () => {
    const result = eventSchema.safeParse({
      title: "テストイベント",
      communityId: 1,
      date: new Date("2026-03-01T18:00:00"),
      responseDeadline: undefined,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.responseDeadline).toBeNull();
    }
  });

  it("異常系: communityId が 0", () => {
    const result = eventSchema.safeParse({
      title: "テストイベント",
      communityId: 0,
      date: new Date("2026-03-01T18:00:00"),
    });
    expect(result.success).toBe(false);
  });

  it("異常系: communityId が負数", () => {
    const result = eventSchema.safeParse({
      title: "テストイベント",
      communityId: -1,
      date: new Date("2026-03-01T18:00:00"),
    });
    expect(result.success).toBe(false);
  });

  it("変換: date にISO文字列 → coerce変換で成功", () => {
    const result = eventSchema.safeParse({
      title: "テストイベント",
      communityId: 1,
      date: "2026-03-01T18:00:00",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toBeInstanceOf(Date);
    }
  });

  it("異常系: responseDeadline > date → 相関チェックで失敗", () => {
    const result = eventSchema.safeParse({
      title: "テストイベント",
      communityId: 1,
      date: new Date("2026-03-01T18:00:00"),
      responseDeadline: new Date("2026-03-02T00:00:00"),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const deadlineError = result.error.issues.find(
        (i) => i.path.includes("responseDeadline")
      );
      expect(deadlineError?.message).toBe("回答期限は開催日時より前に設定してください");
    }
  });

  it("異常系: title が空白のみ → trim後に失敗", () => {
    const result = eventSchema.safeParse({
      title: "   ",
      communityId: 1,
      date: new Date("2026-03-01T18:00:00"),
    });
    expect(result.success).toBe(false);
  });
});
