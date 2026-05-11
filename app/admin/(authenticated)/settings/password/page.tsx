import { getAuthenticatedAdmin } from "@/lib/auth/permissions";
import { PasswordChangeForm } from "./_components/password-change-form";

export default async function PasswordSettingsPage() {
  await getAuthenticatedAdmin();
  return <PasswordChangeForm />;
}
