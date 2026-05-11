import { getAuthenticatedAdmin } from "@/lib/auth/permissions";
import { PasswordChangeForm } from "./_components/password-change-form";

export const metadata = {
  title: "パスワード変更",
};

export default async function PasswordSettingsPage() {
  await getAuthenticatedAdmin();
  return <PasswordChangeForm />;
}
