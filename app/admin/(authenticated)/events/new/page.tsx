import { getAuthenticatedAdmin } from "@/lib/auth/permissions";
import { fetchEventFormMasterData } from "@/lib/repositories/master.repository";
import { EventForm } from "../_components/event-form";

export const metadata = {
  title: "イベント登録",
};

export default async function NewEventPage() {
  const { isSuper, scopedCommunityIds } = await getAuthenticatedAdmin();
  const { communities } = await fetchEventFormMasterData();

  return (
    <EventForm
      mode="create"
      communities={communities}
      isSuper={isSuper}
      scopedCommunityIds={scopedCommunityIds}
    />
  );
}
