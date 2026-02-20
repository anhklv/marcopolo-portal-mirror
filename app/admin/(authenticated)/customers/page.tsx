import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth/permissions";
import { findAll } from "@/lib/repositories/customer.repository";
import { serializeCustomerForList } from "@/lib/serializers/customer";
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
