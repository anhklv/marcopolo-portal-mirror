import {
  isFailedDelivery,
  type MailProviderDeliveryStatus,
} from "@/lib/mail/delivery-status";

const TERMINAL_PROVIDER_STATUSES = new Set([
  "delivered",
  "bounced",
  "failed",
  "suppressed",
  "complained",
]);

interface NotificationDelivery {
  status: "pending" | "success" | "failed";
  providerStatus: MailProviderDeliveryStatus;
  failureNotifiedAt: Date | null;
}

function isTerminalDelivery(delivery: NotificationDelivery): boolean {
  return (
    delivery.status === "failed" ||
    TERMINAL_PROVIDER_STATUSES.has(delivery.providerStatus)
  );
}

export function getFailureNotificationReadiness(
  deliveries: NotificationDelivery[],
  sentAt: Date,
  now: Date,
  waitMs: number
) {
  const targetCount = deliveries.length;
  const returnedCount = deliveries.filter(isTerminalDelivery).length;
  const totalFailureCount = deliveries.filter(isFailedDelivery).length;
  const successCount = returnedCount - totalFailureCount;
  const pendingCount = targetCount - returnedCount;
  const failureCount = deliveries.filter(
    (delivery) =>
      delivery.failureNotifiedAt === null && isFailedDelivery(delivery)
  ).length;
  const timeoutAt = new Date(sentAt.getTime() + waitMs);
  const allResultsReturned = returnedCount === targetCount;
  const ready = allResultsReturned || timeoutAt <= now;

  return {
    targetCount,
    returnedCount,
    successCount,
    totalFailureCount,
    pendingCount,
    failureCount,
    ready,
    dueAt: ready ? now : timeoutAt,
  };
}

