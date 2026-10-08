import type { Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import {
  getDeliveryFailureReason,
  isFailedDelivery,
} from "@/lib/mail/delivery-status";
import { getFailureNotificationReadiness } from "@/lib/mail/failure-notification-readiness";
import { getCommunityNotificationRecipients } from "@/lib/mail/community-notification";
import { sendMail } from "@/lib/mail/send";
import {
  generateFailureNotificationBody,
  generateFailureNotificationSubject,
} from "@/lib/mail/templates/failure-notification";
import { logServerError } from "@/lib/utils/log-error";

const DEFAULT_WAIT_SECONDS = 180;
const MAX_ATTEMPTS = 5;
const PROCESSING_LEASE_MS = 10 * 60 * 1000;

type DbClient = Prisma.TransactionClient | typeof prisma;

function notificationEnabled(): boolean {
  return process.env.COMMUNITY_NOTIFICATION_ENABLED === "true";
}

function notificationEnvironment(): string {
  return (process.env.APP_ENV ?? process.env.VERCEL_ENV ?? "local")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .slice(0, 40);
}

function waitMilliseconds(): number {
  const configured = Number.parseInt(
    process.env.MAIL_FAILURE_NOTIFICATION_WAIT_SECONDS ?? "",
    10
  );
  const seconds =
    Number.isFinite(configured) && configured >= 0
      ? configured
      : DEFAULT_WAIT_SECONDS;
  return seconds * 1000;
}

/**
 * Schedule one aggregated notification for every currently unnotified failure.
 * The notification becomes due immediately when every delivery has a terminal
 * provider result, otherwise no later than three minutes after the send.
 */
export async function scheduleFailureNotification(
  eventMailId: number,
  db: DbClient = prisma,
  now = new Date()
): Promise<void> {
  if (!notificationEnabled()) return;

  const mail = await db.eventMail.findUnique({
    where: { id: eventMailId },
    select: {
      sentAt: true,
      failureNotificationStatus: true,
      failureNotificationDueAt: true,
      failureNotificationVersion: true,
      deliveries: {
        select: {
          status: true,
          providerStatus: true,
          failureNotifiedAt: true,
        },
      },
    },
  });
  if (!mail?.sentAt) return;

  const readiness = getFailureNotificationReadiness(
    mail.deliveries,
    mail.sentAt,
    now,
    waitMilliseconds()
  );
  if (readiness.failureCount === 0) return;

  // A running worker owns this batch. It will schedule another batch after it
  // finishes if a new failure arrived while the email was being sent.
  if (mail.failureNotificationStatus === "processing") return;

  const calculatedDueAt = readiness.dueAt;

  if (mail.failureNotificationStatus === "pending") {
    const dueAt =
      mail.failureNotificationDueAt &&
      mail.failureNotificationDueAt < calculatedDueAt
        ? mail.failureNotificationDueAt
        : calculatedDueAt;
    await db.eventMail.update({
      where: { id: eventMailId },
      data: { failureNotificationDueAt: dueAt },
    });
    return;
  }

  await db.eventMail.update({
    where: { id: eventMailId },
    data: {
      failureNotificationStatus: "pending",
      failureNotificationDueAt: calculatedDueAt,
      failureNotificationClaimedAt: null,
      failureNotificationVersion: {
        increment: 1,
      },
      failureNotificationAttempts: 0,
      failureNotificationError: null,
    },
  });
}

async function markAttemptFailed(
  eventMailId: number,
  attempts: number,
  error: string,
  now: Date
): Promise<void> {
  const exhausted = attempts >= MAX_ATTEMPTS;
  const retryDelaySeconds = Math.min(60 * 2 ** Math.max(0, attempts - 1), 900);

  await prisma.eventMail.update({
    where: { id: eventMailId },
    data: {
      failureNotificationStatus: exhausted ? "failed" : "pending",
      failureNotificationDueAt: exhausted
        ? null
        : new Date(now.getTime() + retryDelaySeconds * 1000),
      failureNotificationClaimedAt: null,
      failureNotificationError: error,
    },
  });
}

async function processOneNotification(
  eventMailId: number,
  now: Date
): Promise<"sent" | "skipped" | "failed"> {
  const claimed = await prisma.eventMail.updateMany({
    where: {
      id: eventMailId,
      failureNotificationStatus: "pending",
      failureNotificationDueAt: { lte: now },
    },
    data: {
      failureNotificationStatus: "processing",
      failureNotificationClaimedAt: now,
      failureNotificationAttempts: { increment: 1 },
    },
  });
  if (claimed.count === 0) return "skipped";

  const mail = await prisma.eventMail.findUniqueOrThrow({
    where: { id: eventMailId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          community: { select: { code: true, name: true } },
        },
      },
      deliveries: {
        orderBy: { id: "asc" },
      },
    },
  });

  const failures = mail.deliveries.filter(
    (delivery) =>
      delivery.failureNotifiedAt === null && isFailedDelivery(delivery)
  );
  if (failures.length === 0) {
    await prisma.eventMail.update({
      where: { id: mail.id },
      data: {
        failureNotificationStatus: "sent",
        failureNotificationDueAt: null,
        failureNotificationClaimedAt: null,
        failureNotificationError: null,
      },
    });
    return "skipped";
  }

  const recipients = getCommunityNotificationRecipients(
    mail.event.community.code
  );
  const attempts = mail.failureNotificationAttempts;
  if (recipients.length === 0) {
    await markAttemptFailed(
      mail.id,
      attempts,
      `通知先が設定されていません: community=${mail.event.community.code}`,
      now
    );
    return "failed";
  }

  const baseUrl = process.env.APP_BASE_URL?.replace(/\/$/, "");
  const readiness = getFailureNotificationReadiness(
    mail.deliveries,
    mail.sentAt ?? mail.createdAt,
    now,
    waitMilliseconds()
  );
  const templateParams = {
    communityName: mail.event.community.name,
    eventTitle: mail.event.title,
    mailSubject: mail.subject,
    sentAt: mail.sentAt ?? mail.createdAt,
    targetCount: mail.targetCount,
    returnedCount: readiness.returnedCount,
    successCount: readiness.successCount,
    failedCount: readiness.totalFailureCount,
    pendingCount: readiness.pendingCount,
    failures: failures.map((delivery) => ({
      customerName: `${delivery.lastNameSnapshot} ${delivery.firstNameSnapshot}`,
      emailAddress: delivery.emailAddress,
      emailType: delivery.emailType,
      subEmailOrder: delivery.subEmailOrder,
      reason:
        getDeliveryFailureReason(delivery) ?? "メール送信に失敗しました",
    })),
    detailUrl: baseUrl
      ? `${baseUrl}/admin/events/${mail.event.id}/mails/${mail.id}`
      : undefined,
    isAdditional: mail.failureNotificationSentAt !== null,
  } as const;

  try {
    const result = await sendMail({
      from: process.env.SMTP_FROM ?? "noreply@marcopolo-portal.jp",
      to: recipients,
      subject: generateFailureNotificationSubject(templateParams),
      text: generateFailureNotificationBody(templateParams),
      tags: [
        { name: "category", value: "community_notification" },
        { name: "notification_type", value: "event_mail_failure" },
        { name: "environment", value: notificationEnvironment() },
      ],
      idempotencyKey: `event-mail-failure-${notificationEnvironment()}-${mail.id}-${mail.failureNotificationVersion}`,
    });

    if (!result.success) {
      await markAttemptFailed(
        mail.id,
        attempts,
        result.error ?? result.errorCode ?? "通知メールの送信に失敗しました",
        now
      );
      return "failed";
    }

    const deliveryIds = failures.map((delivery) => delivery.id);
    await prisma.$transaction([
      prisma.eventMailDelivery.updateMany({
        where: { id: { in: deliveryIds }, failureNotifiedAt: null },
        data: { failureNotifiedAt: now },
      }),
      prisma.eventMail.update({
        where: { id: mail.id },
        data: {
          failureNotificationStatus: "sent",
          failureNotificationDueAt: null,
          failureNotificationClaimedAt: null,
          failureNotificationSentAt: now,
          failureNotificationError: null,
        },
      }),
    ]);

    // A late bounce may have arrived after this worker loaded its batch.
    await scheduleFailureNotification(mail.id, prisma, now);
    return "sent";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logServerError(`processFailureNotification eventMailId=${mail.id}`, error);
    await markAttemptFailed(mail.id, attempts, message, now);
    return "failed";
  }
}

