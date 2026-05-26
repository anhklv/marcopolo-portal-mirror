import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/__tests__/helpers/mock-prisma";
import {
  findAll,
  findById,
  create,
  update,
  deleteById,
  countByRole,
  existsByEmail,
  LastSuperAdminError,
} from "@/lib/repositories/admin.repository";

// テスト用データ
const makeCommunity = (id: number, code: string, name: string) => ({
  id,
  code,
  name,
  hasSurvey: false,
  sortOrder: id,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const makeAdmin = (overrides = {}) => ({
  id: 1,
  lastName: "管理",
  firstName: "太郎",
  email: "admin@example.com",
  passwordHash: "$2a$10$hashedpassword",
  role: "super" as const,
  lastLoginAt: new Date("2026-01-15T10:00:00Z"),
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  adminCommunities: [],
  ...overrides,
});

const makeAdminCommunity = (adminId: number, communityId: number) => ({
  id: adminId * 10 + communityId,
  adminId,
  communityId,
  createdAt: new Date(),
  community: makeCommunity(communityId, `community_${communityId}`, `コミュニティ${communityId}`),
});

describe("admin.repository", () => {
  beforeEach(() => {
    Object.values(mockPrisma).forEach((model) => {
      if (typeof model === "object" && model !== null) {
        Object.values(model).forEach((fn) => {
          if (typeof fn === "function" && "mockReset" in fn) {
            (fn as ReturnType<typeof import("vitest").vi.fn>).mockReset();
          }
        });
      }
    });
  });

  // ============================================================
  // findAll
  // ============================================================
  describe("findAll", () => {
    it("正常系: 全管理者をID昇順で取得する", async () => {
      const admins = [makeAdmin({ id: 1 }), makeAdmin({ id: 2, email: "admin2@example.com" })];
      mockPrisma.admin.findMany.mockResolvedValue(admins);

      const result = await findAll();

      expect(mockPrisma.admin.findMany).toHaveBeenCalledWith({
        include: {
          adminCommunities: {
            include: { community: true },
          },
        },
        orderBy: { id: "asc" },
      });
      expect(result).toEqual(admins);
    });
  });

  // ============================================================
  // findById
  // ============================================================
  describe("findById", () => {
    it("正常系: 存在するIDの場合、管理者データを返す", async () => {
      const admin = makeAdmin();
      mockPrisma.admin.findUnique.mockResolvedValue(admin);

      const result = await findById(1);

      expect(mockPrisma.admin.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          adminCommunities: {
            include: { community: true },
          },
        },
      });
      expect(result).toEqual(admin);
    });

    it("正常系: 存在しないIDの場合、nullを返す", async () => {
      mockPrisma.admin.findUnique.mockResolvedValue(null);

      const result = await findById(999);

      expect(result).toBeNull();
    });
  });

  // ============================================================
  // create
  // ============================================================
  describe("create", () => {
    it("正常系: Admin + AdminCommunityが作成される", async () => {
      const createdAdmin = makeAdmin({ id: 10 });

      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        return fn(mockPrisma);
      });
      mockPrisma.admin.create.mockResolvedValue(createdAdmin);
      mockPrisma.adminCommunity.createMany.mockResolvedValue({ count: 2 });

      const result = await create({
        lastName: "管理",
        firstName: "太郎",
        email: "admin@example.com",
        password: "password1234",
        role: "community_admin",
        communityIds: [1, 2],
      });

      expect(result).toEqual(createdAdmin);
      expect(mockPrisma.admin.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          lastName: "管理",
          firstName: "太郎",
          email: "admin@example.com",
          role: "community_admin",
        }),
      });
      expect(mockPrisma.adminCommunity.createMany).toHaveBeenCalledWith({
        data: [
          { adminId: 10, communityId: 1 },
          { adminId: 10, communityId: 2 },
        ],
      });
    });

    it("正常系: superの場合、AdminCommunityは作成されない", async () => {
      const createdAdmin = makeAdmin({ id: 10 });

      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        return fn(mockPrisma);
      });
      mockPrisma.admin.create.mockResolvedValue(createdAdmin);

      await create({
        lastName: "管理",
        firstName: "太郎",
        email: "admin@example.com",
        password: "password1234",
        role: "super",
      });

      expect(mockPrisma.adminCommunity.createMany).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // update
  // ============================================================
  describe("update", () => {
    it("正常系: Admin更新 + AdminCommunity全削除→再作成される", async () => {
      const updatedAdmin = makeAdmin({
        id: 1,
        adminCommunities: [makeAdminCommunity(1, 2)],
      });

      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        return fn(mockPrisma);
      });
      mockPrisma.admin.update.mockResolvedValue(updatedAdmin);
      mockPrisma.adminCommunity.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.adminCommunity.createMany.mockResolvedValue({ count: 1 });

      const result = await update(1, {
        lastName: "更新",
        firstName: "太郎",
        email: "updated@example.com",
        role: "community_admin",
        communityIds: [2],
      });

      expect(result).toEqual(updatedAdmin);
      expect(mockPrisma.admin.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          lastName: "更新",
          firstName: "太郎",
          email: "updated@example.com",
          role: "community_admin",
        },
      });
      expect(mockPrisma.adminCommunity.deleteMany).toHaveBeenCalledWith({
        where: { adminId: 1 },
      });
      expect(mockPrisma.adminCommunity.createMany).toHaveBeenCalledWith({
        data: [{ adminId: 1, communityId: 2 }],
      });
    });
  });

  // ============================================================
  // deleteById
  // ============================================================
  describe("deleteById", () => {
    it("正常系: AdminCommunity + Adminが物理削除される", async () => {
      const deletedAdmin = makeAdmin({ id: 1 });

      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        return fn(mockPrisma);
      });
      mockPrisma.adminCommunity.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.admin.delete.mockResolvedValue(deletedAdmin);

      const result = await deleteById(1);

      expect(result).toEqual(deletedAdmin);
      expect(mockPrisma.adminCommunity.deleteMany).toHaveBeenCalledWith({
        where: { adminId: 1 },
      });
      expect(mockPrisma.admin.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("正常系: ensureMinSuperCountオプション付きでsuper管理者が十分な場合、削除される", async () => {
      const deletedAdmin = makeAdmin({ id: 2 });

      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        return fn(mockPrisma);
      });
      mockPrisma.admin.count.mockResolvedValue(3);
      mockPrisma.adminCommunity.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.admin.delete.mockResolvedValue(deletedAdmin);

      const result = await deleteById(2, { ensureMinSuperCount: 1 });

      expect(result).toEqual(deletedAdmin);
      expect(mockPrisma.admin.count).toHaveBeenCalledWith({
        where: { role: "super" },
      });
    });

    it("異常系: ensureMinSuperCountオプション付きで最後のsuperの場合、LastSuperAdminErrorを投げる", async () => {
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        return fn(mockPrisma);
      });
      mockPrisma.admin.count.mockResolvedValue(1);

      await expect(
        deleteById(2, { ensureMinSuperCount: 1 })
      ).rejects.toThrow(LastSuperAdminError);
      expect(mockPrisma.admin.delete).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // countByRole
  // ============================================================
  describe("countByRole", () => {
    it("正常系: 指定ロールの管理者数を返す", async () => {
      mockPrisma.admin.count.mockResolvedValue(2);

      const result = await countByRole("super");

      expect(result).toBe(2);
      expect(mockPrisma.admin.count).toHaveBeenCalledWith({
        where: { role: "super" },
      });
    });
  });

  // ============================================================
  // existsByEmail
  // ============================================================
  describe("existsByEmail", () => {
    it("正常系: 重複ありの場合trueを返す", async () => {
      mockPrisma.admin.count.mockResolvedValue(1);

      const result = await existsByEmail("admin@example.com");

      expect(result).toBe(true);
      expect(mockPrisma.admin.count).toHaveBeenCalledWith({
        where: { email: "admin@example.com", id: undefined },
      });
    });

    it("正常系: 重複なしの場合falseを返す", async () => {
      mockPrisma.admin.count.mockResolvedValue(0);

      const result = await existsByEmail("new@example.com");

      expect(result).toBe(false);
    });

    it("正常系: 自身を除外して重複チェックできる", async () => {
      mockPrisma.admin.count.mockResolvedValue(0);

      await existsByEmail("admin@example.com", 1);

      expect(mockPrisma.admin.count).toHaveBeenCalledWith({
        where: { email: "admin@example.com", id: { not: 1 } },
      });
    });
  });
});
