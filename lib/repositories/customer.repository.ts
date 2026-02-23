import { prisma } from "@/lib/prisma";
import type { Prisma, Customer, CustomerCommunity, Community, Rsvp, Event, Prefecture, ListingCategory, OriginIndustry, MembershipQualification, Affiliation, MemberCategory, AuditMemberType } from "@/lib/generated/prisma";


// ============================================================
// 型定義
// ============================================================

export type CustomerWithCommunities = Customer & {
  customerCommunities: (CustomerCommunity & {
    community: Community;
    affiliation?: Affiliation | null;
    originIndustry?: OriginIndustry | null;
    membershipQualification?: MembershipQualification | null;
  })[];
  prefecture?: Prefecture | null;
  listingCategory?: ListingCategory | null;
};

export type CustomerDetail = Omit<CustomerWithCommunities, "customerCommunities"> & {
  customerCommunities: (CustomerCommunity & {
    community: Community;
    affiliation?: Affiliation | null;
    originIndustry?: OriginIndustry | null;
    membershipQualification?: MembershipQualification | null;
  })[];
  rsvps: (Rsvp & { event: Event })[];
};

export interface CustomerListFilters {
  keyword?: string;
  communityIds?: number[];
  memberCategories?: MemberCategory[];
  auditMemberTypes?: AuditMemberType[];
  premiumOnly?: boolean;
  includeFormerMembers?: boolean;
  includeNonMember?: boolean;
}

interface CustomerCreateData {
  firstName: string;
  lastName: string;
  firstNameKana?: string | null;
  lastNameKana?: string | null;
  email: string;
  subEmails?: string[];
  company?: string | null;
  phone?: string | null;
  postalCode?: string | null;
  prefectureId?: number | null;
  city?: string | null;
  gender?: "male" | "female" | null;
  listingCategoryId?: number | null;
  memberCategory?: "member" | "sponsor" | "observer" | null;
  contractType?: "corporate" | "individual" | null;
  jobChangeIntent?: "active" | "considering" | "if_good" | "not_thinking" | null;
  note?: string | null;
  communities?: CommunityCreateData[];
}

interface CommunityCreateData {
  communityId: number;
  joinedAt?: Date | null;
  resignedAt?: Date | null;
  auditMemberType?: "regular" | "online" | null;
  auditMemberPremium?: boolean | null;
  affiliationId?: number | null;
  originIndustryId?: number | null;
  membershipQualificationId?: number | null;
}

// ============================================================
// Repository 関数
// ============================================================

/**
 * 顧客一覧取得（スコープ+フィルタ、deletedAt=null）
 */
export async function findAll(
  scopedCommunityIds: number[],
  isSuper: boolean,
  filters?: CustomerListFilters
): Promise<CustomerWithCommunities[]> {
  const where: Prisma.CustomerWhereInput = {
    deletedAt: null,
  };

  const conditions: Prisma.CustomerWhereInput[] = [];

  // キーワード検索
  if (filters?.keyword) {
    const kw = filters.keyword;
    conditions.push({
      OR: [
        { firstName: { contains: kw, mode: "insensitive" } },
        { lastName: { contains: kw, mode: "insensitive" } },
        { company: { contains: kw, mode: "insensitive" } },
        { email: { contains: kw, mode: "insensitive" } },
      ],
    });
  }

  // スコープフィルタ + includeNonMember
  const includeNonMember = isSuper && (filters?.includeNonMember === true);
  if (!isSuper) {
    // community_admin: スコープ内コミュニティに所属する顧客のみ
    conditions.push({
      customerCommunities: {
        some: {
          communityId: { in: scopedCommunityIds },
        },
      },
    });
  } else if (!includeNonMember) {
    // super + 非会員（履歴なし）を含まない場合 = 少なくとも1つのコミュニティ履歴がある
    conditions.push({
      customerCommunities: {
        some: {},
      },
    });
  }

  // コミュニティフィルタ
  if (filters?.communityIds && filters.communityIds.length > 0) {
    conditions.push({
      customerCommunities: {
        some: {
          communityId: { in: filters.communityIds },
          // 元会員を含まない場合は、現役のみに絞る
          resignedAt: filters.includeFormerMembers ? undefined : null,
        },
      },
    });
  }

  // 会員区分フィルタ
  if (filters?.memberCategories && filters.memberCategories.length > 0) {
    conditions.push({
      memberCategory: { in: filters.memberCategories },
    });
  }

  // ベンチャー監査役の会 会員種別フィルタ
  if (filters?.auditMemberTypes && filters.auditMemberTypes.length > 0) {
    conditions.push({
      customerCommunities: {
        some: {
          auditMemberType: { in: filters.auditMemberTypes },
        },
      },
    });
  }

  // プレミアム会員フィルタ
  if (filters?.premiumOnly) {
    conditions.push({
      customerCommunities: {
        some: {
          auditMemberPremium: true,
        },
      },
    });
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      customerCommunities: {
        include: {
          community: true,
          affiliation: true,
          originIndustry: true,
          membershipQualification: true,
        },
      },
      prefecture: true,
      listingCategory: true,
    },
    orderBy: { id: "desc" },
  });

  // 元会員フィルタ（アプリケーション側でフィルタ）
  if (!filters?.includeFormerMembers) {
    return customers.filter((customer) => {
      if (customer.customerCommunities.length === 0) return true;
      const allResigned = customer.customerCommunities.every(
        (cc) => cc.resignedAt !== null
      );
      return !allResigned;
    });
  }

  return customers;
}

