import { afterEach, describe, expect, it } from "vitest";
import { getCommunityFailureNotificationRecipients } from "@/lib/mail/community-failure-notification";
import { getCommunityNotificationRecipients } from "@/lib/mail/community-notification";

describe("ID14 community failure notification recipients", () => {
  afterEach(() => {
    delete process.env.COMMUNITY_NOTIFICATION_OVERRIDE_TO;
    delete process.env.COMMUNITY_NOTIFICATION_TO_OTHER;
  });

  it("その他の通知先はID14にだけ適用する", () => {
    process.env.COMMUNITY_NOTIFICATION_TO_OTHER = "13haishin@gmail.com";

    expect(getCommunityNotificationRecipients("other")).toEqual([]);
    expect(getCommunityFailureNotificationRecipients("other")).toEqual([
      "13haishin@gmail.com",
    ]);
  });
});
