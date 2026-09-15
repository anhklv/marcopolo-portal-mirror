import type { Prisma } from "@/lib/generated/prisma";

export const REMIND_TARGETS = [
  "pending",
  "invited",
  "all",
  "onsite",
  "online",
  "after_party",
] as const;

export type RemindTarget = (typeof REMIND_TARGETS)[number];

export const DEFAULT_REMIND_TARGET: RemindTarget = "pending";

export const REMIND_TARGET_LABELS: Record<RemindTarget, string> = {
  pending: "未回答者",
  invited: "全員",
  all: "参加者全員",
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
      return { status: "pending" };
    case "invited":
      return {};
    case "onsite":
      return { status: "attending" };
    case "online":
      return { status: "online" };
    case "after_party":
      return { afterPartyStatus: "attending" };
    case "all":
    default:
      return { status: { in: ["attending", "online"] } };
  }
}
