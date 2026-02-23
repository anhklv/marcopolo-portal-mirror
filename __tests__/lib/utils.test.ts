import { describe, expect, it } from "vitest";
import { formatDate, isoToDisplay } from "@/lib/utils";

describe("formatDate", () => {
  it("Dateオブジェクトを YYYY/MM/DD 形式に変換する", () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe("2026/01/05");
    expect(formatDate(new Date(2025, 11, 31))).toBe("2025/12/31");
  });

  it("日付文字列を YYYY/MM/DD 形式に変換する", () => {
    expect(formatDate("2026-03-09T10:00:00.000Z")).toBe("2026/03/09");
  });

  it("月・日が1桁の場合にゼロ埋めする", () => {
    expect(formatDate(new Date(2026, 0, 1))).toBe("2026/01/01");
  });
});

describe("isoToDisplay", () => {
  it("ISO形式の日付文字列を YYYY/MM/DD に変換する", () => {
    expect(isoToDisplay("2026-01-05")).toBe("2026/01/05");
    expect(isoToDisplay("2026-12-31T23:59:59.999Z")).toBe("2026/12/31");
  });

  it("null/undefined/空文字の場合は空文字を返す", () => {
    expect(isoToDisplay(null)).toBe("");
    expect(isoToDisplay(undefined)).toBe("");
    expect(isoToDisplay("")).toBe("");
  });
});
