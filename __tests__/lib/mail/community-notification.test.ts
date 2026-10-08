import { afterEach, describe, expect, it } from "vitest";
import {
  getCommunityNotificationRecipients,
  parseNotificationRecipients,
} from "@/lib/mail/community-notification";

describe("community notification recipients", () => {
  afterEach(() => {
    delete process.env.COMMUNITY_NOTIFICATION_OVERRIDE_TO;
    delete process.env.COMMUNITY_NOTIFICATION_TO_NAIKAN_MEETUP;
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

  it("overrideがあれば全コミュニティの実宛先を置き換える", () => {
    process.env.COMMUNITY_NOTIFICATION_TO_NAIKAN_MEETUP =
      "real@example.com";
    process.env.COMMUNITY_NOTIFICATION_OVERRIDE_TO = "qa@example.com";

    expect(getCommunityNotificationRecipients("naikan_meetup")).toEqual([
      "qa@example.com",
    ]);
  });
});

