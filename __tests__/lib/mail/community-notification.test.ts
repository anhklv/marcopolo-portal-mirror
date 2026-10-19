import { afterEach, describe, expect, it } from "vitest";
import {
  getCommunityNotificationRecipients,
  parseNotificationRecipients,
} from "@/lib/mail/community-notification";

describe("community notification recipients", () => {
  afterEach(() => {
    delete process.env.COMMUNITY_NOTIFICATION_TO_NAIKAN_MEETUP;
    delete process.env.COMMUNITY_NOTIFICATION_TO_VENTURE_AUDITOR;
    delete process.env.COMMUNITY_NOTIFICATION_TO_AI_CLUB;
    delete process.env.COMMUNITY_NOTIFICATION_TO_OTHER;
  });

  it("カンマ、セミコロン、改行区切りを重複なしの配列にする", () => {
    expect(
      parseNotificationRecipients(
        "one@example.com, two@example.com;one@example.com\nthree@example.com"
      )
    ).toEqual([
      "one@example.com",
      "two@example.com",
      "three@example.com",
    ]);
  });

  it("コミュニティごとの宛先を返す", () => {
    process.env.COMMUNITY_NOTIFICATION_TO_NAIKAN_MEETUP =
      "one@example.com,two@example.com";

    expect(getCommunityNotificationRecipients("naikan_meetup")).toEqual([
      "one@example.com",
      "two@example.com",
    ]);
  });

  it("通知先が未設定の場合は空配列を返す", () => {
    expect(getCommunityNotificationRecipients("unknown")).toEqual([]);
  });
});

