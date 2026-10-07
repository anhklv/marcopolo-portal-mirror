import { describe, expect, it } from "vitest";
import { isFailedDelivery } from "@/lib/mail/delivery-status";

describe("isFailedDelivery", () => {
  it.each(["bounced", "failed", "suppressed"] as const)(
    "%s は失敗として扱う",
    (providerStatus) => {
      expect(isFailedDelivery({ status: "success", providerStatus })).toBe(true);
    }
  );

  it.each(["sent", "delivered", "delayed", "complained"] as const)(
    "%s はWebhook由来の失敗として扱わない",
    (providerStatus) => {
      expect(isFailedDelivery({ status: "success", providerStatus })).toBe(false);
    }
  );

  it("同期送信失敗はprovider statusに関係なく失敗として扱う", () => {
    expect(isFailedDelivery({ status: "failed", providerStatus: "unknown" })).toBe(
      true
    );
  });
});