/**
 * 詳細取得（communities + rsvps include）
 */
export async function findById(id: number): Promise<CustomerDetail | null> {
  return prisma.customer.findFirst({
    where: { id, deletedAt: null },
    include: {
      customerCommunities: {
        include: {
          community: true,
          affiliation: true,
          originIndustry: true,
          membershipQualification: true,
        },
      },
      rsvps: {
        include: { event: true },
        orderBy: { event: { date: "desc" } },
      },
      prefecture: true,
      listingCategory: true,
    },
  });
}

/**
 * 新規作成（Customer + CustomerCommunity を $transaction）
 */
export async function create(data: CustomerCreateData): Promise<Customer> {
  const { communities, ...customerData } = data;

  // 空文字をnullに変換
  const cleanData = cleanEmptyStrings(customerData);

  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: cleanData as Prisma.CustomerCreateInput,
    });

    if (communities && communities.length > 0) {
      await tx.customerCommunity.createMany({
        data: communities.map((c) => ({
          customerId: customer.id,
          communityId: c.communityId,
          joinedAt: c.joinedAt,
          resignedAt: c.resignedAt,
          auditMemberType: c.auditMemberType,
          auditMemberPremium: c.auditMemberPremium,
          affiliationId: c.affiliationId,
          originIndustryId: c.originIndustryId,
          membershipQualificationId: c.membershipQualificationId,
        })),
      });
    }

    return customer;
  });
}

/**
 * 更新（CustomerCommunity の差分更新を $transaction）
 */
export async function update(id: number, data: CustomerCreateData): Promise<Customer> {
  const { communities, ...customerData } = data;

  // 空文字をnullに変換
  const cleanData = cleanEmptyStrings(customerData);

  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.update({
      where: { id },
      data: cleanData as Prisma.CustomerUpdateInput,
    });

    // 既存のコミュニティ紐づけを全削除して再作成
    await tx.customerCommunity.deleteMany({
      where: { customerId: id },
    });

    if (communities && communities.length > 0) {
      await tx.customerCommunity.createMany({
        data: communities.map((c) => ({
          customerId: id,
          communityId: c.communityId,
          joinedAt: c.joinedAt,
          resignedAt: c.resignedAt,
          auditMemberType: c.auditMemberType,
          auditMemberPremium: c.auditMemberPremium,
          affiliationId: c.affiliationId,
          originIndustryId: c.originIndustryId,
          membershipQualificationId: c.membershipQualificationId,
        })),
      });
    }

    return customer;
  });
}

/**
 * 論理削除（deletedAt 設定）
 */
export async function softDelete(id: number): Promise<Customer> {
  return prisma.customer.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/**
 * メール重複チェック
 */
export async function existsByEmail(
  email: string,
  idToExclude?: number
): Promise<boolean> {
  const where: Prisma.CustomerWhereInput = {
    email,
    deletedAt: null,
  };

  if (idToExclude) {
    where.id = { not: idToExclude };
  }

  const count = await prisma.customer.count({ where });
  return count > 0;
}

// ============================================================
// ヘルパー
// ============================================================

function cleanEmptyStrings<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (result[key] === "") {
      (result as Record<string, unknown>)[key] = null;
    }
  }
  return result;
}
