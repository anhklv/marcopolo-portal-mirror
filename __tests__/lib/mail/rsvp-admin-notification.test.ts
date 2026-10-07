import { describe, expect, it } from "vitest";
import { generateRsvpAdminNotification } from "@/lib/mail/templates/rsvp-admin-notification";

describe("generateRsvpAdminNotification", () => {
  it("変更された項目だけを日本語テンプレートへ出力する", () => {
    const result = generateRsvpAdminNotification({
      communityName: "ないかんMeetup",
      eventTitle: "ないかんMeetup #12",
      eventDate: new Date("2026-09-16T09:00:00.000Z"),
      customerName: "山田 太郎",
      previous: {
        status: "pending",
        afterPartyStatus: null,
        participationOptionId: null,
        participationOptionLabel: null,
        comment: null,
      },
      current: {
        status: "attending",
        afterPartyStatus: "attending",
        participationOptionId: 10,
        participationOptionLabel: "会場参加",
        comment: "参加します",
      },
      respondedAt: new Date("2026-09-01T03:34:00.000Z"),
      adminEventUrl: "https://marcopolo-portal.jp/admin/events/12",
    });

    expect(result.subject).toBe(
      "【ないかんMeetup #12】参加回答更新のお知らせ（山田 太郎様）"
    );
    expect(result.body).toContain("・参加ステータス：未回答 → 参加");
    expect(result.body).toContain("・懇親会：未回答 → 参加");
    expect(result.body).toContain("・参加内容：未選択 → 会場参加");
    expect(result.body).toContain("・コメント：未入力 → 参加します");
    expect(result.body).toContain(
      "管理画面：https://marcopolo-portal.jp/admin/events/12"
    );
    expect(result.html).toContain("回答者：<strong>山田 太郎様</strong>");
    expect(result.html).toContain("<strong>変更内容：</strong>");
    expect(result.html).toContain(
      "<strong>・参加ステータス：未回答 → 参加</strong>"
    );
    expect(result.html).toContain(
      "<strong>・コメント：未入力 → 参加します</strong>"
    );
  });

  it("不参加の場合は懇親会と参加内容を出力しない", () => {
    const result = generateRsvpAdminNotification({
      communityName: "AI部会",
      eventTitle: "定例会",
      eventDate: new Date("2026-09-16T09:00:00.000Z"),
      customerName: "佐藤 花子",
      previous: {
        status: "attending",
        afterPartyStatus: "attending",
        participationOptionId: 10,
        participationOptionLabel: "会場参加",
        comment: null,
      },
      current: {
        status: "absent",
        afterPartyStatus: null,
        participationOptionId: null,
        participationOptionLabel: null,
        comment: null,
      },
      respondedAt: new Date("2026-09-01T03:34:00.000Z"),
      adminEventUrl: "https://marcopolo-portal.jp/admin/events/20",
    });

    expect(result.body).toContain("・参加ステータス：参加 → 不参加");
    expect(result.body).not.toContain("・懇親会：");
    expect(result.body).not.toContain("・参加内容：");
    expect(result.body).not.toContain("・コメント：");
    expect(result.html).not.toContain("・懇親会：");
    expect(result.html).not.toContain("・参加内容：");
  });
});
