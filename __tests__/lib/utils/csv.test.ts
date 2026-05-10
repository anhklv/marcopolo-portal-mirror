import { describe, it, expect } from "vitest";
import { escapeCsvField, encodeCsvDocument } from "@/lib/utils/csv";

describe("escapeCsvField", () => {
  it("単独のハイフンはそのまま（先頭に'を付けない）", () => {
    expect(escapeCsvField("-")).toBe("-");
  });

  it("-で始まるが単独でない場合はインジェクション対策の'を付ける", () => {
    expect(escapeCsvField("-cmd")).toBe("'-cmd");
  });

  it("= で始まる値は従来どおり'でエスケープ", () => {
    expect(escapeCsvField("=SUM(A1)")).toBe("'=SUM(A1)");
  });
});

describe("encodeCsvDocument", () => {
  it("BOM とヘッダ・複数行を結合する", () => {
    const doc = encodeCsvDocument(
      ["A", "B"],
      [
        ["1", "x"],
        ["2", "y"],
      ]
    );
    expect(doc.charCodeAt(0)).toBe(0xfeff);
    expect(doc).toContain("A,B");
    expect(doc).toContain("1,x");
    expect(doc).toContain("2,y");
  });
});
