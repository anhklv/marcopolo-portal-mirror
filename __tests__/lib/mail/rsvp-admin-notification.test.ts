import { describe, expect, it } from "vitest";
import { generateRsvpAdminNotification } from "@/lib/mail/templates/rsvp-admin-notification";

describe("generateRsvpAdminNotification", () => {
  it("全項目を表示し、変更された項目を太字にする", () => {
    const result = generateRsvpAdminNotification({
      communityName: "ないかんMeetup",
      eventTitle: "ないかんMeetup #12",
      eventDate: new Date("2026-10-20T10:00:00.000Z"),
      participationOptionEnabled: true,
      hasAfterParty: true,
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
        participationOptionLabel: "講演・懇親会ともに参加",
        comment: "当日は18時50分頃に到着予定です。",
      },
      respondedAt: new Date("2026-10-06T01:30:00.000Z"),
      adminEventUrl: "https://marcopolo-portal.jp/admin/events/123",
    });

    expect(result.subject).toBe(
      "【ないかんMeetup #12】参加回答更新のお知らせ（山田 太郎様）"
    );
    expect(result.text).toContain(
      "「ないかんMeetup #12」の参加回答が更新されましたので、お知らせいたします。"
    );
    expect(result.text).toContain("■カテゴリー\nないかんMeetup");
    expect(result.text).toContain("・参加ステータス：未回答 → 現地参加");
    expect(result.text).toContain(
      "・参加内容：未選択 → 講演・懇親会ともに参加"
    );
    expect(result.text).toContain("・懇親会：未回答 → 参加する");
    expect(result.text.indexOf("・参加ステータス：")).toBeLessThan(
      result.text.indexOf("・参加内容：")
    );
    expect(result.text.indexOf("・参加内容：")).toBeLessThan(
      result.text.indexOf("・懇親会：")
    );
    expect(result.text).toContain(
      "・メッセージ・連絡事項：未入力 → 当日は18時50分頃に到着予定です。"
    );
    expect(result.html).toContain("<strong>山田 太郎 様</strong>");
    expect(result.html).toContain("<strong>■変更内容");
    expect(result.html).toContain(
      "<strong>・参加ステータス：未回答 → 現地参加</strong>"
    );
    expect(result.html).toContain(
      "<strong>・参加内容：未選択 → 講演・懇親会ともに参加</strong>"
    );
    expect(result.html).toContain(
      "<strong>・懇親会：未回答 → 参加する</strong>"
    );
    expect(result.html.indexOf("・参加ステータス：")).toBeLessThan(
      result.html.indexOf("・参加内容：")
    );
    expect(result.html.indexOf("・参加内容：")).toBeLessThan(
      result.html.indexOf("・懇親会：")
    );
  });

  it("不参加の場合は懇親会と参加内容を表示しない", () => {
    const result = generateRsvpAdminNotification({
      communityName: "AI部会",
      eventTitle: "定例会",
      eventDate: new Date("2026-10-20T10:00:00.000Z"),
      participationOptionEnabled: true,
      hasAfterParty: true,
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
        comment: "欠席します",
      },
      respondedAt: new Date("2026-10-06T01:30:00.000Z"),
      adminEventUrl: "https://marcopolo-portal.jp/admin/events/20",
    });

    expect(result.text).toContain(
      "・参加ステータス：現地参加 → 参加しない"
    );
    expect(result.text).toContain(
      "・メッセージ・連絡事項：未入力 → 欠席します"
    );
    expect(result.text).not.toContain("・懇親会：");
    expect(result.text).not.toContain("・参加内容：");
    expect(result.html).not.toContain("・懇親会：");
    expect(result.html).not.toContain("・参加内容：");
  });

  it("オンライン参加の場合は懇親会を表示しない", () => {
    const result = generateRsvpAdminNotification({
      communityName: "ないかんMeetup",
      eventTitle: "定例会",
      eventDate: new Date("2026-10-20T10:00:00.000Z"),
      participationOptionEnabled: true,
      hasAfterParty: true,
      customerName: "山田 太郎",
      previous: {
        status: "attending",
        afterPartyStatus: "not_attending",
        participationOptionId: null,
        participationOptionLabel: null,
        comment: null,
      },
      current: {
        status: "online",
        afterPartyStatus: null,
        participationOptionId: null,
        participationOptionLabel: null,
        comment: null,
      },
      respondedAt: new Date("2026-10-06T01:30:00.000Z"),
      adminEventUrl: "https://marcopolo-portal.jp/admin/events/21",
    });

    expect(result.text).toContain(
      "・参加ステータス：現地参加 → オンライン参加"
    );
    expect(result.text).not.toContain("・参加内容：");
    expect(result.text).not.toContain("・メッセージ・連絡事項：");
    expect(result.text).not.toContain("・懇親会：");
    expect(result.html).toContain(
      "<strong>・参加ステータス：現地参加 → オンライン参加</strong>"
    );
    expect(result.html).not.toContain("・参加内容：");
    expect(result.html).not.toContain("・メッセージ・連絡事項：");
    expect(result.html).not.toContain("・懇親会：");
  });

  it("HTMLへ顧客入力を安全に埋め込む", () => {
    const result = generateRsvpAdminNotification({
      communityName: "ないかんMeetup",
      eventTitle: "<イベント>",
      eventDate: new Date("2026-10-20T10:00:00.000Z"),
      participationOptionEnabled: false,
      hasAfterParty: false,
      customerName: "山田 & 太郎",
      previous: {
        status: "pending",
        afterPartyStatus: null,
        participationOptionId: null,
        participationOptionLabel: null,
        comment: null,
      },
      current: {
        status: "attending",
        afterPartyStatus: null,
        participationOptionId: null,
        participationOptionLabel: null,
        comment: "<script>alert(1)</script>",
      },
      respondedAt: new Date("2026-10-06T01:30:00.000Z"),
      adminEventUrl: "https://example.com/admin/events/1?a=1&b=2",
    });

    expect(result.html).toContain("山田 &amp; 太郎");
    expect(result.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(result.html).not.toContain("<script>");
  });
});
