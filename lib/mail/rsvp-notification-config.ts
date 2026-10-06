import { COMMUNITY_CODE } from "@/lib/constants/community";

export const RSVP_NOTIFICATION_FROM = "noreply@marcopolo-portal.jp";

const RECIPIENT_BY_COMMUNITY: Readonly<Record<string, string>> = {
  [COMMUNITY_CODE.NAIKAN_MEETUP]: "info@naikan-mup.com",
  [COMMUNITY_CODE.VENTURE_AUDITOR]: "13haishin@gmail.com",
  [COMMUNITY_CODE.AI_CLUB]: "admin_ai@aiaudit.jp",
};

/** ID17で通知先が定義されている主要3コミュニティのみを対象にする。 */
export function getRsvpNotificationRecipient(
  communityCode: string
): string | null {
  return RECIPIENT_BY_COMMUNITY[communityCode] ?? null;
}
