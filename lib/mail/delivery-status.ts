export type MailProviderDeliveryStatus =
  | "unknown"
  | "sent"
  | "delivered"
  | "delayed"
  | "bounced"
  | "failed"
  | "suppressed"
  | "complained";

const FAILURE_PROVIDER_STATUSES = new Set<MailProviderDeliveryStatus>([
  "bounced",
  "failed",
  "suppressed",
]);

export function isFailureProviderStatus(
  status: MailProviderDeliveryStatus,
): boolean {
  return FAILURE_PROVIDER_STATUSES.has(status);
}

export function isAwaitingResendResult(delivery: {
  provider: "unknown" | "mailpit" | "resend";
  providerStatus: MailProviderDeliveryStatus;
}): boolean {
  return (
    delivery.provider === "resend" &&
    (delivery.providerStatus === "sent" ||
      delivery.providerStatus === "delayed")
  );
}

export function isFailedDelivery(delivery: {
  status: "pending" | "success" | "failed";
  providerStatus: MailProviderDeliveryStatus;
}): boolean {
  return (
    delivery.status === "failed" ||
    isFailureProviderStatus(delivery.providerStatus)
  );
}

type DeliveryStatusInput = Parameters<typeof isFailedDelivery>[0];

export function summarizeDeliveries(deliveries: DeliveryStatusInput[]) {
  const targetCount = deliveries.length;
  const failedCount = deliveries.filter(isFailedDelivery).length;
  const successCount = targetCount - failedCount;
  const sendStatus: "success" | "failed" | "partial_failed" =
    failedCount === 0
      ? "success"
      : successCount === 0
        ? "failed"
        : "partial_failed";

  return { targetCount, successCount, failedCount, sendStatus };
}

export function getDeliveryFailureReason(delivery: {
  providerErrorMessage?: string | null;
  errorMessage?: string | null;
  providerErrorCode?: string | null;
  errorCode?: string | null;
}): string | undefined {
  return (
    delivery.providerErrorMessage ||
    delivery.errorMessage ||
    delivery.providerErrorCode ||
    delivery.errorCode ||
    undefined
  );
}
