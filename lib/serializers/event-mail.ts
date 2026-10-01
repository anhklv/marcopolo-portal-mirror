import type { findEventMailById, findEventMails } from "@/lib/repositories/event-mail.repository";
import type { SerializedEventMail } from "@/lib/types/serialized";

type EventMailRecord = Awaited<ReturnType<typeof findEventMails>>[number];
type EventMailDetailRecord = NonNullable<
  Awaited<ReturnType<typeof findEventMailById>>
>;

export function serializeEventMail(
  mail: EventMailRecord | EventMailDetailRecord
): SerializedEventMail {
  return {
    id: mail.id,
    eventId: mail.eventId,
    templateName: mail.templateNameSnapshot,
    kind: mail.kind,
    state: mail.state,
    subject: mail.subject,
    body: mail.body,
    fromAddress: mail.fromAddress,
    sendStatus: mail.sendStatus,
    targetCount: mail.targetCount,
    successCount: mail.successCount,
    failedCount: mail.failedCount,
    sentAt: mail.sentAt?.toISOString() ?? null,
    createdAt: mail.createdAt.toISOString(),
    sentBy: mail.sentByAdmin,
    deliveries: mail.deliveries.map((delivery) => ({
      id: delivery.id,
      customerId: delivery.customerId,
      lastName: delivery.lastNameSnapshot,
      firstName: delivery.firstNameSnapshot,
      emailAddress: delivery.emailAddress,
      emailType: delivery.emailType,
      subEmailOrder: delivery.subEmailOrder,
      status: delivery.status,
      smtpMessageId: delivery.smtpMessageId,
      errorCode: delivery.errorCode,
      errorMessage: delivery.errorMessage,
      sentAt: delivery.sentAt?.toISOString() ?? null,
    })),
  };
}

export function serializeEventMails(
  mails: EventMailRecord[]
): SerializedEventMail[] {
  return mails.map(serializeEventMail);
}
