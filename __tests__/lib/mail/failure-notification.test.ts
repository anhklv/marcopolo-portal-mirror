import { describe, expect, it } from "vitest";
import { getFailureNotificationReadiness } from "@/lib/mail/failure-notification-readiness";

const sentAt = new Date("2026-10-08T01:00:00.000Z");

describe("getFailureNotificationReadiness", () => {
  it("全宛先の成功・失敗結果が揃えば3分を待たずに通知可能にする", () => {
    const result = getFailureNotificationReadiness(
      [
        {
          status: "success",
          providerStatus: "delivered",
          failureNotifiedAt: null,
        },
        {
          status: "success",
          providerStatus: "bounced",
          failureNotifiedAt: null,
        },
        {
          status: "failed",
          providerStatus: "failed",
          failureNotifiedAt: null,
        },
      ],
      sentAt,
      new Date("2026-10-08T01:00:30.000Z"),
      180_000
    );

    expect(result).toMatchObject({
      targetCount: 3,
      returnedCount: 3,
      failureCount: 2,
      ready: true,
    });
  });

  it("結果が不足していても3分経過後は受信済みの失敗を通知可能にする", () => {
    const result = getFailureNotificationReadiness(
      [
        {
          status: "success",
          providerStatus: "bounced",
          failureNotifiedAt: null,
        },
        {
          status: "success",
          providerStatus: "sent",
          failureNotifiedAt: null,
        },
      ],
      sentAt,
      new Date("2026-10-08T01:03:00.000Z"),
      180_000
    );

    expect(result).toMatchObject({
      targetCount: 2,
      returnedCount: 1,
      failureCount: 1,
      ready: true,
    });
  });

  it("未通知の失敗がなければ通知対象を0件とする", () => {
    const result = getFailureNotificationReadiness(
      [
        {
          status: "success",
          providerStatus: "bounced",
          failureNotifiedAt: sentAt,
        },
      ],
      sentAt,
      new Date("2026-10-08T01:04:00.000Z"),
      180_000
    );

    expect(result.failureCount).toBe(0);
  });
});

