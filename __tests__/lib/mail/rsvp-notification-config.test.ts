import { describe, expect, it } from "vitest";
import { getRsvpNotificationRecipient } from "@/lib/mail/rsvp-notification-config";

describe("getRsvpNotificationRecipient", () => {
  it.each([
    ["naikan_meetup", "info@naikan-mup.com"],
    ["venture_auditor", "13haishin@gmail.com"],
    ["ai_club", "admin_ai@aiaudit.jp"],
  ])("%s の通知先を返す", (communityCode, expected) => {
    expect(getRsvpNotificationRecipient(communityCode)).toBe(expected);
  });

  it("通知先が定義されていないカテゴリーはnullを返す", () => {
    expect(getRsvpNotificationRecipient("other")).toBeNull();
  });
});
