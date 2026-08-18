import { prisma } from "@/lib/prisma";
import type {
  Community,
  Customer,
  Event,
  ListingCategory,
  Prefecture,
  Rsvp,
} from "@/lib/generated/prisma";

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

export type EventForAttendeesExport = Pick<Event, "id" | "hasAfterParty"> & {
  rsvps: (Pick<
    Rsvp,
    "id" | "status" | "afterPartyStatus" | "comment" | "respondedAt"
  > & {
    customer: Pick<
      Customer,
      | "id"
      | "lastName"
      | "firstName"
      | "lastNameKana"
      | "firstNameKana"
      | "company"
      | "email"
      | "subEmails"
      | "phone"
      | "postalCode"
      | "city"
      | "gender"
      | "note"
    > & {
      prefecture: Pick<Prefecture, "name"> | null;
      listingCategory: Pick<
        ListingCategory,
        "marketName" | "stockExchangeName"
      > | null;
    };
  })[];
};

export type EventForInvite = Event & {
  community: Community;
  rsvps: Pick<Rsvp, "customerId" | "status">[];
};

export type EventForRemind = Event & {
  community: Community;
  rsvps: (Pick<Rsvp, "customerId" | "status"> & {
    customer: Pick<
      Customer,
      "id" | "lastName" | "firstName" | "email" | "subEmails" | "company" | "memberCategory"
    > & {
      customerCommunities: {
        communityId: number;
        resignedAt: Date | null;
        auditMemberType: string | null;
        auditMemberPremium: boolean | null;
        community: { code: string; name: string };
      }[];
    };
  })[];
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
 * イベント参加状況 CSV 出力用取得
 * 画面表示用データに個人情報を含めず、エクスポート時だけ顧客プロフィールを取得する。
 */
export async function findEventByIdForAttendeesExport(
  eventId: number
): Promise<EventForAttendeesExport | null> {
  return prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    select: {
      id: true,
      hasAfterParty: true,
      rsvps: {
        select: {
          id: true,
          status: true,
          afterPartyStatus: true,
          comment: true,
          respondedAt: true,
          customer: {
            select: {
              id: true,
              lastName: true,
              firstName: true,
              lastNameKana: true,
              firstNameKana: true,
              company: true,
              email: true,
              subEmails: true,
              phone: true,
              postalCode: true,
              city: true,
              gender: true,
              note: true,
              prefecture: { select: { name: true } },
              listingCategory: {
                select: { marketName: true, stockExchangeName: true },
              },
            },
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
 * イベントリマインド用取得（community + pending RSVP + customer情報 含む）
 */
export async function findEventByIdForRemind(
  eventId: number
): Promise<EventForRemind | null> {
  return prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    include: {
      community: true,
      rsvps: {
        where: { status: "pending", customer: { deletedAt: null } },
        include: {
          customer: {
            select: {
              id: true,
              lastName: true,
              firstName: true,
              email: true,
              subEmails: true,
              company: true,
              memberCategory: true,
              customerCommunities: {
                select: {
                  communityId: true,
                  resignedAt: true,
                  auditMemberType: true,
                  auditMemberPremium: true,
                  community: {
                    select: { code: true, name: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { customer: { id: "desc" } },
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
