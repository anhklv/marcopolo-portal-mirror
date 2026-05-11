import { prisma } from "@/lib/prisma";
import type {
  Admin,
  AdminCommunity,
  Community,
  AdminRole,
} from "@/lib/generated/prisma";
import bcrypt from "bcryptjs";

// ============================================================
// 型定義
// ============================================================

export type AdminWithCommunities = Admin & {
  adminCommunities: (AdminCommunity & {
    community: Community;
  })[];
};

export interface AdminCreateData {
  lastName: string;
  firstName: string;
  email: string;
  password: string;
  role: AdminRole;
  communityIds?: number[];
}

export interface AdminUpdateData {
  lastName: string;
  firstName: string;
  email: string;
  role: AdminRole;
  communityIds?: number[];
}

// ============================================================
// Repository関数
// ============================================================

const adminInclude = {
  adminCommunities: {
    include: {
      community: true,
    },
  },
} as const;

/**
 * 全管理者取得（ID昇順）
 */
export async function findAll(): Promise<AdminWithCommunities[]> {
  return prisma.admin.findMany({
    include: adminInclude,
    orderBy: { id: "asc" },
  });
}

/**
 * ID指定で管理者1件取得
 */
export async function findById(
  id: number
): Promise<AdminWithCommunities | null> {
  return prisma.admin.findUnique({
    where: { id },
    include: adminInclude,
  });
}

/**
 * 管理者新規作成（Admin + AdminCommunity をトランザクション）
 */
export async function create(data: AdminCreateData): Promise<Admin> {
  const passwordHash = await bcrypt.hash(data.password, 10);

  return prisma.$transaction(async (tx) => {
    const admin = await tx.admin.create({
      data: {
        lastName: data.lastName,
        firstName: data.firstName,
        email: data.email,
        passwordHash,
        role: data.role,
      },
    });

    if (data.communityIds && data.communityIds.length > 0) {
      await tx.adminCommunity.createMany({
        data: data.communityIds.map((communityId) => ({
          adminId: admin.id,
          communityId,
        })),
      });
    }

    return admin;
  });
}

/**
 * 管理者更新（Admin更新 + AdminCommunity全削除→再作成）
 */
export async function update(
  id: number,
  data: AdminUpdateData
): Promise<Admin> {
  return prisma.$transaction(async (tx) => {
    const admin = await tx.admin.update({
      where: { id },
      data: {
        lastName: data.lastName,
        firstName: data.firstName,
        email: data.email,
        role: data.role,
      },
    });

    await tx.adminCommunity.deleteMany({
      where: { adminId: id },
    });

    if (data.communityIds && data.communityIds.length > 0) {
      await tx.adminCommunity.createMany({
        data: data.communityIds.map((communityId) => ({
          adminId: id,
          communityId,
        })),
      });
    }

    return admin;
  });
}

/**
 * 管理者物理削除（AdminCommunity → Admin）
 * ensureMinSuperCount を指定すると、SERIALIZABLE トランザクション内で
 * super管理者数を確認し、指定数以下なら削除を中止する。
 * 同時実行時はPostgreSQLがシリアライゼーション失敗を検出する。
 */
export async function deleteById(
  id: number,
  opts?: { ensureMinSuperCount?: number }
): Promise<Admin> {
  const needsSerializable = opts?.ensureMinSuperCount != null;

  return prisma.$transaction(
    async (tx) => {
      if (needsSerializable) {
        const superCount = await tx.admin.count({
          where: { role: "super" },
        });
        if (superCount <= opts!.ensureMinSuperCount!) {
          throw new LastSuperAdminError();
        }
      }

      await tx.adminCommunity.deleteMany({
        where: { adminId: id },
      });

      return tx.admin.delete({
        where: { id },
      });
    },
    needsSerializable ? { isolationLevel: "Serializable" } : undefined
  );
}

export class LastSuperAdminError extends Error {
  constructor() {
    super("最後の特権管理者は削除できません");
    this.name = "LastSuperAdminError";
  }
}

/**
 * ロール別の管理者数を取得
 */
export async function countByRole(role: AdminRole): Promise<number> {
  return prisma.admin.count({
    where: { role },
  });
}

/**
 * メールアドレス重複チェック
 */
export async function existsByEmail(
  email: string,
  idToExclude?: number
): Promise<boolean> {
  const count = await prisma.admin.count({
    where: {
      email,
      id: idToExclude ? { not: idToExclude } : undefined,
    },
  });
  return count > 0;
}
