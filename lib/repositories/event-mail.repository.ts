import { prisma } from "@/lib/prisma";
import type { MailDeliveryResult } from "@/lib/mail/send";

export type EventMailKindValue = "rsvp" | "survey" | "notice";

interface CreateEventMailHistoryInput {
  eventId: number;
  templateName?: string;
  kind: EventMailKindValue;
  subject: string;
  body: string;
  fromAddress: string;
  adminId: number;
  deliveries: MailDeliveryResult[];
}

export async function createEventMailHistory(
  input: CreateEventMailHistoryInput
) {
  const successCount = input.deliveries.filter((delivery) => delivery.success).length;
  const failedCount = input.deliveries.length - successCount;
  const sendStatus =
    failedCount === 0
      ? "success"
      : successCount === 0
        ? "failed"
        : "partial_failed";
  const sentAt = new Date();

  return prisma.eventMail.create({
    data: {
      eventId: input.eventId,
      templateNameSnapshot: input.templateName,
      kind: input.kind,
      state: "sent",
      subject: input.subject,
      body: input.body,
      fromAddress: input.fromAddress,
      createdByAdminId: input.adminId,
      sentByAdminId: input.adminId,
      sendStatus,
      targetCount: input.deliveries.length,
      successCount,
      failedCount,
      sentAt,
      deliveries: {
        create: input.deliveries.map((delivery) => ({
          customerId: delivery.customerId,
          lastNameSnapshot: delivery.lastName,
          firstNameSnapshot: delivery.firstName,
          emailAddress: delivery.email,
          emailType: delivery.emailType,
          subEmailOrder: delivery.subEmailOrder,
          status: delivery.success ? "success" : "failed",
          smtpMessageId: delivery.messageId,
          errorCode: delivery.errorCode,
          errorMessage: delivery.errorMessage,
          sentAt,
        })),
      },
    },
  });
}

export async function findEventMails(eventId: number) {
  return prisma.eventMail.findMany({
    where: { eventId },
    include: {
      deliveries: { orderBy: { id: "asc" } },
      sentByAdmin: {
        select: { id: true, lastName: true, firstName: true },
      },
    },
    orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function findEventMailById(eventId: number, mailId: number) {
  return prisma.eventMail.findFirst({
    where: { id: mailId, eventId },
    include: {
      deliveries: { orderBy: { id: "asc" } },
      sentByAdmin: {
        select: { id: true, lastName: true, firstName: true },
      },
    },
  });
}
