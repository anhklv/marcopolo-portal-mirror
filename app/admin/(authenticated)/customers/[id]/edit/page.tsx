import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCustomer, getScopedCommunityIds } from "@/lib/auth/permissions";
import type { AdminForPermission } from "@/lib/auth/permissions";
import { findById } from "@/lib/repositories/customer.repository";
import { CustomerForm } from "../../_components/customer-form";
import { redirect, notFound } from "next/navigation";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customerId = Number(id);

  if (isNaN(customerId)) {
    notFound();
  }

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

  const hasAccess = await canAccessCustomer(adminForPermission, customerId);
  if (!hasAccess) {
    notFound();
  }

  const customer = await findById(customerId);
  if (!customer) {
    notFound();
  }

  const isSuper = admin.role === "super";
  const scopedCommunityIds = await getScopedCommunityIds(adminForPermission);

  const communities = await prisma.community.findMany({
    where: { code: { not: "other" } },
    orderBy: { sortOrder: "asc" },
  });

  // Date をシリアライズして initialData を構築
  const initialData = {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    firstNameKana: customer.firstNameKana,
    lastNameKana: customer.lastNameKana,
    email: customer.email,
    subEmails: customer.subEmails,
    company: customer.company,
    phone: customer.phone,
    postalCode: customer.postalCode,
    prefecture: customer.prefecture,
    city: customer.city,
    gender: customer.gender,
    listingCategory: customer.listingCategory,
    originIndustry: customer.originIndustry,
    membershipQualification: customer.membershipQualification,
    memberCategory: customer.memberCategory,
    contractType: customer.contractType,
    note: customer.note,
    communities: customer.customerCommunities.map((cc) => ({
      communityId: cc.communityId,
      joinedAt: cc.joinedAt?.toISOString() ?? null,
      resignedAt: cc.resignedAt?.toISOString() ?? null,
      auditMemberType: cc.auditMemberType,
      auditMemberPremium: cc.auditMemberPremium,
      affiliation: cc.affiliation,
    })),
  };

  return (
    <CustomerForm
      mode="edit"
      initialData={initialData}
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
