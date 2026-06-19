import { Suspense } from "react";
import { getAuthenticatedAdmin } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { findAll } from "@/lib/repositories/admin.repository";
import { serializeAdminForList } from "@/lib/serializers/admin";
import { AdminList } from "./_components/admin-list";

export const metadata = {
  title: "管理者管理",
};

export default async function AdminsPage() {
  const { isSuper } = await getAuthenticatedAdmin();

  if (!isSuper) {
    redirect("/admin/customers");
  }

  const admins = await findAll();

  return (
    <Suspense fallback={null}>
      <AdminList initialAdmins={admins.map(serializeAdminForList)} />
    </Suspense>
  );
}
