import { describe, expect, it } from "vitest";
import {
  buildCustomerListPath,
  defaultCustomerListUrlFilters,
  parseCustomerListSearchParams,
} from "@/lib/helpers/customer-list-url";

describe("parseCustomerListSearchParams", () => {
  it("空クエリ → 全デフォルト", () => {
    expect(parseCustomerListSearchParams(new URLSearchParams())).toEqual(
      defaultCustomerListUrlFilters()
    );
  });

  it("keyword=前田 をパースできる", () => {
    const params = new URLSearchParams("keyword=前田");
    expect(parseCustomerListSearchParams(params).keyword).toBe("前田");
  });

  it("複数 communities / memberCategories をパースできる", () => {
    const params = new URLSearchParams(
      "communities=1,2&memberCategories=member,sponsor&auditMemberTypes=regular,online"
    );
    const parsed = parseCustomerListSearchParams(params);
    expect(parsed.communityIds).toEqual([1, 2]);
    expect(parsed.memberCategories).toEqual(["member", "sponsor"]);
    expect(parsed.auditMemberTypes).toEqual(["regular", "online"]);
  });

  it("フラグ系は 1 のみ true", () => {
    const params = new URLSearchParams(
      "premiumOnly=1&includeFormerMembers=1&includeNonMember=1"
    );
    const parsed = parseCustomerListSearchParams(params);
    expect(parsed.premiumOnly).toBe(true);
    expect(parsed.includeFormerMembers).toBe(true);
    expect(parsed.includeNonMemberFilter).toBe(true);
  });

  it("不正値は無視する", () => {
    const params = new URLSearchParams(
      "communities=abc,3,-1&memberCategories=invalid,member&page=0&auditMemberTypes=foo"
    );
    const parsed = parseCustomerListSearchParams(params);
    expect(parsed.communityIds).toEqual([3]);
    expect(parsed.memberCategories).toEqual(["member"]);
    expect(parsed.auditMemberTypes).toEqual([]);
    expect(parsed.page).toBe(1);
  });
});

describe("buildCustomerListPath", () => {
  it("デフォルト値はクエリなし", () => {
    expect(buildCustomerListPath(defaultCustomerListUrlFilters())).toBe(
      "/admin/customers"
    );
  });

  it("keyword の round-trip", () => {
    const filters = { ...defaultCustomerListUrlFilters(), keyword: "前田" };
    const path = buildCustomerListPath(filters);
    expect(path).toBe("/admin/customers?keyword=%E5%89%8D%E7%94%B0");
    expect(parseCustomerListSearchParams(new URLSearchParams(path.split("?")[1]))).toEqual(
      filters
    );
  });

  it("複合条件と page をシリアライズする", () => {
    const filters = {
      ...defaultCustomerListUrlFilters(),
      keyword: "前田",
      communityIds: [1],
      includeFormerMembers: true,
      page: 2,
    };
    const parsed = parseCustomerListSearchParams(
      new URLSearchParams(buildCustomerListPath(filters).split("?")[1] ?? "")
    );
    expect(parsed).toEqual(filters);
  });
});
