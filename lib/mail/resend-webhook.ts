import type { Prisma, EventMailProviderStatus } from "@/lib/generated/prisma";
import type { WebhookEventPayload } from "resend";
import { prisma } from "@/lib/prisma";
import {
  isFailedDelivery,
  isFailureProviderStatus,
} from "@/lib/mail/delivery-status";

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
    return {
      code: event.data.bounce.type,
      message: event.data.bounce.message,
      bounceType: event.data.bounce.type,
      bounceSubType: event.data.bounce.subType,
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
  const failedCount = deliveries.filter(isFailedDelivery).length;
  const targetCount = deliveries.length;
  const successCount = targetCount - failedCount;
  const sendStatus =
    failedCount === 0
      ? "success"
      : successCount === 0
        ? "failed"
        : "partial_failed";

  return tx.eventMail.update({
    where: { id: eventMailId },
    data: { targetCount, successCount, failedCount, sendStatus },
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
    const isOlderEvent =
      delivery.providerEventAt !== null &&
      validEventAt.getTime() < delivery.providerEventAt.getTime();
    const wouldDowngradeFinalFailure =
      isFailureProviderStatus(delivery.providerStatus) &&
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
  smtpMessageIds: string[]
): Promise<void> {
  const candidates = Array.from(
    new Set(smtpMessageIds.flatMap((messageId) => messageIdCandidates(messageId)))
  );
  if (candidates.length === 0) return;

  const events = await prisma.mailProviderWebhookEvent.findMany({
    where: {
      provider: "resend",
      processStatus: "unmatched",
      smtpMessageId: { in: candidates },
    },
    select: { id: true },
  });

  for (const event of events) {
    await processStoredWebhookEvent(event.id);
  }
}

