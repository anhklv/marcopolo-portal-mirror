import { describe, expect, it } from "vitest";
import {
  getDeliveryFailureReason,
  isFailedDelivery,
  summarizeDeliveries,
} from "@/lib/mail/delivery-status";

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

describe("summarizeDeliveries", () => {
  it("宛先単位の最新状態から集計する", () => {
    expect(
      summarizeDeliveries([
        { status: "success", providerStatus: "delivered" },
        { status: "success", providerStatus: "bounced" },
        { status: "success", providerStatus: "suppressed" },
      ])
    ).toEqual({
      targetCount: 3,
      successCount: 1,
      failedCount: 2,
      sendStatus: "partial_failed",
    });
  });
});

describe("getDeliveryFailureReason", () => {
  it("providerのエラーメッセージを同期エラーより優先する", () => {
    expect(
      getDeliveryFailureReason({
        providerErrorMessage: "smtp; 550-5.1.1 mailbox does not exist",
        errorMessage: "send accepted",
        providerErrorCode: "Permanent",
        errorCode: "SMTP_ERROR",
      })
    ).toBe("smtp; 550-5.1.1 mailbox does not exist");
  });
});
