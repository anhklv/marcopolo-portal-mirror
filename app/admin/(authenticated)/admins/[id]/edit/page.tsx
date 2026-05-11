import { getAuthenticatedAdmin } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COMMUNITY_CODE } from "@/lib/constants/community";
import { findById } from "@/lib/repositories/admin.repository";
import { AdminForm } from "../../_components/admin-form";

export default async function EditAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adminId = Number(id);
  if (isNaN(adminId)) notFound();

  const { isSuper } = await getAuthenticatedAdmin();

  if (!isSuper) {
    redirect("/admin/customers");
  }

  const admin = await findById(adminId);
  if (!admin) notFound();

  const communities = await prisma.community.findMany({
    where: { code: { not: COMMUNITY_CODE.OTHER } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <AdminForm
      mode="edit"
      initialData={{
        id: admin.id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
        communityIds: admin.adminCommunities.map((ac) => ac.communityId),
      }}
      communities={communities.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
      }))}
    />
  );
}
