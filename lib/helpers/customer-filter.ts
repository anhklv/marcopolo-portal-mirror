// 顧客一覧のクライアントサイドフィルタロジック
// customer-list.tsx とテストの両方から使用

export interface CustomerListFilters {
  keyword: string;
  communityIds: number[];
  memberCategories: string[];
  auditMemberTypes: string[];
  premiumOnly: boolean;
  includeFormerMembers: boolean;
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

    // コミュニティフィルタ
    if (filters.communityIds.length > 0) {
      if (customer.customerCommunities.length === 0) return false;
      const customerCommunityIds = customer.customerCommunities.map((cc) => cc.communityId);
      const matchesCommunity = filters.communityIds.some((id) =>
        customerCommunityIds.includes(id)
      );
      if (!matchesCommunity) return false;
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

    // 元会員フィルタ
    if (!filters.includeFormerMembers && customer.customerCommunities.length > 0) {
      const allResigned = customer.customerCommunities.every(
        (cc) => cc.resignedAt !== null
      );
      if (allResigned) return false;
    }

    return true;
  });
}
