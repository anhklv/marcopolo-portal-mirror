import { getAuthenticatedAdmin, canAccessEvent } from "@/lib/auth/permissions";
import { findEventById } from "@/lib/repositories/event.repository";
import { fetchEventFormMasterData } from "@/lib/repositories/master.repository";
import { EventForm } from "../../_components/event-form";
import { notFound } from "next/navigation";

/**
 * Date → ローカルタイムゾーンのISO風文字列（YYYY-MM-DDTHH:mm:ss）
 * toISOString() はUTC表記を返すため、サーバーのタイムゾーンで日時がずれる。
 * ローカルのgetterを使うことで、作成時と同じ解釈で日時を復元する。
 */
function toLocalDateTimeString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}:${s}`;
}

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

  // Date をローカルタイムゾーンでシリアライズして initialData を構築
  const initialData = {
    id: event.id,
    communityId: event.communityId,
    title: event.title,
    date: toLocalDateTimeString(event.date),
    location: event.location,
    description: event.description,
    timetable: event.timetable,
    note: event.note,
    responseDeadline: event.responseDeadline
      ? toLocalDateTimeString(event.responseDeadline)
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
