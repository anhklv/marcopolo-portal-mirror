// 顧客一覧のクライアントサイドフィルタロジック
// customer-list.tsx とテストの両方から使用

export interface CustomerListFilters {
  keyword: string;
  communityIds: number[];
  memberCategories: string[];
  auditMemberTypes: string[];
  premiumOnly: boolean;
  includeFormerMembers: boolean;
  includeNonMemberFilter: boolean;
}

export interface FilterableCustomerCommunity {
  communityId: number;
  resignedAt: string | null;
  auditMemberType: string | null;
  auditMemberPremium: boolean | null;
}

export interface FilterableCustomer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  company: string | null;
  memberCategory: string | null;
  customerCommunities: FilterableCustomerCommunity[];
}

export function filterCustomers<T extends FilterableCustomer>(
  customers: T[],
  filters: CustomerListFilters
): T[] {
  return customers.filter((customer) => {
    // フリーワード検索
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      const matches =
        customer.firstName.toLowerCase().includes(kw) ||
        customer.lastName.toLowerCase().includes(kw) ||
        (customer.company?.toLowerCase().includes(kw) ?? false) ||
        customer.email.toLowerCase().includes(kw);
      if (!matches) return false;
    }

    // コミュニティフィルタ & 非会員フィルタ
    const hasCommunityFilter = filters.communityIds.length > 0;
    const hasNonMemberFilter = filters.includeNonMemberFilter;

    if (hasCommunityFilter || hasNonMemberFilter) {
      let matchesCommunity = false;
      let matchesNonMember = false;

      // コミュニティ判定
      if (hasCommunityFilter) {
        matchesCommunity = customer.customerCommunities.some((cc) => {
          if (!filters.communityIds.includes(cc.communityId)) return false;
          // 元会員を含まない場合、脱退済みならヒットしない
          if (!filters.includeFormerMembers && cc.resignedAt !== null) return false;
          return true;
        });
      }

      // 非会員判定（履歴なしのみ）
      if (hasNonMemberFilter) {
        if (customer.customerCommunities.length === 0) {
          matchesNonMember = true;
        }
      }

      // どちらにもヒットしない場合は除外
      if (!matchesCommunity && !matchesNonMember) return false;
    }

    // 会員区分フィルタ
    if (filters.memberCategories.length > 0) {
      if (!customer.memberCategory || !filters.memberCategories.includes(customer.memberCategory)) {
        return false;
      }
    }

    // 会員種別フィルタ
    if (filters.auditMemberTypes.length > 0) {
      const hasMatchingType = customer.customerCommunities.some(
        (cc) => cc.auditMemberType && filters.auditMemberTypes.includes(cc.auditMemberType)
      );
      if (!hasMatchingType) return false;
    }

    // プレミアムフィルタ
    if (filters.premiumOnly) {
      const hasPremium = customer.customerCommunities.some(
        (cc) => cc.auditMemberPremium === true
      );
      if (!hasPremium) return false;
    }

    // 元会員フィルタ（全脱退者の除外）
    // includeFormerMembersがOFFの場合、全脱退者を除外
    if (!filters.includeFormerMembers && customer.customerCommunities.length > 0) {
      const allResigned = customer.customerCommunities.every(
        (cc) => cc.resignedAt !== null
      );
      if (allResigned) return false;
    }

    // 非会員フィルタ（履歴なしの除外）
    // includeNonMemberFilterがOFFの場合、かつ、コミュニティフィルタが有効な場合のみ、履歴なしを除外
    // （デフォルトは全表示のため、コミュニティフィルタ無効時は非会員も表示する）
    if (hasCommunityFilter && !filters.includeNonMemberFilter && customer.customerCommunities.length === 0) {
      return false;
    }

    return true;
  });
}
