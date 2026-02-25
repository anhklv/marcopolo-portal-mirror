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
 * RSVP回答更新
 */
export async function updateRsvpResponse(
  rsvpId: number,
  data: {
    status: "attending" | "online" | "absent";
    afterPartyStatus: "attending" | "not_attending" | null;
    comment: string | null;
    respondedAt: Date;
  }
): Promise<Rsvp> {
  return prisma.rsvp.update({
    where: { id: rsvpId },
    data,
  });
}
