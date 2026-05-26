import { describe, it, expect } from "vitest";
import { getUtf8CsvWithBomBytes } from "@/lib/utils/csv-download";

describe("getUtf8CsvWithBomBytes", () => {
  it("先頭3バイトが UTF-8 BOM（EF BB BF）になる", () => {
    const u8 = getUtf8CsvWithBomBytes("ID,氏名\n1,テスト");
    expect(u8[0]).toBe(0xef);
    expect(u8[1]).toBe(0xbb);
    expect(u8[2]).toBe(0xbf);
  });

  it("サーバー側で付いた BOM 文字を重ねない", () => {
    const u8 = getUtf8CsvWithBomBytes("\uFEFFID,氏名\n1,テスト");
    expect(u8[0]).toBe(0xef);
    expect(u8[1]).toBe(0xbb);
    expect(u8[2]).toBe(0xbf);
    expect(u8[3]).toBe("I".charCodeAt(0));
  });

  it("日本語が UTF-8 で壊れない", () => {
    const text = "姓,名\n山田,太郎";
    const u8 = getUtf8CsvWithBomBytes(text);
    const raw = new TextDecoder("utf-8").decode(u8);
    expect(raw.replace(/^\uFEFF/, "")).toBe(text);
  });
});
