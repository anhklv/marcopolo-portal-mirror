import type { findEventMailById, findEventMails } from "@/lib/repositories/event-mail.repository";
import type { SerializedEventMail } from "@/lib/types/serialized";
import { summarizeDeliveries } from "@/lib/mail/delivery-status";

type EventMailRecord = Awaited<ReturnType<typeof findEventMails>>[number];
type EventMailDetailRecord = NonNullable<
  Awaited<ReturnType<typeof findEventMailById>>
>;

export function serializeEventMail(
  mail: EventMailRecord | EventMailDetailRecord
): SerializedEventMail {
  // deliveryを持つ送信済みメールは明細を正として集計し、過去の競合で
  // event_mailsの集計値がずれていても一覧とモーダルを一致させる。
  const summary =
    mail.state === "sent" && mail.deliveries.length > 0
      ? summarizeDeliveries(mail.deliveries)
      : {
          targetCount: mail.targetCount,
          successCount: mail.successCount,
          failedCount: mail.failedCount,
          sendStatus: mail.sendStatus,
        };

  return {
    id: mail.id,
    eventId: mail.eventId,
    templateName: mail.templateNameSnapshot,
    kind: mail.kind,
    state: mail.state,
    subject: mail.subject,
    body: mail.body,
    fromAddress: mail.fromAddress,
    sendStatus: summary.sendStatus,
    targetCount: summary.targetCount,
    successCount: summary.successCount,
    failedCount: summary.failedCount,
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
      provider: delivery.provider,
      providerStatus: delivery.providerStatus,
      smtpMessageId: delivery.smtpMessageId,
      providerEmailId: delivery.providerEmailId,
      providerErrorCode: delivery.providerErrorCode,
      providerErrorMessage: delivery.providerErrorMessage,
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
