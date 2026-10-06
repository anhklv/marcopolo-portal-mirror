import { prisma } from "@/lib/prisma";
import type {
  AfterPartyStatus,
  Community,
  Customer,
  Event,
  EventParticipationOption,
  Rsvp,
  RsvpStatus,
} from "@/lib/generated/prisma";

// ============================================================
// 型定義
// ============================================================

export type RsvpForPage = Rsvp & {
  event: Event & {
    community: Pick<Community, "code" | "name">;
    participationOptions: EventParticipationOption[];
  };
  participationOption: EventParticipationOption | null;
  customer: Pick<Customer, "id" | "lastName" | "firstName" | "deletedAt">;
};

export type RsvpForAdminUpdate = Rsvp & {
  event: Pick<
    Event,
    "id" | "deletedAt" | "hasAfterParty" | "participationMode"
  > & {
    participationOptions: EventParticipationOption[];
  };
  participationOption: EventParticipationOption | null;
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

export interface PublicRsvpResponseData {
  status: Exclude<RsvpStatus, "pending">;
  afterPartyStatus: AfterPartyStatus | null;
  comment: string | null;
  participationOptionId: number | null;
  respondedAt: Date;
}

export interface ExpectedPublicRsvpResponse {
  status: RsvpStatus;
  afterPartyStatus: AfterPartyStatus | null;
  comment: string | null;
  participationOptionId: number | null;
}

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
          participationOptions: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
          community: {
            select: { code: true, name: true },
          },
        },
      },
      participationOption: true,
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
          participationMode: true,
          participationOptions: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      participationOption: true,
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
    participationOptionId: number | null;
    respondedAt: Date;
  }
): Promise<Rsvp> {
  return prisma.rsvp.update({
    where: { id: rsvpId },
    data,
  });
}

/**
 * 読み取り時点の回答と一致する場合だけ公開RSVP回答を更新する。
 * 同じ旧状態からの同時送信では1リクエストだけが成功し、通知重複を防ぐ。
 */
export async function updatePublicRsvpResponseIfCurrent(
  rsvpId: number,
  expected: ExpectedPublicRsvpResponse,
  data: PublicRsvpResponseData
): Promise<boolean> {
  const updateResult = await prisma.rsvp.updateMany({
    where: {
      id: rsvpId,
      status: expected.status,
      afterPartyStatus: expected.afterPartyStatus,
      comment: expected.comment,
      participationOptionId: expected.participationOptionId,
    },
    data,
  });

  return updateResult.count === 1;
}
