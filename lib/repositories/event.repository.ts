import { prisma } from "@/lib/prisma";
import type { Community, Event } from "@/lib/generated/prisma";

// ============================================================
// 型定義
// ============================================================

export type EventForList = Event & {
  community: Community;
  _count: { rsvps: number };
};

// ============================================================
// Repository 関数
// ============================================================

/**
 * イベント一覧取得（スコープに基づくフィルタ、deletedAt=null）
 * - super: 全イベント
 * - community_admin: スコープ内コミュニティのイベントのみ
 * - _count.rsvps: attending/online のみカウント
 */
export async function findAllEvents(
  scopedCommunityIds: number[],
  isSuper: boolean
): Promise<EventForList[]> {
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
      _count: {
        select: {
          rsvps: {
            where: { status: { in: ["attending", "online"] } },
          },
        },
      },
    },
    orderBy: { date: "asc" },
  });

  return events;
}

/**
 * イベント新規作成
 */
export async function createEvent(data: {
  communityId: number;
  title: string;
  date: Date;
  location: string | null;
  description: string | null;
  timetable: string | null;
  note: string | null;
  responseDeadline: Date | null;
  allowsOnline: boolean;
  hasAfterParty: boolean;
}): Promise<Event> {
  return prisma.event.create({ data });
}

/**
 * イベント単体取得（編集画面用）
 */
export async function findEventById(eventId: number): Promise<Event | null> {
  return prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });
}

/**
 * イベント更新
 */
export async function updateEvent(
  eventId: number,
  data: {
    communityId: number;
    title: string;
    date: Date;
    location: string | null;
    description: string | null;
    timetable: string | null;
    note: string | null;
    responseDeadline: Date | null;
    allowsOnline: boolean;
    hasAfterParty: boolean;
  }
): Promise<Event> {
  return prisma.event.update({
    where: { id: eventId },
    data,
  });
}
