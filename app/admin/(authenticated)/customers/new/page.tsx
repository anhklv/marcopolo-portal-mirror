import { getAuthenticatedAdmin } from "@/lib/auth/permissions";
import { fetchCustomerFormMasterData } from "@/lib/repositories/master.repository";
import { CustomerForm } from "../_components/customer-form";

export default async function NewCustomerPage() {
  const { isSuper, scopedCommunityIds } = await getAuthenticatedAdmin();
  const masterData = await fetchCustomerFormMasterData();

  return (
    <CustomerForm
      mode="create"
      {...masterData}
      isSuper={isSuper}
      scopedCommunityIds={scopedCommunityIds}
    />
  );
}
