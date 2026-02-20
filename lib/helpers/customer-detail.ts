// 顧客詳細画面のヘルパー関数（純粋関数、テスト対象）

import { AUDIT_MEMBER_TYPES, MEMBER_CATEGORY_LABELS } from "@/lib/constants/customer";
import type { BadgeVariant } from "@/components/ui/badge";

// ============================================================
// バッジ表示ロジック
// ============================================================

export interface BadgeInfo {
  label: string;
  variant: BadgeVariant;
}

export interface CustomerCommunityForBadge {
  communityId: number;
  auditMemberType: string | null;
  auditMemberPremium: boolean | null;
  resignedAt: string | null;
  community: {
    code: string;
    name: string;
  };
}

export function getCustomerBadges(
  customerCommunities: CustomerCommunityForBadge[],
  memberCategory: string | null
): BadgeInfo[] {
  if (customerCommunities.length === 0) {
    return [{ label: "非会員", variant: "non-member" }];
  }

  const badges: BadgeInfo[] = [];
  const categoryLabel = memberCategory
    ? MEMBER_CATEGORY_LABELS[memberCategory as keyof typeof MEMBER_CATEGORY_LABELS] ?? ""
    : "";

  for (const cc of customerCommunities) {
    let variant: BadgeVariant = "default";
    if (cc.community.code === "venture_auditor") variant = "audit";
    else if (cc.community.code === "naikan_meetup") variant = "naikan";
    else if (cc.community.code === "ai_club") variant = "ai";

    if (cc.resignedAt) {
      badges.push({
        label: `${cc.community.name}(元${categoryLabel})`,
        variant,
      });
    } else if (memberCategory === "member" && cc.auditMemberType) {
      const typeLabel = AUDIT_MEMBER_TYPES.find((t) => t.value === cc.auditMemberType)?.label ?? "";
      badges.push({
        label: `${cc.community.name}(${typeLabel})`,
        variant,
      });
    } else {
      badges.push({
        label: `${cc.community.name}(${categoryLabel})`,
        variant,
      });
    }
  }

  // プレミアムバッジ
  const hasPremium = customerCommunities.some((cc) => cc.auditMemberPremium);
  if (hasPremium) {
    badges.push({ label: "プレミアム", variant: "premium" });
  }

  return badges;
}

// ============================================================
// イベント参加履歴の分類
// ============================================================

export interface RsvpEvent {
  eventId: number;
  eventTitle: string;
  eventDate: string;
  communityName: string;
  status: string;
}

export function classifyEvents(
  rsvps: RsvpEvent[],
  now: Date = new Date()
): { upcoming: RsvpEvent[]; past: RsvpEvent[] } {
  const upcoming: RsvpEvent[] = [];
  const past: RsvpEvent[] = [];

  const sorted = [...rsvps].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  );

  for (const rsvp of sorted) {
    const eventDate = new Date(rsvp.eventDate);
    if (eventDate >= now) {
      upcoming.push(rsvp);
    } else {
      past.push(rsvp);
    }
  }

  return { upcoming, past };
}
