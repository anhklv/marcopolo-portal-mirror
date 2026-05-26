import { prisma } from "@/lib/prisma";
import { COMMUNITY_CODE } from "@/lib/constants/community";
import { getAuthenticatedAdmin } from "@/lib/auth/permissions";
import { findAll } from "@/lib/repositories/customer.repository";
import { serializeCustomerForList } from "@/lib/serializers/customer";
import { CustomerList } from "./_components/customer-list";

export const metadata = {
  title: "顧客管理",
};

export default async function CustomersPage() {
  const { isSuper, scopedCommunityIds } = await getAuthenticatedAdmin();

  // 全件取得（フィルタはクライアント側）
  const customers = await findAll(scopedCommunityIds, isSuper, {
    includeFormerMembers: true,
    includeNonMember: true,
  });

  const communities = await prisma.community.findMany({
    where: { code: { not: COMMUNITY_CODE.OTHER } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <CustomerList
      initialCustomers={customers.map(serializeCustomerForList)}
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
