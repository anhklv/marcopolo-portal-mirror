import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth/permissions";
import { findAll } from "@/lib/repositories/customer.repository";
import { CustomerList } from "./_components/customer-list";

export default async function CustomersPage() {
  const { isSuper, scopedCommunityIds } = await getAuthenticatedAdmin();

  // 全件取得（フィルタはクライアント側）
  const customers = await findAll(scopedCommunityIds, isSuper, {
    includeFormerMembers: true,
    includeNonMember: true,
  });

  const communities = await prisma.community.findMany({
    where: { code: { not: "other" } },
    orderBy: { sortOrder: "asc" },
  });

  // Date をシリアライズ
  const serializedCustomers = customers.map((c) => {
    const auditCC = c.customerCommunities.find((cc) => cc.community.code === "venture_auditor");
    return {
    ...c,
    prefecture: c.prefecture?.name ?? null,
    listingCategory: c.listingCategory?.marketName ?? null,
    originIndustry: auditCC?.originIndustry?.name ?? null,
    membershipQualification: auditCC?.membershipQualification?.name ?? null,
    registeredAt: c.registeredAt.toISOString(),
    deletedAt: c.deletedAt?.toISOString() ?? null,
    customerCommunities: c.customerCommunities.map((cc) => ({
      ...cc,
      joinedAt: cc.joinedAt?.toISOString() ?? null,
      resignedAt: cc.resignedAt?.toISOString() ?? null,
      affiliation: cc.affiliation?.name ?? null,
      createdAt: cc.createdAt.toISOString(),
      updatedAt: cc.updatedAt.toISOString(),
      community: {
        ...cc.community,
        createdAt: cc.community.createdAt.toISOString(),
        updatedAt: cc.community.updatedAt.toISOString(),
      },
    })),
  };
  });

  return (
    <CustomerList
      initialCustomers={serializedCustomers as any}
      communities={communities.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
      }))}
      isSuper={isSuper}
      scopedCommunityIds={scopedCommunityIds}
    />
  );
}
