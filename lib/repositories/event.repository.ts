import { prisma } from "@/lib/prisma";
import type { Community, Customer, Event, Rsvp } from "@/lib/generated/prisma";

// ============================================================
// 型定義
// ============================================================

export type EventForList = Event & {
  community: Community;
  _count: { rsvps: number };
};

export type EventForDetail = Event & {
  community: Community;
  rsvps: (Rsvp & {
    customer: Pick<Customer, "id" | "lastName" | "firstName" | "company">;
  })[];
};

export type EventForInvite = Event & {
  community: Community;
  rsvps: Pick<Rsvp, "customerId" | "status">[];
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

/**
 * イベント詳細取得（community + rsvps + customer 含む）
 */
export async function findEventByIdForDetail(
  eventId: number
): Promise<EventForDetail | null> {
  return prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    include: {
      community: true,
      rsvps: {
        include: {
          customer: {
            select: { id: true, lastName: true, firstName: true, company: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

/**
 * イベント案内用取得（community + rsvps[customerId] 含む）
 */
export async function findEventByIdForInvite(
  eventId: number
): Promise<EventForInvite | null> {
  return prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    include: {
      community: true,
      rsvps: {
        select: { customerId: true, status: true },
      },
    },
  });
}

/**
 * イベント論理削除（未削除のイベントのみ対象）
 */
export async function softDeleteEvent(eventId: number): Promise<Event> {
  // 未削除であることを確認
  await prisma.event.findFirstOrThrow({
    where: { id: eventId, deletedAt: null },
  });
  return prisma.event.update({
    where: { id: eventId },
    data: { deletedAt: new Date() },
  });
}

/**
 * イベントの一時停止/再開トグル
 */
export async function toggleEventPause(eventId: number): Promise<Event> {
  const event = await prisma.event.findFirstOrThrow({
    where: { id: eventId, deletedAt: null },
  });
  return prisma.event.update({
    where: { id: eventId },
    data: { isPaused: !event.isPaused },
  });
}
