import type { Prisma } from "@/lib/generated/prisma";

export const REMIND_TARGETS = [
  "pending",
  "all",
  "onsite",
  "online",
  "after_party",
] as const;

export type RemindTarget = (typeof REMIND_TARGETS)[number];

export const DEFAULT_REMIND_TARGET: RemindTarget = "pending";

export const REMIND_TARGET_LABELS: Record<RemindTarget, string> = {
  pending: "未回答者",
  all: "全員",
  onsite: "現地参加者",
  online: "オンライン参加者",
  after_party: "懇親会参加者",
};

export function parseRemindTarget(value: string | null): RemindTarget {
  return REMIND_TARGETS.includes(value as RemindTarget)
    ? (value as RemindTarget)
    : DEFAULT_REMIND_TARGET;
}

export function buildRemindRsvpWhere(target: RemindTarget): Prisma.RsvpWhereInput {
  switch (target) {
    case "pending":
      return { status: "pending" as const };
    case "onsite":
      return { status: "attending" as const };
    case "online":
      return { status: "online" as const };
    case "after_party":
      return { afterPartyStatus: "attending" as const };
    case "all":
    default:
      return { status: { in: ["attending", "online"] } };
  }
}
