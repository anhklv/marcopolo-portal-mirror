import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import type { EventDisplayStatus } from "@/lib/constants/event";

/**
 * 権限チェックで使用する管理者情報
 */
export interface AdminForPermission {
  id: number;
  role: "super" | "community_admin";
  adminCommunities: { communityId: number }[];
}

/**
 * セッション取得
 */
export async function getSession() {
  return auth();
}

/**
 * 認証必須（未認証で例外）
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("認証が必要です");
  }
  return session;
}

/**
 * super権限必須
 */
export async function requireSuper() {
  const session = await requireAuth();
  if (session.user.role !== "super") {
    throw new Error("特権管理者の権限が必要です");
  }
  return session;
}

/**
 * スコープ内コミュニティID取得
 * - super: 全コミュニティID
 * - community_admin: 紐づきコミュニティIDのみ
 */
export async function getScopedCommunityIds(
  admin: AdminForPermission
): Promise<number[]> {
  if (admin.role === "super") {
    const communities = await prisma.community.findMany({
      select: { id: true },
    });
    return communities.map((c) => c.id);
  }
  return admin.adminCommunities.map((ac) => ac.communityId);
}

/**
 * 顧客アクセス権判定
 * - super: 常にtrue
 * - community_admin: 顧客がスコープ内コミュニティに所属していればtrue
 */
export async function canAccessCustomer(
  admin: AdminForPermission,
  customerId: number
): Promise<boolean> {
  if (admin.role === "super") {
    return true;
  }

  const scopedIds = await getScopedCommunityIds(admin);
  if (scopedIds.length === 0) {
    return false;
  }

  const membership = await prisma.customerCommunity.findFirst({
    where: {
      customerId,
      communityId: { in: scopedIds },
      customer: { deletedAt: null },
    },
  });

  return !!membership;
}

/**
 * イベントアクセス権判定
 * - super: 常にtrue
 * - community_admin: イベントがスコープ内コミュニティに属していればtrue
 */
export async function canAccessEvent(
  admin: AdminForPermission,
  eventId: number
): Promise<boolean> {
  if (admin.role === "super") {
    return true;
  }

  const scopedIds = await getScopedCommunityIds(admin);
  if (scopedIds.length === 0) {
    return false;
  }

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      communityId: { in: scopedIds },
      deletedAt: null,
    },
  });

  return !!event;
}

/**
 * アンケート操作権判定
 * - スコープチェック + has_surveyチェック
 * - superでもhas_survey=falseなら操作不可
 */
export async function canManageSurvey(
  admin: AdminForPermission,
  eventId: number
): Promise<boolean> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    include: { community: true },
  });

  if (!event) {
    return false;
  }

  // has_survey チェック（superでも必須）
  if (!event.community.hasSurvey) {
    return false;
  }

  // スコープチェック
  if (admin.role === "super") {
    return true;
  }

  const scopedIds = await getScopedCommunityIds(admin);
  return scopedIds.includes(event.communityId);
}

/**
 * イベント状態の前提条件確認
 * - receiving: 回答期限前 + 未停止
 * - waiting: 回答期限後〜開催日前
 * - closed: 開催日後
 * - paused: isPaused=true
 */
export function checkEventStatus(event: {
  date: Date;
  responseDeadline: Date | null;
  isPaused: boolean;
}): EventDisplayStatus {
  const now = new Date();

  if (event.isPaused) {
    return "paused";
  }

  if (event.date <= now) {
    return "closed";
  }

  if (event.responseDeadline && event.responseDeadline <= now) {
    return "waiting";
  }

  return "receiving";
}
