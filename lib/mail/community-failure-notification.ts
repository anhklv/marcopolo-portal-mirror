import { COMMUNITY_CODE } from "@/lib/constants/community";
import {
  getCommunityNotificationRecipients,
  parseNotificationRecipients,
} from "@/lib/mail/community-notification";

/**
 * Resolve recipients specifically for ID14 delivery-failure notifications.
 * `other` is intentionally handled here instead of the shared routing so the
 * same environment variable does not implicitly enable ID17.
 */
export function getCommunityFailureNotificationRecipients(
  communityCode: string
): string[] {
  if (communityCode === COMMUNITY_CODE.OTHER) {
    return parseNotificationRecipients(
      process.env.COMMUNITY_NOTIFICATION_TO_OTHER
    );
  }

  return getCommunityNotificationRecipients(communityCode);
}
