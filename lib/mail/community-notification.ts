import { COMMUNITY_CODE } from "@/lib/constants/community";

const COMMUNITY_RECIPIENT_ENV = {
  [COMMUNITY_CODE.NAIKAN_MEETUP]:
    "COMMUNITY_NOTIFICATION_TO_NAIKAN_MEETUP",
  [COMMUNITY_CODE.VENTURE_AUDITOR]:
    "COMMUNITY_NOTIFICATION_TO_VENTURE_AUDITOR",
  [COMMUNITY_CODE.AI_CLUB]: "COMMUNITY_NOTIFICATION_TO_AI_CLUB",
} as const;

/**
 * Parse a recipient list from an environment variable.
 * Commas, semicolons and line breaks are accepted so one community can have
 * multiple notification recipients without changing application code.
 */
export function parseNotificationRecipients(value?: string): string[] {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(/[,;\r\n]+/)
        .map((email) => email.trim())
        .filter(Boolean)
    )
  );
}

export function getCommunityNotificationRecipients(
  communityCode: string
): string[] {
  const overrideRecipients = parseNotificationRecipients(
    process.env.COMMUNITY_NOTIFICATION_OVERRIDE_TO
  );
  if (overrideRecipients.length > 0) return overrideRecipients;

  const envName = (
    COMMUNITY_RECIPIENT_ENV as Record<string, string | undefined>
  )[communityCode];
  return envName
    ? parseNotificationRecipients(process.env[envName])
    : [];
}

