import { describe, expect, it } from "vitest";
import { serializeEventMail } from "@/lib/serializers/event-mail";

describe("serializeEventMail", () => {
  it("保存済み集計ではなくdeliveryの最新状態を一覧集計に使う", () => {
    const mail = {
      id: 10,
      eventId: 16,
      templateNameSnapshot: "案内メール",
      kind: "rsvp",
      state: "sent",
      subject: "ご案内",
      body: "本文",
      fromAddress: "noreply@example.com",
      sendStatus: "partial_failed",
      targetCount: 3,
      successCount: 2,
      failedCount: 1,
      sentAt: new Date("2026-10-07T02:00:00.000Z"),
      createdAt: new Date("2026-10-07T02:00:00.000Z"),
      sentByAdmin: null,
      deliveries: [
        createDelivery(1, "delivered"),
        createDelivery(2, "bounced"),
        createDelivery(3, "suppressed"),
      ],
    } as unknown as Parameters<typeof serializeEventMail>[0];

    const result = serializeEventMail(mail);

    expect(result.targetCount).toBe(3);
    expect(result.successCount).toBe(1);
    expect(result.failedCount).toBe(2);
    expect(result.sendStatus).toBe("partial_failed");
  });
});

function createDelivery(
  id: number,
  providerStatus: "delivered" | "bounced" | "suppressed",
) {
  return {
    id,
    customerId: id,
    lastNameSnapshot: "姓",
    firstNameSnapshot: "名",
    emailAddress: `test${id}@example.com`,
    emailType: "main",
    subEmailOrder: null,
    status: "success",
    provider: "resend",
    providerStatus,
    smtpMessageId: null,
    providerEmailId: `provider-${id}`,
    providerErrorCode: null,
    providerErrorMessage: null,
    errorCode: null,
    errorMessage: null,
    sentAt: new Date("2026-10-07T02:00:00.000Z"),
  };
}
