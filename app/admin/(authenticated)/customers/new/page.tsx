import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth/permissions";
import { CustomerForm } from "../_components/customer-form";

export default async function NewCustomerPage() {
  const { isSuper, scopedCommunityIds } = await getAuthenticatedAdmin();

  const [communities, prefectures, listingCategories, originIndustries, membershipQualifications, affiliations] =
    await Promise.all([
      prisma.community.findMany({ where: { code: { not: "other" } }, orderBy: { sortOrder: "asc" } }),
      prisma.prefecture.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.listingCategory.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.originIndustry.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.membershipQualification.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.affiliation.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

  return (
    <CustomerForm
      mode="create"
      communities={communities.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
      }))}
      prefectures={prefectures}
      listingCategories={listingCategories.map((lc) => ({
        id: lc.id,
        marketName: lc.marketName,
        stockExchangeName: lc.stockExchangeName,
      }))}
      originIndustries={originIndustries}
      membershipQualifications={membershipQualifications}
      affiliations={affiliations}
      isSuper={isSuper}
      scopedCommunityIds={scopedCommunityIds}
    />
  );
}
