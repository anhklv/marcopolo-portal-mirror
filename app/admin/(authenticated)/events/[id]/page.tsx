import { getAuthenticatedAdmin, canAccessEvent } from "@/lib/auth/permissions";
import { findEventByIdForDetail } from "@/lib/repositories/event.repository";
import { serializeEventForDetail } from "@/lib/serializers/event";
import { EventDetail } from "./_components/event-detail";
import { notFound } from "next/navigation";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = Number(id);

  if (isNaN(eventId)) {
    notFound();
  }

  const { admin } = await getAuthenticatedAdmin();

  const hasAccess = await canAccessEvent(admin, eventId);
  if (!hasAccess) {
    notFound();
  }

  const event = await findEventByIdForDetail(eventId);
  if (!event) {
    notFound();
  }

  return <EventDetail event={serializeEventForDetail(event)} />;
}
