import { describe, it, expect } from "vitest";
import {
  getCustomerBadges,
  classifyEvents,
  type CustomerCommunityForBadge,
  type RsvpEvent,
} from "@/lib/helpers/customer-detail";

describe("getCustomerBadges", () => {
  it("非会員 → 「非会員」バッジのみ", () => {
    const result = getCustomerBadges([], null);
    expect(result).toEqual([{ label: "非会員", variant: "non-member" }]);
  });

  it("ベンチャー監査役の会のみ(正会員) → 会員種別バッジ", () => {
    const communities: CustomerCommunityForBadge[] = [
      {
        communityId: 1,
        auditMemberType: "regular",
        auditMemberPremium: false,
        resignedAt: null,
        community: { code: "venture_auditor", name: "ベンチャー監査役の会" },
      },
    ];
    const result = getCustomerBadges(communities, "member");
    expect(result).toEqual([
      { label: "ベンチャー監査役の会(正会員)", variant: "audit" },
    ]);
  });

  it("複数コミュニティ所属 → 各コミュニティのバッジ", () => {
    const communities: CustomerCommunityForBadge[] = [
      {
        communityId: 1,
        auditMemberType: "online",
        auditMemberPremium: false,
        resignedAt: null,
        community: { code: "venture_auditor", name: "ベンチャー監査役の会" },
      },
      {
        communityId: 2,
        auditMemberType: null,
        auditMemberPremium: null,
        resignedAt: null,
        community: { code: "naikan_meetup", name: "ないかんMeetup" },
      },
    ];
    const result = getCustomerBadges(communities, "member");
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe("ベンチャー監査役の会(オンライン会員)");
    expect(result[1].label).toBe("ないかんMeetup(会員)");
  });

  it("プレミアム会員 → プレミアムバッジも追加", () => {
    const communities: CustomerCommunityForBadge[] = [
      {
        communityId: 1,
        auditMemberType: "regular",
        auditMemberPremium: true,
        resignedAt: null,
        community: { code: "venture_auditor", name: "ベンチャー監査役の会" },
      },
    ];
    const result = getCustomerBadges(communities, "member");
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ label: "プレミアム", variant: "premium" });
  });

  it("スポンサー → 会員区分バッジ", () => {
    const communities: CustomerCommunityForBadge[] = [
      {
        communityId: 1,
        auditMemberType: null,
        auditMemberPremium: null,
        resignedAt: null,
        community: { code: "venture_auditor", name: "ベンチャー監査役の会" },
      },
    ];
    const result = getCustomerBadges(communities, "sponsor");
    expect(result).toEqual([
      { label: "ベンチャー監査役の会(スポンサー)", variant: "audit" },
    ]);
  });

  it("脱退済み + auditMemberTypeあり → 退会表示が優先", () => {
    const communities: CustomerCommunityForBadge[] = [
      {
        communityId: 1,
        auditMemberType: "regular",
        auditMemberPremium: false,
        resignedAt: "2025-01-01T00:00:00.000Z",
        community: { code: "venture_auditor", name: "ベンチャー監査役の会" },
      },
    ];
    const result = getCustomerBadges(communities, "member");
    expect(result[0]).toEqual({ label: "ベンチャー監査役の会(退会)", variant: "destructive-outline" });
  });

  it("脱退済みコミュニティ → 退会表示", () => {
    const communities: CustomerCommunityForBadge[] = [
      {
        communityId: 1,
        auditMemberType: null,
        auditMemberPremium: null,
        resignedAt: "2025-01-01T00:00:00.000Z",
        community: { code: "venture_auditor", name: "ベンチャー監査役の会" },
      },
    ];
    const result = getCustomerBadges(communities, "member");
    expect(result[0]).toEqual({ label: "ベンチャー監査役の会(退会)", variant: "destructive-outline" });
  });
});

describe("classifyEvents", () => {
  const now = new Date("2025-06-01T00:00:00.000Z");

  it("開催日が未来 → upcoming", () => {
    const events: RsvpEvent[] = [
      {
        eventId: 1,
        eventTitle: "未来イベント",
        eventDate: "2025-12-01T00:00:00.000Z",
        communityName: "テスト",
        status: "attending",
      },
    ];
    const { upcoming, past } = classifyEvents(events, now);
    expect(upcoming).toHaveLength(1);
    expect(past).toHaveLength(0);
  });

  it("開催日が過去 → past", () => {
    const events: RsvpEvent[] = [
      {
        eventId: 1,
        eventTitle: "過去イベント",
        eventDate: "2025-01-01T00:00:00.000Z",
        communityName: "テスト",
        status: "attending",
      },
    ];
    const { upcoming, past } = classifyEvents(events, now);
    expect(upcoming).toHaveLength(0);
    expect(past).toHaveLength(1);
  });

  it("混合 → 適切に分類", () => {
    const events: RsvpEvent[] = [
      { eventId: 1, eventTitle: "過去", eventDate: "2025-01-01T00:00:00.000Z", communityName: "", status: "attending" },
      { eventId: 2, eventTitle: "未来", eventDate: "2025-12-01T00:00:00.000Z", communityName: "", status: "pending" },
      { eventId: 3, eventTitle: "過去2", eventDate: "2025-03-01T00:00:00.000Z", communityName: "", status: "absent" },
    ];
    const { upcoming, past } = classifyEvents(events, now);
    expect(upcoming).toHaveLength(1);
    expect(past).toHaveLength(2);
  });
});
