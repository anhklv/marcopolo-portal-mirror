import type { Prisma, EventMailProviderStatus } from "@/lib/generated/prisma";
import type { WebhookEventPayload } from "resend";
import { prisma } from "@/lib/prisma";
import {
  isFailureProviderStatus,
  summarizeDeliveries,
} from "@/lib/mail/delivery-status";
import { scheduleFailureNotification } from "@/lib/mail/failure-notification";

const TRACKED_EVENT_TYPES = new Set([
  "email.sent",
  "email.delivered",
  "email.delivery_delayed",
  "email.bounced",
  "email.failed",
  "email.suppressed",
  "email.complained",
]);

type EmailWebhookEvent = Extract<
  WebhookEventPayload,
  { type: `email.${string}` }
>;

export interface ProcessResendWebhookResult {
  duplicate: boolean;
  matched: boolean;
  eventId?: number;
}

function messageIdCandidates(messageId: string | undefined): string[] {
  if (!messageId) return [];
  const trimmed = messageId.trim();
  const unwrapped = trimmed.replace(/^<|>$/g, "");
  return Array.from(new Set([trimmed, unwrapped, `<${unwrapped}>`]));
}

function toProviderStatus(type: string): EventMailProviderStatus | null {
  switch (type) {
    case "email.sent":
      return "sent";
    case "email.delivered":
      return "delivered";
    case "email.delivery_delayed":
      return "delayed";
    case "email.bounced":
      return "bounced";
    case "email.failed":
      return "failed";
    case "email.suppressed":
      return "suppressed";
    case "email.complained":
      return "complained";
    default:
      return null;
  }
}

function failureDetails(event: EmailWebhookEvent): {
  code?: string;
  message?: string;
  bounceType?: string;
  bounceSubType?: string;
} {
  if (event.type === "email.bounced") {
    const bounce = event.data.bounce as typeof event.data.bounce & {
      diagnosticCode?: string | string[];
    };
    const diagnosticMessage = Array.isArray(bounce.diagnosticCode)
      ? bounce.diagnosticCode.join("\n")
      : bounce.diagnosticCode;
    return {
      code: bounce.type,
      message: diagnosticMessage || bounce.message,
      bounceType: bounce.type,
      bounceSubType: bounce.subType,
    };
  }
  if (event.type === "email.failed") {
    return { code: "EMAIL_FAILED", message: event.data.failed.reason };
  }
  if (event.type === "email.suppressed") {
    return {
      code: event.data.suppressed.type,
      message: event.data.suppressed.message,
    };
  }
  return {};
}

async function refreshEventMailSummary(
  tx: Prisma.TransactionClient,
  eventMailId: number
) {
  const deliveries = await tx.eventMailDelivery.findMany({
    where: { eventMailId },
    select: { status: true, providerStatus: true },
  });
  const summary = summarizeDeliveries(deliveries);

  return tx.eventMail.update({
    where: { id: eventMailId },
    data: summary,
    select: { eventId: true },
  });
}

