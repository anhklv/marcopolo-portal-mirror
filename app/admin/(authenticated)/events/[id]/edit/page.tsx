import { getAuthenticatedAdmin, canAccessEvent } from "@/lib/auth/permissions";
import { findEventById } from "@/lib/repositories/event.repository";
import { fetchEventFormMasterData } from "@/lib/repositories/master.repository";
import { dateToEventFormIsoWithOffset } from "@/lib/utils/event";
import { EventForm } from "../../_components/event-form";
import { notFound } from "next/navigation";

export const metadata = {
  title: "イベント編集",
};

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = Number(id);

  if (isNaN(eventId)) {
    notFound();
  }

  const { admin, isSuper, scopedCommunityIds } = await getAuthenticatedAdmin();

  const hasAccess = await canAccessEvent(admin, eventId);
  if (!hasAccess) {
    notFound();
  }

  const event = await findEventById(eventId);
  if (!event) {
    notFound();
  }

  const { communities } = await fetchEventFormMasterData();

  // Date を業務 TZ（東京）でシリアライズして initialData を構築（+09:00 付き）
  const initialData = {
    id: event.id,
    communityId: event.communityId,
    title: event.title,
    date: dateToEventFormIsoWithOffset(event.date),
    location: event.location,
    description: event.description,
    timetable: event.timetable,
    note: event.note,
    responseDeadline: event.responseDeadline
      ? dateToEventFormIsoWithOffset(event.responseDeadline)
      : null,
    allowsOnline: event.allowsOnline,
    hasAfterParty: event.hasAfterParty,
  };

  return (
    <EventForm
      mode="edit"
      initialData={initialData}
      communities={communities}
      isSuper={isSuper}
      scopedCommunityIds={scopedCommunityIds}
    />
  );
}
