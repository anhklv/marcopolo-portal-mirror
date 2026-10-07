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
  status: MailProviderDeliveryStatus
): boolean {
  return FAILURE_PROVIDER_STATUSES.has(status);
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
