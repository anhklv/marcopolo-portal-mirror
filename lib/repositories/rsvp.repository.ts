import { prisma } from "@/lib/prisma";
import type { Community, Customer, Event, Rsvp } from "@/lib/generated/prisma";

// ============================================================
// 型定義
// ============================================================

export type RsvpForPage = Rsvp & {
  event: Event & {
    community: Pick<Community, "name">;
  };
  customer: Pick<Customer, "id" | "lastName" | "firstName" | "deletedAt">;
};

export type RsvpForAdminUpdate = Rsvp & {
  event: Pick<Event, "id" | "deletedAt" | "hasAfterParty">;
  customer: Pick<
    Customer,
    | "id"
    | "lastName"
    | "firstName"
    | "email"
    | "subEmails"
    | "deletedAt"
  >;
};

// ============================================================
// Repository 関数
// ============================================================

/**
 * トークンでRSVPを取得（RSVP回答ページ用）
 * event(community含む) + customer をinclude。論理削除チェックは呼び出し側で実施。
 */
export async function findRsvpByToken(
  token: string
): Promise<RsvpForPage | null> {
  return prisma.rsvp.findUnique({
    where: { token },
    include: {
      event: {
        include: {
          community: {
            select: { name: true },
          },
        },
      },
      customer: {
        select: {
          id: true,
          lastName: true,
          firstName: true,
          deletedAt: true,
        },
      },
    },
  });
}

/**
 * 管理者によるRSVP更新用に取得（RSVPとイベントの組み合わせを確認）
 */
export async function findRsvpByIdForAdmin(
  rsvpId: number,
  eventId: number
): Promise<RsvpForAdminUpdate | null> {
  return prisma.rsvp.findFirst({
    where: {
      id: rsvpId,
      eventId,
      event: { deletedAt: null },
    },
    include: {
      event: {
        select: {
          id: true,
          deletedAt: true,
          hasAfterParty: true,
        },
      },
      customer: {
        select: {
          id: true,
          lastName: true,
          firstName: true,
          email: true,
          subEmails: true,
          deletedAt: true,
        },
      },
    },
  });
}

/**
 * RSVP回答更新
 */
export async function updateRsvpResponse(
  rsvpId: number,
  data: {
    status: "attending" | "online" | "absent";
    afterPartyStatus: "attending" | "not_attending" | null;
    comment: string | null;
    adminNote?: string | null;
    respondedAt: Date;
  }
): Promise<Rsvp> {
  return prisma.rsvp.update({
    where: { id: rsvpId },
    data,
  });
}