export interface ProcessFailureNotificationsResult {
  checked: number;
  sent: number;
  failed: number;
  skipped: number;
}

export async function processDueFailureNotifications(
  now = new Date(),
  limit = 20
): Promise<ProcessFailureNotificationsResult> {
  if (!notificationEnabled()) {
    return { checked: 0, sent: 0, failed: 0, skipped: 0 };
  }

  // Recover a job if a previous serverless invocation stopped after claiming it.
  await prisma.eventMail.updateMany({
    where: {
      failureNotificationStatus: "processing",
      failureNotificationClaimedAt: {
        lt: new Date(now.getTime() - PROCESSING_LEASE_MS),
      },
    },
    data: {
      failureNotificationStatus: "pending",
      failureNotificationDueAt: now,
      failureNotificationClaimedAt: null,
    },
  });

  const candidates = await prisma.eventMail.findMany({
    where: {
      failureNotificationStatus: "pending",
      failureNotificationDueAt: { lte: now },
    },
    select: { id: true },
    orderBy: { failureNotificationDueAt: "asc" },
    take: limit,
  });

  const result: ProcessFailureNotificationsResult = {
    checked: candidates.length,
    sent: 0,
    failed: 0,
    skipped: 0,
  };
  for (const candidate of candidates) {
    const status = await processOneNotification(candidate.id, now);
    result[status]++;
  }
  return result;
}

