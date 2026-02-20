import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin, canAccessCustomer } from "@/lib/auth/permissions";
import { findById } from "@/lib/repositories/customer.repository";
import { CustomerForm } from "../../_components/customer-form";
import { notFound } from "next/navigation";

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

  const { admin, isSuper, scopedCommunityIds } = await getAuthenticatedAdmin();

  const hasAccess = await canAccessCustomer(admin, customerId);
  if (!hasAccess) {
    notFound();
  }

  const customer = await findById(customerId);
  if (!customer) {
    notFound();
  }

  const [communities, prefectures, listingCategories, originIndustries, membershipQualifications, affiliations] =
    await Promise.all([
      prisma.community.findMany({ where: { code: { not: "other" } }, orderBy: { sortOrder: "asc" } }),
      prisma.prefecture.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.listingCategory.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.originIndustry.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.membershipQualification.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.affiliation.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

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
    prefectureId: customer.prefectureId,
    city: customer.city,
    gender: customer.gender,
    listingCategoryId: customer.listingCategoryId,
    memberCategory: customer.memberCategory,
    contractType: customer.contractType,
    jobChangeIntent: customer.jobChangeIntent,
    note: customer.note,
    communities: customer.customerCommunities.map((cc) => ({
      communityId: cc.communityId,
      joinedAt: cc.joinedAt?.toISOString() ?? null,
      resignedAt: cc.resignedAt?.toISOString() ?? null,
      auditMemberType: cc.auditMemberType,
      auditMemberPremium: cc.auditMemberPremium,
      affiliationId: cc.affiliationId,
      originIndustryId: cc.originIndustryId,
      membershipQualificationId: cc.membershipQualificationId,
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
