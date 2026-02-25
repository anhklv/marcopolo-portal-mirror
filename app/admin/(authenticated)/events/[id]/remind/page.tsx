import { notFound } from "next/navigation";
import { getAuthenticatedAdmin, canAccessEvent } from "@/lib/auth/permissions";
import { findEventByIdForRemind } from "@/lib/repositories/event.repository";
import { serializeEventForRemind } from "@/lib/serializers/event";
import { generateRemindSubject, generateRemindBody } from "@/lib/mail/templates/remind";
import { prisma } from "@/lib/prisma";
import { RemindForm } from "./_components/remind-form";

export default async function EventRemindPage({
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

  const event = await findEventByIdForRemind(eventId);
  if (!event) {
    notFound();
  }

  // pending顧客0名 → notFound
  if (event.rsvps.length === 0) {
    notFound();
  }

  // 管理者メール取得（テスト送信先用）
  const adminRecord = await prisma.admin.findUnique({
    where: { id: admin.id },
    select: { email: true },
  });

  // テンプレート初期値生成
  const serializedEvent = serializeEventForRemind(event);
  const templateParams = {
    eventTitle: event.title,
    eventDate: serializedEvent.date,
    eventLocation: event.location,
    eventDescription: event.description,
    eventTimetable: event.timetable,
    eventNote: event.note,
  };

  return (
    <RemindForm
      event={serializedEvent}
      adminEmail={adminRecord?.email ?? ""}
      defaultEmailTitle={generateRemindSubject(templateParams)}
      defaultEmailBody={generateRemindBody(templateParams)}
    />
  );
}
