import { describe, expect, it } from "vitest";
import {
  buildEventListPath,
  defaultEventListUrlFilters,
  parseEventListSearchParams,
} from "@/lib/helpers/event-list-url";

describe("parseEventListSearchParams", () => {
  it("空クエリ → 全デフォルト", () => {
    expect(parseEventListSearchParams(new URLSearchParams())).toEqual(
      defaultEventListUrlFilters()
    );
  });

  it("keyword をパースできる", () => {
    const params = new URLSearchParams("keyword=meetup");
    expect(parseEventListSearchParams(params).keyword).toBe("meetup");
  });

  it("statuses / eventTypes をパースできる", () => {
    const params = new URLSearchParams(
      "statuses=receiving,closed&eventTypes=venture_auditor,ai_club"
    );
    const parsed = parseEventListSearchParams(params);
    expect(parsed.statuses).toEqual(["receiving", "closed"]);
    expect(parsed.eventTypeCodes).toEqual(["venture_auditor", "ai_club"]);
  });

  it("不正値は無視する", () => {
    const params = new URLSearchParams("statuses=invalid,receiving&page=0");
    const parsed = parseEventListSearchParams(params);
    expect(parsed.statuses).toEqual(["receiving"]);
    expect(parsed.page).toBe(1);
  });
});

describe("buildEventListPath", () => {
  it("デフォルト値はクエリなし", () => {
    expect(buildEventListPath(defaultEventListUrlFilters())).toBe("/admin/events");
  });

  it("複合条件と page をシリアライズする", () => {
    const filters = {
      ...defaultEventListUrlFilters(),
      keyword: "meetup",
      statuses: ["receiving" as const],
      eventTypeCodes: ["ai_club"],
      page: 2,
    };
    const parsed = parseEventListSearchParams(
      new URLSearchParams(buildEventListPath(filters).split("?")[1] ?? "")
    );
    expect(parsed).toEqual(filters);
  });
});
