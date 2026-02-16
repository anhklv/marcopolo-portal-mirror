import { prisma } from "@/lib/prisma";
import type { Community, Event, Rsvp } from "@/lib/generated/prisma";

// ============================================================
// 型定義
// ============================================================

export type EventWithCommunityAndRsvps = Event & {
  community: Community;
  rsvps: Rsvp[];
};

// ============================================================
// Repository 関数
// ============================================================

/**
 * イベント一覧取得（スコープに基づくフィルタ、deletedAt=null）
 * - super: 全イベント
 * - community_admin: スコープ内コミュニティのイベントのみ
 */
export async function findAllEvents(
  scopedCommunityIds: number[],
  isSuper: boolean
): Promise<EventWithCommunityAndRsvps[]> {
  const where: { deletedAt: null; communityId?: { in: number[] } } = {
    deletedAt: null,
  };

  if (!isSuper) {
    if (scopedCommunityIds.length === 0) {
      return [];
    }
    where.communityId = { in: scopedCommunityIds };
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      community: true,
      rsvps: true,
    },
    orderBy: { date: "asc" },
  });

  return events;
}
