import { notFound } from "next/navigation";
import { canAccessEvent, getAuthenticatedAdmin } from "@/lib/auth/permissions";
import { findEventMailById } from "@/lib/repositories/event-mail.repository";
import { serializeEventMail } from "@/lib/serializers/event-mail";
import { MailDraftEditForm } from "./_components/mail-draft-edit-form";

export const metadata = { title: "メール送信の編集" };

export default async function MailDraftEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ draftId?: string }>;
}) {
  const { admin } = await getAuthenticatedAdmin();
  const { id } = await params;
  const { draftId } = await searchParams;
  const eventId = Number(id);
  const mailId = Number(draftId);

  if (Number.isNaN(eventId) || !draftId || Number.isNaN(mailId)) notFound();
  if (!(await canAccessEvent(admin, eventId))) notFound();

  const record = await findEventMailById(eventId, mailId);
  if (!record || record.state !== "draft") notFound();

  return <MailDraftEditForm mail={serializeEventMail(record)} />;
}
