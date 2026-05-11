import { describe, it, expect } from "vitest";
import {
  formatDateTokyoYmdSlash,
  toTokyoOffsetIsoString,
  toTokyoOffsetIsoStringOrNull,
} from "@/lib/utils/datetime";

describe("toTokyoOffsetIsoString", () => {
  it("UTCの瞬間を+09:00表記にする", () => {
    expect(toTokyoOffsetIsoString(new Date("2026-04-15T10:00:00.000Z"))).toBe(
      "2026-04-15T19:00:00+09:00"
    );
  });
});

describe("toTokyoOffsetIsoStringOrNull", () => {
  it("null/undefined は null", () => {
    expect(toTokyoOffsetIsoStringOrNull(null)).toBeNull();
    expect(toTokyoOffsetIsoStringOrNull(undefined)).toBeNull();
  });
});

describe("formatDateTokyoYmdSlash", () => {
  it("東京の暦で YYYY/MM/DD", () => {
    expect(formatDateTokyoYmdSlash(new Date("2026-03-09T10:00:00.000Z"))).toBe(
      "2026/03/09"
    );
  });
});
