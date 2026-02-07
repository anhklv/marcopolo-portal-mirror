import { describe, it, expect } from "vitest";
import {
  filterCustomers,
  type CustomerListFilters,
} from "@/lib/helpers/customer-filter";

// テストデータ生成ヘルパー
function makeCustomer(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    firstName: "太郎",
    lastName: "田中",
    firstNameKana: "タロウ",
    lastNameKana: "タナカ",
    email: "tanaka@example.com",
    subEmails: [],
    company: "テスト株式会社",
    phone: null,
    postalCode: null,
    prefecture: null,
    city: null,
    gender: null,
    listingCategory: null,
    originIndustry: null,
    membershipQualification: null,
    memberCategory: "member",
    contractType: null,
    note: null,
    registeredAt: "2024-01-01T00:00:00.000Z",
    deletedAt: null,
    customerCommunities: [],
    ...overrides,
  };
}

function makeCommunity(communityId: number, code: string, name: string, overrides: Record<string, unknown> = {}) {
  return {
    id: communityId * 10 + 1,
    customerId: 1,
    communityId,
    joinedAt: "2024-04-01T00:00:00.000Z",
    resignedAt: null,
    auditMemberType: null,
    auditMemberPremium: null,
    affiliation: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    community: {
      id: communityId,
      code,
      name,
      hasSurvey: false,
      sortOrder: communityId,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    ...overrides,
  };
}

const defaultFilters: CustomerListFilters = {
  keyword: "",
  communityIds: [],
  memberCategories: [],
  auditMemberTypes: [],
  premiumOnly: false,
  includeFormerMembers: false,
};

describe("filterCustomers", () => {
  // フリーワード検索
  describe("フリーワード検索", () => {
    const customers = [
      makeCustomer({
        id: 1,
        firstName: "太郎",
        lastName: "田中",
        company: "テスト株式会社",
        email: "tanaka@example.com",
        customerCommunities: [makeCommunity(1, "venture_auditor", "ベンチャー監査役の会")],
      }),
      makeCustomer({
        id: 2,
        firstName: "花子",
        lastName: "鈴木",
        company: "鈴木株式会社",
        email: "suzuki@example.com",
        customerCommunities: [makeCommunity(1, "venture_auditor", "ベンチャー監査役の会")],
      }),
    ];

    it("firstName に一致 → ヒット", () => {
      const result = filterCustomers(customers, { ...defaultFilters, keyword: "太郎" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it("lastName に一致 → ヒット", () => {
      const result = filterCustomers(customers, { ...defaultFilters, keyword: "鈴木" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it("company に一致 → ヒット", () => {
      const result = filterCustomers(customers, { ...defaultFilters, keyword: "テスト" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it("email に一致 → ヒット", () => {
      const result = filterCustomers(customers, { ...defaultFilters, keyword: "suzuki" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it("一致なし → 空配列", () => {
      const result = filterCustomers(customers, { ...defaultFilters, keyword: "存在しない" });
      expect(result).toHaveLength(0);
    });
  });

  // コミュニティフィルタ
  describe("コミュニティフィルタ", () => {
    const customers = [
      makeCustomer({
        id: 1,
        customerCommunities: [makeCommunity(1, "venture_auditor", "ベンチャー監査役の会")],
      }),
      makeCustomer({
        id: 2,
        customerCommunities: [makeCommunity(2, "naikan_meetup", "ないかんMeetup")],
      }),
      makeCustomer({
        id: 3,
        customerCommunities: [],
      }),
    ];

    it("特定コミュニティIDで絞り込み → 該当顧客のみ", () => {
      const result = filterCustomers(customers, { ...defaultFilters, communityIds: [1] });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it("複数コミュニティ選択 → OR条件", () => {
      const result = filterCustomers(customers, { ...defaultFilters, communityIds: [1, 2] });
      expect(result).toHaveLength(2);
    });

    it("フィルタ未選択 → 全件表示（ただし非会員はデフォルト除外）", () => {
      const result = filterCustomers(customers, defaultFilters);
      // ID:3 (履歴なし非会員) はデフォルトフィルタ（includeNonMemberFilter: false）により除外される
      expect(result).toHaveLength(2);
      expect(result.map(c => c.id)).not.toContain(3);
    });
  });

  // 会員区分フィルタ
  describe("会員区分フィルタ", () => {
    const customers = [
      makeCustomer({ id: 1, memberCategory: "member", customerCommunities: [makeCommunity(1, "venture_auditor", "ベンチャー監査役の会")] }),
      makeCustomer({ id: 2, memberCategory: "sponsor", customerCommunities: [makeCommunity(1, "venture_auditor", "ベンチャー監査役の会")] }),
      makeCustomer({ id: 3, memberCategory: "observer", customerCommunities: [makeCommunity(1, "venture_auditor", "ベンチャー監査役の会")] }),
    ];

    it("member のみ → 会員のみ", () => {
      const result = filterCustomers(customers, { ...defaultFilters, memberCategories: ["member"] });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it("sponsor + observer → 両方", () => {
      const result = filterCustomers(customers, { ...defaultFilters, memberCategories: ["sponsor", "observer"] });
      expect(result).toHaveLength(2);
    });

    it("フィルタ未選択 → 全件", () => {
      const result = filterCustomers(customers, defaultFilters);
      expect(result).toHaveLength(3);
    });
  });

  // その他フィルタ
  describe("その他フィルタ", () => {
    it("premiumOnly=true → プレミアム顧客のみ", () => {
      const customers = [
        makeCustomer({
          id: 1,
          customerCommunities: [makeCommunity(1, "venture_auditor", "ベンチャー監査役の会", { auditMemberPremium: true })],
        }),
        makeCustomer({
          id: 2,
          customerCommunities: [makeCommunity(1, "venture_auditor", "ベンチャー監査役の会", { auditMemberPremium: false })],
        }),
      ];

      const result = filterCustomers(customers, { ...defaultFilters, premiumOnly: true });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it("includeFormerMembers=false → 全コミュニティ脱退済みを除外", () => {
      const customers = [
        makeCustomer({
          id: 1,
          customerCommunities: [
            makeCommunity(1, "venture_auditor", "ベンチャー監査役の会", { resignedAt: "2025-01-01T00:00:00.000Z" }),
          ],
        }),
        makeCustomer({
          id: 2,
          customerCommunities: [
            makeCommunity(1, "venture_auditor", "ベンチャー監査役の会", { resignedAt: null }),
          ],
        }),
      ];

      const result = filterCustomers(customers, { ...defaultFilters, includeFormerMembers: false });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it("includeFormerMembers=true → 元会員も含む", () => {
      const customers = [
        makeCustomer({
          id: 1,
          customerCommunities: [
            makeCommunity(1, "venture_auditor", "ベンチャー監査役の会", { resignedAt: "2025-01-01T00:00:00.000Z" }),
          ],
        }),
      ];

      const result = filterCustomers(customers, { ...defaultFilters, includeFormerMembers: true });
      expect(result).toHaveLength(1);
    });

    it("複合フィルタ: キーワード + コミュニティ + 会員区分", () => {
      const customers = [
        makeCustomer({
          id: 1,
          firstName: "太郎",
          lastName: "田中",
          memberCategory: "member",
          customerCommunities: [makeCommunity(1, "venture_auditor", "ベンチャー監査役の会")],
        }),
        makeCustomer({
          id: 2,
          firstName: "花子",
          lastName: "鈴木",
          memberCategory: "sponsor",
          customerCommunities: [makeCommunity(1, "venture_auditor", "ベンチャー監査役の会")],
        }),
        makeCustomer({
          id: 3,
          firstName: "太郎",
          lastName: "佐藤",
          memberCategory: "member",
          customerCommunities: [makeCommunity(2, "naikan_meetup", "ないかんMeetup")],
        }),
      ];

      const result = filterCustomers(customers, {
        ...defaultFilters,
        keyword: "太郎",
        communityIds: [1],
        memberCategories: ["member"],
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });
});
