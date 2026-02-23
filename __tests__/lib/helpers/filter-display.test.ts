import { describe, it, expect } from "vitest";
import { getFilterDisplayText } from "@/lib/helpers/filter-display";
import type { CommunityOption } from "@/lib/types/serialized";

const communities: CommunityOption[] = [
  { id: 1, code: "venture_auditor", name: "ベンチャー監査役の会" },
  { id: 2, code: "naikan_meetup", name: "ないかんMeetup" },
  { id: 3, code: "ai_division", name: "AI部会" },
];

describe("getFilterDisplayText", () => {
  it("何も選択されていない場合は「コミュニティ」を返す", () => {
    expect(getFilterDisplayText(communities, [], false)).toBe("コミュニティ");
  });

  it("コミュニティが1件選択されている場合はその名前を返す", () => {
    expect(getFilterDisplayText(communities, [1], false)).toBe("ベンチャー監査役の会");
  });

  it("コミュニティが複数選択されている場合は件数を返す", () => {
    expect(getFilterDisplayText(communities, [1, 2], false)).toBe("2件選択");
  });

  it("非会員のみ選択されている場合は「非会員」を返す", () => {
    expect(getFilterDisplayText(communities, [], true)).toBe("非会員");
  });

  it("コミュニティ1件と非会員が選択されている場合は件数を返す", () => {
    expect(getFilterDisplayText(communities, [2], true)).toBe("2件選択");
  });

  it("全コミュニティと非会員が選択されている場合は件数を返す", () => {
    expect(getFilterDisplayText(communities, [1, 2, 3], true)).toBe("4件選択");
  });
});
