import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EmailBouncedEvent, EmailDeliveryDelayedEvent } from "resend";

const prismaMock = vi.hoisted(() => ({
  mailProviderWebhookEvent: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  eventMailDelivery: {
    findFirst: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  eventMail: {
    update: vi.fn(),
  },
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  processResendWebhook,
  reconcileUnmatchedResendWebhooks,
} from "@/lib/mail/resend-webhook";

const bouncedEvent: EmailBouncedEvent = {
  type: "email.bounced",
  created_at: "2026-10-07T02:00:00.000Z",
  data: {
    created_at: "2026-10-07T01:59:59.000Z",
    email_id: "resend-email-1",
    message_id: "<smtp-message-1@example.com>",
    from: "noreply@marcopolo-portal.jp",
    to: ["missing@example.com"],
    subject: "Invitation",
    bounce: {
      type: "Permanent",
      subType: "General",
      message: "550 5.1.1 mailbox does not exist",
      diagnosticCode: ["smtp; 550-5.1.1 mailbox does not exist"],
    } as EmailBouncedEvent["data"]["bounce"] & {
      diagnosticCode: string[];
    },
  },
};

const delayedEvent: EmailDeliveryDelayedEvent = {
  ...bouncedEvent,
  type: "email.delivery_delayed",
  data: {
    ...bouncedEvent.data,
    email_id: "resend-email-2",
    message_id: "smtp-message-2@example.com",
    to: ["slow@example.com"],
  },
};

describe("processResendWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
        callback(prismaMock)
    );
    prismaMock.mailProviderWebhookEvent.create.mockResolvedValue({ id: 100 });
    prismaMock.mailProviderWebhookEvent.update.mockResolvedValue({});
    prismaMock.$queryRaw.mockResolvedValue([]);
    prismaMock.eventMailDelivery.findUniqueOrThrow.mockResolvedValue({
      providerEventAt: null,
      providerStatus: "sent",
    });
    prismaMock.eventMailDelivery.update.mockResolvedValue({});
    prismaMock.eventMail.update.mockResolvedValue({ eventId: 16 });
  });

  it("bounceを宛先単位の失敗として保存し、メール集計を更新する", async () => {
    prismaMock.mailProviderWebhookEvent.findUnique.mockResolvedValue({
      id: 100,
      payload: bouncedEvent,
    });
    prismaMock.eventMailDelivery.findFirst.mockResolvedValue({
      id: 200,
      eventMailId: 300,
      providerEventAt: null,
      providerStatus: "sent",
    });
    prismaMock.eventMailDelivery.findMany.mockResolvedValue([
      { status: "success", providerStatus: "bounced" },
      { status: "success", providerStatus: "sent" },
    ]);

    const result = await processResendWebhook("svix-event-1", bouncedEvent);

    expect(result).toEqual({ duplicate: false, matched: true, eventId: 16 });
    expect(prismaMock.$queryRaw).toHaveBeenCalledOnce();
    expect(prismaMock.eventMailDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 200 },
        data: expect.objectContaining({
          providerEmailId: "resend-email-1",
          providerStatus: "bounced",
          bounceType: "Permanent",
          bounceSubType: "General",
          providerErrorMessage: "smtp; 550-5.1.1 mailbox does not exist",
        }),
      })
    );
    expect(prismaMock.eventMail.update).toHaveBeenCalledWith({
      where: { id: 300 },
      data: {
        targetCount: 2,
        successCount: 1,
        failedCount: 1,
        sendStatus: "partial_failed",
      },
      select: { eventId: true },
    });
  });

  it("delivery_delayedを保存するが失敗件数には含めない", async () => {
    prismaMock.mailProviderWebhookEvent.findUnique.mockResolvedValue({
      id: 100,
      payload: delayedEvent,
    });
    prismaMock.eventMailDelivery.findFirst.mockResolvedValue({
      id: 201,
      eventMailId: 301,
      providerEventAt: null,
      providerStatus: "sent",
    });
    prismaMock.eventMailDelivery.findMany.mockResolvedValue([
      { status: "success", providerStatus: "delayed" },
    ]);

    await processResendWebhook("svix-event-2", delayedEvent);

    expect(prismaMock.eventMail.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          successCount: 1,
          failedCount: 0,
          sendStatus: "success",
        }),
      })
    );
  });

  it("確定済みのbounceを後続の非失敗イベントで上書きしない", async () => {
    prismaMock.mailProviderWebhookEvent.findUnique.mockResolvedValue({
      id: 100,
      payload: delayedEvent,
    });
    prismaMock.eventMailDelivery.findFirst.mockResolvedValue({
      id: 201,
      eventMailId: 301,
      providerEventAt: new Date("2026-10-07T01:00:00.000Z"),
      providerStatus: "bounced",
    });
    prismaMock.eventMailDelivery.findUniqueOrThrow.mockResolvedValue({
      providerEventAt: new Date("2026-10-07T01:00:00.000Z"),
      providerStatus: "bounced",
    });
    prismaMock.eventMailDelivery.findMany.mockResolvedValue([
      { status: "success", providerStatus: "bounced" },
    ]);

    await processResendWebhook("svix-event-3", delayedEvent);

    const update = prismaMock.eventMailDelivery.update.mock.calls[0][0];
    expect(update.data.providerEmailId).toBe("resend-email-2");
    expect(update.data).not.toHaveProperty("providerStatus");
    expect(prismaMock.eventMail.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ failedCount: 1, sendStatus: "failed" }),
      })
    );
  });

  it("処理済みのsvix-idを再送されても二重処理しない", async () => {
    prismaMock.mailProviderWebhookEvent.create.mockRejectedValue({ code: "P2002" });
    prismaMock.mailProviderWebhookEvent.findUniqueOrThrow.mockResolvedValue({
      id: 100,
      processStatus: "processed",
    });

    const result = await processResendWebhook("svix-event-1", bouncedEvent);

    expect(result).toEqual({ duplicate: true, matched: true });
    expect(prismaMock.eventMailDelivery.findFirst).not.toHaveBeenCalled();
  });

  it("送信履歴が未作成ならunmatchedとして保存し、後から再照合できる", async () => {
    prismaMock.mailProviderWebhookEvent.findUnique
      .mockResolvedValueOnce({ id: 100, payload: bouncedEvent })
      .mockResolvedValueOnce({ id: 100, payload: bouncedEvent });
    prismaMock.eventMailDelivery.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 200,
        eventMailId: 300,
        providerEventAt: null,
        providerStatus: "sent",
      });
    prismaMock.mailProviderWebhookEvent.findMany.mockResolvedValue([{ id: 100 }]);
    prismaMock.eventMailDelivery.findMany.mockResolvedValue([
      { status: "success", providerStatus: "bounced" },
    ]);

    const first = await processResendWebhook("svix-event-1", bouncedEvent);
    expect(first.matched).toBe(false);
    expect(prismaMock.mailProviderWebhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ processStatus: "unmatched" }),
      })
    );

    await reconcileUnmatchedResendWebhooks({
      providerEmailIds: ["resend-email-1"],
      smtpMessageIds: ["<smtp-message-1@example.com>"],
    });

    expect(prismaMock.mailProviderWebhookEvent.findMany).toHaveBeenCalledWith({
      where: {
        provider: "resend",
        processStatus: "unmatched",
        OR: [
          { providerEmailId: { in: ["resend-email-1"] } },
          {
            smtpMessageId: {
              in: [
                "<smtp-message-1@example.com>",
                "smtp-message-1@example.com",
              ],
            },
          },
        ],
      },
      select: { id: true },
    });

    expect(prismaMock.eventMailDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 200 } })
    );
  });
});
