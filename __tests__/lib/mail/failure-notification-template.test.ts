import { describe, expect, it } from "vitest";
import {
  generateFailureNotificationBody,
  generateFailureNotificationSubject,
} from "@/lib/mail/templates/failure-notification";

const params = {
  communityName: "ベンチャー監査役の会",
  eventTitle: "テストイベント",
  mailSubject: "【テストイベント】ご案内",
  sentAt: new Date("2026-10-08T01:00:00.000Z"),
  targetCount: 3,
  returnedCount: 3,
  successCount: 1,
  failedCount: 2,
  pendingCount: 0,
  failures: [
    {
      customerName: "山田 太郎",
      emailAddress: "missing@example.com",
      emailType: "sub" as const,
      subEmailOrder: 1,
      reason: "smtp; 550 5.1.1 mailbox does not exist",
    },
  ],
  detailUrl: "https://example.com/admin/events/1/mails/2",
  isAdditional: false,
};

describe("failure notification template", () => {
  it("コミュニティ名とイベント名を件名に含める", () => {
    expect(generateFailureNotificationSubject(params)).toBe(
      "【メール送信エラー通知】【ベンチャー監査役の会】テストイベント"
    );
  });

  it("集計とエラー一覧を一つの本文にまとめる", () => {
    const body = generateFailureNotificationBody(params);

    expect(body).toContain("対象：3件");
    expect(body).toContain("結果確認済：3件");
    expect(body).toContain("失敗：2件");
    expect(body).toContain("メールアドレス：missing@example.com");
    expect(body).toContain("種別：サブ1");
    expect(body).toContain("smtp; 550 5.1.1 mailbox does not exist");
  });

  it("遅れて検出されたエラーは追加通知と表示する", () => {
    expect(
      generateFailureNotificationSubject({ ...params, isAdditional: true })
    ).toContain("エラー通知（追加）");
  });
});

