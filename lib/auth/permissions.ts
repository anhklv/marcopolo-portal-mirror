import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * 権限チェックで使用する管理者情報
 */
export interface AdminForPermission {
  id: number;
  role: "super" | "community_admin";
  adminCommunities: { communityId: number }[];
}

/**
 * 認証済み管理者情報（共通の戻り値型）
 */
export interface AuthenticatedAdmin {
  admin: AdminForPermission;
  isSuper: boolean;
  scopedCommunityIds: number[];
}

/**
 * 認証済み管理者の情報を一括取得（Server Component用）
 * 未認証またはadminが見つからない場合はログインページにリダイレクト
 */
export async function getAuthenticatedAdmin(): Promise<AuthenticatedAdmin> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/admin/login");
  }

  const adminId = Number(session.user.id);
  if (isNaN(adminId)) {
    redirect("/admin/login");
  }
  const dbAdmin = await prisma.admin.findUnique({
    where: { id: adminId },
    include: { adminCommunities: { select: { communityId: true } } },
  });

  if (!dbAdmin) {
    redirect("/admin/login");
  }

  const admin: AdminForPermission = {
    id: dbAdmin.id,
    role: dbAdmin.role,
    adminCommunities: dbAdmin.adminCommunities,
  };

  const isSuper = dbAdmin.role === "super";
  const scopedCommunityIds = await getScopedCommunityIds(admin);

  return { admin, isSuper, scopedCommunityIds };
}

/**
 * 認証済み管理者の情報を一括取得（Server Action用）
 * 未認証または管理者が見つからない場合は例外をスロー
 */
export async function requireAuthenticatedAdmin(): Promise<AuthenticatedAdmin> {
  const session = await requireAuth();
  const adminId = Number(session.user.id);
  if (isNaN(adminId)) {
    throw new Error("管理者IDが不正です");
  }

  const dbAdmin = await prisma.admin.findUnique({
    where: { id: adminId },
    include: { adminCommunities: { select: { communityId: true } } },
  });

  if (!dbAdmin) {
    throw new Error("管理者が見つかりません");
  }

  const admin: AdminForPermission = {
    id: dbAdmin.id,
    role: dbAdmin.role,
    adminCommunities: dbAdmin.adminCommunities,
  };
  const isSuper = dbAdmin.role === "super";
  const scopedCommunityIds = await getScopedCommunityIds(admin);

  return { admin, isSuper, scopedCommunityIds };
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
