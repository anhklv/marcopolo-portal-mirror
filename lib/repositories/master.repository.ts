import { prisma } from "@/lib/prisma";
import { COMMUNITY_CODE } from "@/lib/constants/community";
import type { MasterData, CommunityOption, ListingCategoryOption } from "@/lib/types/serialized";

// ============================================================
// 型定義
// ============================================================

export interface CustomerFormMasterData {
  communities: CommunityOption[];
  prefectures: MasterData[];
  listingCategories: ListingCategoryOption[];
  originIndustries: MasterData[];
  membershipQualifications: MasterData[];
  affiliations: MasterData[];
}

// ============================================================
// Repository 関数
// ============================================================

/**
 * 顧客フォーム（新規作成・編集）で使用するマスタデータを一括取得
 */
export async function fetchCustomerFormMasterData(): Promise<CustomerFormMasterData> {
  const [communities, prefectures, listingCategories, originIndustries, membershipQualifications, affiliations] =
    await Promise.all([
      prisma.community.findMany({ where: { code: { not: COMMUNITY_CODE.OTHER } }, orderBy: { sortOrder: "asc" } }),
      prisma.prefecture.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.listingCategory.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.originIndustry.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.membershipQualification.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.affiliation.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

  return {
    communities: communities.map((c) => ({ id: c.id, code: c.code, name: c.name })),
    prefectures,
    listingCategories: listingCategories.map((lc) => ({
      id: lc.id,
      marketName: lc.marketName,
      stockExchangeName: lc.stockExchangeName,
    })),
    originIndustries,
    membershipQualifications,
    affiliations,
  };
}
