import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, sendMailMock } = vi.hoisted(() => ({
  sendMailMock: vi.fn(),
  prismaMock: {
    eventMail: {
      updateMany: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    eventMailDelivery: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/mail/send", () => ({ sendMail: sendMailMock }));

import { processDueFailureNotifications } from "@/lib/mail/failure-notification";

describe("processDueFailureNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.COMMUNITY_NOTIFICATION_ENABLED = "true";
    process.env.APP_ENV = "develop";
    process.env.COMMUNITY_NOTIFICATION_TO_NAIKAN_MEETUP =
      "first@example.com,second@example.com";
    process.env.SMTP_FROM = "noreply@marcopolo-portal.jp";
    process.env.APP_BASE_URL = "https://portal.example.com";

    prismaMock.eventMail.updateMany
      .mockResolvedValueOnce({ count: 0 }) // stale lease recovery
      .mockResolvedValueOnce({ count: 1 }); // claim
    prismaMock.eventMail.findMany.mockResolvedValue([{ id: 10 }]);
    prismaMock.eventMail.findUniqueOrThrow.mockResolvedValue({
      id: 10,
      subject: "【イベント】ご案内",
      sentAt: new Date("2026-10-08T01:00:00.000Z"),
      createdAt: new Date("2026-10-08T01:00:00.000Z"),
      targetCount: 3,
      successCount: 1,
      failedCount: 2,
      failureNotificationAttempts: 1,
      failureNotificationVersion: 1,
      failureNotificationSentAt: null,
      event: {
        id: 20,
        title: "イベント",
        community: { code: "naikan_meetup", name: "ないかんMeetup" },
      },
      deliveries: [
        {
          id: 101,
          lastNameSnapshot: "山田",
          firstNameSnapshot: "太郎",
          emailAddress: "one@missing.test",
          emailType: "main",
          subEmailOrder: null,
          providerErrorMessage: "550 5.1.1 mailbox does not exist",
          errorMessage: null,
          providerErrorCode: "Permanent",
          errorCode: null,
          status: "success",
          providerStatus: "bounced",
          failureNotifiedAt: null,
        },
        {
          id: 102,
          lastNameSnapshot: "佐藤",
          firstNameSnapshot: "花子",
          emailAddress: "two@missing.test",
          emailType: "sub",
          subEmailOrder: 1,
          providerErrorMessage: "suppressed",
          errorMessage: null,
          providerErrorCode: "Suppressed",
          errorCode: null,
          status: "success",
          providerStatus: "suppressed",
          failureNotifiedAt: null,
        },
      ],
    });
    prismaMock.eventMailDelivery.updateMany.mockResolvedValue({ count: 2 });
    prismaMock.eventMail.update.mockResolvedValue({});
    prismaMock.$transaction.mockImplementation(async (operations: unknown[]) =>
      Promise.all(operations)
    );
    prismaMock.eventMail.findUnique.mockResolvedValue({
      sentAt: new Date("2026-10-08T01:00:00.000Z"),
      failureNotificationStatus: "sent",
      failureNotificationDueAt: null,
      failureNotificationVersion: 1,
      deliveries: [
        {
          status: "success",
          providerStatus: "bounced",
          failureNotifiedAt: new Date("2026-10-08T01:01:00.000Z"),
        },
      ],
    });
    sendMailMock.mockResolvedValue({
      success: true,
      providerEmailId: "notification-1",
    });
  });

  it("同じ送信の複数エラーを一通にまとめ、成功後に通知済みとする", async () => {
    const result = await processDueFailureNotifications(
      new Date("2026-10-08T01:03:00.000Z")
    );

    expect(result).toEqual({ checked: 1, sent: 1, failed: 0, skipped: 0 });
    expect(sendMailMock).toHaveBeenCalledOnce();
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "noreply@marcopolo-portal.jp",
        to: ["first@example.com", "second@example.com"],
        idempotencyKey: "event-mail-failure-develop-10-1",
        text: expect.stringContaining("メールアドレス：one@missing.test"),
      })
    );
    expect(sendMailMock.mock.calls[0][0].text).toContain(
      "メールアドレス：two@missing.test"
    );
    expect(prismaMock.eventMailDelivery.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [101, 102] }, failureNotifiedAt: null },
      data: { failureNotifiedAt: new Date("2026-10-08T01:03:00.000Z") },
    });
  });
});

