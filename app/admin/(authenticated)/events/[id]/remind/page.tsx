import { notFound } from "next/navigation";
import { getAuthenticatedAdmin, canAccessEvent } from "@/lib/auth/permissions";
import { findEventByIdForRemind } from "@/lib/repositories/event.repository";
import { serializeEventForRemind } from "@/lib/serializers/event";
import { generateRemindSubject, generateRemindBody } from "@/lib/mail/templates/remind";
import { getEventDisplayStatus } from "@/lib/utils/event";
import { prisma } from "@/lib/prisma";
import { RemindForm } from "./_components/remind-form";
import { parseRemindTarget } from "@/lib/helpers/remind-target";

export const metadata = {
  title: "リマインドメール送信",
};

export default async function EventRemindPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ target?: string }>;
}) {
  const { id } = await params;
  const { target: rawTarget } = await searchParams;
  const eventId = Number(id);
  const target = parseRemindTarget(rawTarget ?? null);

  if (isNaN(eventId)) {
    notFound();
  }

  const { admin } = await getAuthenticatedAdmin();

  const hasAccess = await canAccessEvent(admin, eventId);
  if (!hasAccess) {
    notFound();
  }

  const event = await findEventByIdForRemind(eventId, target);
  if (!event) {
    notFound();
  }

  if (getEventDisplayStatus(event) !== "receiving") {
    notFound();
  }

  // 管理者メール取得（テスト送信先用）
  const adminRecord = await prisma.admin.findUnique({
    where: { id: admin.id },
    select: { email: true },
  });

  // テンプレート初期値生成
  const serializedEvent = serializeEventForRemind(event, target);
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
