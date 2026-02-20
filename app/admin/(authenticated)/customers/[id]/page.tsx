import { getAuthenticatedAdmin, canAccessCustomer } from "@/lib/auth/permissions";
import { findById } from "@/lib/repositories/customer.repository";
import { CustomerDetail } from "./_components/customer-detail";
import { notFound } from "next/navigation";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customerId = Number(id);

  if (isNaN(customerId)) {
    notFound();
  }

  const { admin } = await getAuthenticatedAdmin();

  const hasAccess = await canAccessCustomer(admin, customerId);
  if (!hasAccess) {
    notFound();
  }

  const customer = await findById(customerId);
  if (!customer) {
    notFound();
  }

  // Date をシリアライズ
  const serializedCustomer = {
    ...customer,
    registeredAt: customer.registeredAt.toISOString(),
    deletedAt: customer.deletedAt?.toISOString() ?? null,
    prefecture: customer.prefecture ? {
      id: customer.prefecture.id,
      name: customer.prefecture.name,
    } : null,
    listingCategory: customer.listingCategory ? {
      id: customer.listingCategory.id,
      name: customer.listingCategory.stockExchangeName
        ? `${customer.listingCategory.stockExchangeName} ${customer.listingCategory.marketName}`
        : customer.listingCategory.marketName,
    } : null,
    customerCommunities: customer.customerCommunities.map((cc) => ({
      ...cc,
      joinedAt: cc.joinedAt?.toISOString() ?? null,
      resignedAt: cc.resignedAt?.toISOString() ?? null,
      createdAt: cc.createdAt.toISOString(),
      updatedAt: cc.updatedAt.toISOString(),
      community: {
        ...cc.community,
        createdAt: cc.community.createdAt.toISOString(),
        updatedAt: cc.community.updatedAt.toISOString(),
      },
      affiliation: cc.affiliation ? {
        id: cc.affiliation.id,
        name: cc.affiliation.name,
      } : null,
      originIndustry: cc.originIndustry ? {
        id: cc.originIndustry.id,
        name: cc.originIndustry.name,
      } : null,
      membershipQualification: cc.membershipQualification ? {
        id: cc.membershipQualification.id,
        name: cc.membershipQualification.name,
      } : null,
    })),
    rsvps: customer.rsvps.map((r) => ({
      ...r,
      respondedAt: r.respondedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      event: {
        ...r.event,
        date: r.event.date.toISOString(),
        responseDeadline: r.event.responseDeadline?.toISOString() ?? null,
        createdAt: r.event.createdAt.toISOString(),
        updatedAt: r.event.updatedAt.toISOString(),
        deletedAt: r.event.deletedAt?.toISOString() ?? null,
      },
    })),
  };

  return <CustomerDetail customer={serializedCustomer as any} />;
}
