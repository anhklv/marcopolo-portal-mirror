import { describe, it, expect } from "vitest";
import { filterCustomers, FilterableCustomer, CustomerListFilters } from "@/lib/helpers/customer-filter";

describe("customer-filter", () => {
  const mockCustomers: FilterableCustomer[] = [
    {
      id: 1,
      firstName: "太郎",
      lastName: "山田",
      email: "taro@example.com",
      company: "山田商事",
      memberCategory: "member",
      customerCommunities: [
        { communityId: 1, resignedAt: null, auditMemberType: "regular", auditMemberPremium: false },
      ],
    },
    {
      id: 2,
      firstName: "次郎",
      lastName: "鈴木",
      email: "jiro@example.com",
      company: null,
      memberCategory: "sponsor",
      customerCommunities: [
        { communityId: 2, resignedAt: null, auditMemberType: null, auditMemberPremium: null },
      ],
    },
    {
      id: 3,
      firstName: "三郎",
      lastName: "田中",
      email: "saburo@example.com",
      company: null,
      memberCategory: null,
      customerCommunities: [], // 履歴なし非会員
    },
    {
      id: 4,
      firstName: "四郎",
      lastName: "高橋",
      email: "shiro@example.com",
      company: null,
      memberCategory: "member",
      customerCommunities: [
        { communityId: 1, resignedAt: "2023-01-01", auditMemberType: "regular", auditMemberPremium: false },
      ], // 全脱退済み（元会員）
    },
    {
      id: 5,
      firstName: "五郎",
      lastName: "佐藤",
      email: "goro@example.com",
      company: null,
      memberCategory: "member",
      customerCommunities: [
        { communityId: 1, resignedAt: "2023-01-01", auditMemberType: "regular", auditMemberPremium: false },
        { communityId: 2, resignedAt: null, auditMemberType: null, auditMemberPremium: null },
      ], // 一部脱退（コミュニティ2は現役）
    },
  ];

  const defaultFilters: CustomerListFilters = {
    keyword: "",
    communityIds: [],
    memberCategories: [],
    auditMemberTypes: [],
    premiumOnly: false,
    includeFormerMembers: false,
    includeNonMemberFilter: false,
  };

  it("キーワード検索で正しくフィルタリングされること", () => {
    const filters = { ...defaultFilters, keyword: "山田" };
    const result = filterCustomers(mockCustomers, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("コミュニティIDでフィルタリングされること", () => {
    const filters = { ...defaultFilters, communityIds: [1] };
    const result = filterCustomers(mockCustomers, filters);
    // ID:1 (現役), ID:5 (脱退済みだがID一致) -> includeFormerMembers=falseなら脱退済みは除外
    // ID:1は現役なのでヒット。
    // ID:5はCommunity1に関しては脱退済み。
    // ロジック確認: matchesCommunity = ... if (!includeFormerMembers && cc.resignedAt !== null) return false;
    // なのでID:5はCommunity1に関してはヒットしない。しかしCommunity2にも所属している。
    // フィルタはCommunity1を指定しているので、Community1に関して現役である必要がある。
    // よってID:5はヒットしないはず。
    
    // 再確認: ID:5
    // Community1: resigned
    // Community2: active
    // filter: Community1
    // some loop:
    //  - cc(id:1): resigned -> false
    //  - cc(id:2): id mismatch -> false
    // result: false. 正しい。
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("非会員フィルタ（履歴なし）がヒットすること", () => {
    const filters = { ...defaultFilters, includeNonMemberFilter: true };
    // includeNonMemberFilterがONの場合、履歴なし（ID:3）のみヒットするはず
    // 全脱退者（ID:4）は非会員としてはヒットしない（includeFormerMembers=trueが必要）
    const result = filterCustomers(mockCustomers, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });

  it("元会員を含む（includeFormerMembers=true）の場合、脱退済みもヒットすること", () => {
    const filters = { ...defaultFilters, communityIds: [1], includeFormerMembers: true };
    // ID:1 (現役) -> Hit
    // ID:4 (全脱退, comm1) -> Hit
    // ID:5 (一部脱退, comm1) -> Hit
    const result = filterCustomers(mockCustomers, filters);
    expect(result).toHaveLength(3);
    expect(result.map(c => c.id).sort()).toEqual([1, 4, 5]);
  });
  
  it("デフォルト（元会員を含まない）の場合、全脱退者は除外されること", () => {
    // フィルタなし（デフォルト）の場合、全脱退者（ID:4）は除外
    // 非会員（履歴なし、ID:3）はデフォルト（コミュニティフィルタ無効時）は全表示のため含まれる
    // 現役＋履歴なし非会員（ID:1, 2, 3, 5）が表示されるはず
    const result = filterCustomers(mockCustomers, defaultFilters);
    expect(result.map(c => c.id).sort()).toEqual([1, 2, 3, 5]);
    expect(result).not.toContainEqual(expect.objectContaining({ id: 4 }));
  });

  it("コミュニティと非会員の複合条件（OR条件）", () => {
    const filters = { 
      ...defaultFilters, 
      communityIds: [2], 
      includeNonMemberFilter: true 
    };
    // ID:2 (Comm2現役) -> Hit (Community)
    // ID:3 (履歴なし) -> Hit (NonMember)
    // ID:4 (全脱退) -> Miss (NonMember=false, Community=false)
    // ID:5 (Comm2現役) -> Hit (Community)
    const result = filterCustomers(mockCustomers, filters);
    expect(result).toHaveLength(3);
    expect(result.map(c => c.id).sort()).toEqual([2, 3, 5]);
  });
});
