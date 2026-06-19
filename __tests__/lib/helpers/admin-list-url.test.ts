import { describe, expect, it } from "vitest";
import {
  buildAdminListPath,
  defaultAdminListUrlFilters,
  parseAdminListSearchParams,
} from "@/lib/helpers/admin-list-url";

describe("parseAdminListSearchParams", () => {
  it("空クエリ → 全デフォルト", () => {
    expect(parseAdminListSearchParams(new URLSearchParams())).toEqual(
      defaultAdminListUrlFilters()
    );
  });

  it("keyword をパースできる", () => {
    const params = new URLSearchParams("keyword=山田");
    expect(parseAdminListSearchParams(params).keyword).toBe("山田");
  });
});

describe("buildAdminListPath", () => {
  it("デフォルト値はクエリなし", () => {
    expect(buildAdminListPath(defaultAdminListUrlFilters())).toBe("/admin/admins");
  });

  it("keyword の round-trip", () => {
    const filters = { ...defaultAdminListUrlFilters(), keyword: "山田" };
    const path = buildAdminListPath(filters);
    expect(path).toBe("/admin/admins?keyword=%E5%B1%B1%E7%94%B0");
    expect(parseAdminListSearchParams(new URLSearchParams(path.split("?")[1]))).toEqual(
      filters
    );
  });
});
