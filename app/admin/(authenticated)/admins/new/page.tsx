import { getAuthenticatedAdmin } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COMMUNITY_CODE } from "@/lib/constants/community";
import { AdminForm } from "../_components/admin-form";

export default async function NewAdminPage() {
  const { isSuper } = await getAuthenticatedAdmin();

  if (!isSuper) {
    redirect("/admin/customers");
  }

  const communities = await prisma.community.findMany({
    where: { code: { not: COMMUNITY_CODE.OTHER } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <AdminForm
      mode="create"
      communities={communities.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
      }))}
    />
  );
}