async function processStoredWebhookEvent(
  webhookEventId: number
): Promise<{ matched: boolean; eventId?: number }> {
  const stored = await prisma.mailProviderWebhookEvent.findUnique({
    where: { id: webhookEventId },
  });
  if (!stored) return { matched: false };

  const event = stored.payload as unknown as WebhookEventPayload;
  if (!event.type.startsWith("email.") || !TRACKED_EVENT_TYPES.has(event.type)) {
    await prisma.mailProviderWebhookEvent.update({
      where: { id: stored.id },
      data: {
        processStatus: "processed",
        processAttempts: { increment: 1 },
        processError: null,
        processedAt: new Date(),
      },
    });
    return { matched: false };
  }

  const emailEvent = event as EmailWebhookEvent;
  const tags = "tags" in emailEvent.data ? emailEvent.data.tags : undefined;
  if (tags?.category === "community_notification") {
    await prisma.mailProviderWebhookEvent.update({
      where: { id: stored.id },
      data: {
        processStatus: "processed",
        processAttempts: { increment: 1 },
        processError: null,
        processedAt: new Date(),
      },
    });
    return { matched: true };
  }

  const providerStatus = toProviderStatus(emailEvent.type);
  if (!providerStatus) return { matched: false };

  const candidates = messageIdCandidates(emailEvent.data.message_id);
  const delivery = await prisma.eventMailDelivery.findFirst({
    where: {
      provider: "resend",
      OR: [
        { providerEmailId: emailEvent.data.email_id },
        ...(candidates.length > 0
          ? [{ smtpMessageId: { in: candidates } }]
          : []),
      ],
    },
    select: {
      id: true,
      eventMailId: true,
      providerEventAt: true,
      providerStatus: true,
    },
  });

  if (!delivery) {
    await prisma.mailProviderWebhookEvent.update({
      where: { id: stored.id },
      data: {
        processStatus: "unmatched",
        processAttempts: { increment: 1 },
        processError: "対応する送信履歴がまだ見つかりません",
      },
    });
    return { matched: false };
  }

  const eventAt = new Date(emailEvent.created_at);
  const validEventAt = Number.isNaN(eventAt.getTime()) ? new Date() : eventAt;
  const details = failureDetails(emailEvent);

  return prisma.$transaction(async (tx) => {
    // 同じメール送信に対する複数Webhookの集計競合を防止する。
    await tx.$queryRaw`
      SELECT "id"
      FROM "event_mails"
      WHERE "id" = ${delivery.eventMailId}
      FOR UPDATE
    `;

    // ロック待機中に別Webhookが更新した可能性があるため、最新状態を再取得する。
    const currentDelivery = await tx.eventMailDelivery.findUniqueOrThrow({
      where: { id: delivery.id },
      select: { providerEventAt: true, providerStatus: true },
    });
    const isOlderEvent =
      currentDelivery.providerEventAt !== null &&
      validEventAt.getTime() < currentDelivery.providerEventAt.getTime();
    const wouldDowngradeFinalFailure =
      isFailureProviderStatus(currentDelivery.providerStatus) &&
      !isFailureProviderStatus(providerStatus);
    const shouldUpdateOutcome = !isOlderEvent && !wouldDowngradeFinalFailure;

    await tx.eventMailDelivery.update({
      where: { id: delivery.id },
      data: {
        providerEmailId: emailEvent.data.email_id,
        ...(shouldUpdateOutcome
          ? {
              providerStatus,
              providerEventAt: validEventAt,
              deliveredAt:
                emailEvent.type === "email.delivered" ? validEventAt : undefined,
              bouncedAt:
                emailEvent.type === "email.bounced" ? validEventAt : undefined,
              bounceType: details.bounceType,
              bounceSubType: details.bounceSubType,
              providerErrorCode: details.code,
              providerErrorMessage: details.message,
            }
          : {}),
      },
    });

    const mail = await refreshEventMailSummary(tx, delivery.eventMailId);
    await scheduleFailureNotification(delivery.eventMailId, tx, validEventAt);
    await tx.mailProviderWebhookEvent.update({
      where: { id: stored.id },
      data: {
        processStatus: "processed",
        processAttempts: { increment: 1 },
        processError: null,
        processedAt: new Date(),
      },
    });

    return { matched: true, eventId: mail.eventId };
  });
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function processResendWebhook(
  providerEventId: string,
  event: WebhookEventPayload
): Promise<ProcessResendWebhookResult> {
  const emailData = event.type.startsWith("email.")
    ? (event as EmailWebhookEvent).data
    : null;
  let storedId: number;
  let duplicate = false;

  try {
    const stored = await prisma.mailProviderWebhookEvent.create({
      data: {
        provider: "resend",
        providerEventId,
        eventType: event.type,
        providerEmailId: emailData?.email_id,
        smtpMessageId: emailData?.message_id,
        recipient: emailData?.to[0],
        payload: JSON.parse(JSON.stringify(event)) as Prisma.InputJsonValue,
      },
      select: { id: true },
    });
    storedId = stored.id;
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    duplicate = true;
    const stored = await prisma.mailProviderWebhookEvent.findUniqueOrThrow({
      where: {
        provider_providerEventId: { provider: "resend", providerEventId },
      },
      select: { id: true, processStatus: true },
    });
    if (stored.processStatus === "processed") {
      return { duplicate: true, matched: true };
    }
    storedId = stored.id;
  }

  try {
    const result = await processStoredWebhookEvent(storedId);
    return { duplicate, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.mailProviderWebhookEvent.update({
      where: { id: storedId },
      data: {
        processStatus: "failed",
        processAttempts: { increment: 1 },
        processError: message,
      },
    });
    throw error;
  }
}

/**
 * SMTP送信完了直後より先にWebhookが届いた場合の競合を解消する。
 */
export async function reconcileUnmatchedResendWebhooks(
  identifiers: {
    providerEmailIds: string[];
    smtpMessageIds: string[];
  }
): Promise<void> {
  const providerEmailIds = Array.from(new Set(identifiers.providerEmailIds));
  const candidates = Array.from(
    new Set(
      identifiers.smtpMessageIds.flatMap((messageId) =>
        messageIdCandidates(messageId)
      )
    )
  );
  if (providerEmailIds.length === 0 && candidates.length === 0) return;

  const events = await prisma.mailProviderWebhookEvent.findMany({
    where: {
      provider: "resend",
      processStatus: "unmatched",
      OR: [
        ...(providerEmailIds.length > 0
          ? [{ providerEmailId: { in: providerEmailIds } }]
          : []),
        ...(candidates.length > 0
          ? [{ smtpMessageId: { in: candidates } }]
          : []),
      ],
    },
    select: { id: true },
  });

  for (const event of events) {
    await processStoredWebhookEvent(event.id);
  }
}

