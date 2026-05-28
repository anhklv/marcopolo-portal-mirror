import { getAuthenticatedAdmin, canAccessCustomer } from "@/lib/auth/permissions";
import { findById } from "@/lib/repositories/customer.repository";
import { serializeCustomerForDetail } from "@/lib/serializers/customer";
import { CustomerDetail } from "./_components/customer-detail";
import { notFound } from "next/navigation";

export const metadata = {
  title: "顧客詳細",
};

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

  return <CustomerDetail customer={serializeCustomerForDetail(customer)} />;
}
