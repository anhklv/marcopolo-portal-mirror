import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { getScopedCommunityIds } from "@/lib/auth/permissions";
import type { AdminForPermission } from "@/lib/auth/permissions";
import { CustomerForm } from "../_components/customer-form";
import { redirect } from "next/navigation";

export default async function NewCustomerPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const adminId = Number(session.user.id);
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    include: { adminCommunities: { select: { communityId: true } } },
  });

  if (!admin) {
    redirect("/admin/login");
  }

  const adminForPermission: AdminForPermission = {
    id: admin.id,
    role: admin.role,
    adminCommunities: admin.adminCommunities,
  };

  const isSuper = admin.role === "super";
  const scopedCommunityIds = await getScopedCommunityIds(adminForPermission);

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
