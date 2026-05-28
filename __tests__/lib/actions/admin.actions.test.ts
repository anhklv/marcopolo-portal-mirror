import { describe, it, expect, vi, beforeEach } from "vitest";
import "@/__tests__/helpers/mock-prisma";

// next/cache, next/navigation のモック
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

// requireAuthenticatedAdmin のモック
const mockRequireAuthenticatedAdmin = vi.fn();

vi.mock("@/lib/auth/permissions", () => ({
  requireAuthenticatedAdmin: (...args: unknown[]) =>
    mockRequireAuthenticatedAdmin(...args),
}));

// repository のモック
const mockRepoCreate = vi.fn();
const mockRepoUpdate = vi.fn();
const mockRepoDeleteById = vi.fn();
const mockRepoExistsByEmail = vi.fn();
const mockRepoFindById = vi.fn();

vi.mock("@/lib/repositories/admin.repository", async () => {
  class LastSuperAdminError extends Error {
    constructor() {
      super("最後の特権管理者は削除できません");
      this.name = "LastSuperAdminError";
    }
  }
  return {
    create: (...args: unknown[]) => mockRepoCreate(...args),
    update: (...args: unknown[]) => mockRepoUpdate(...args),
    deleteById: (...args: unknown[]) => mockRepoDeleteById(...args),
    existsByEmail: (...args: unknown[]) => mockRepoExistsByEmail(...args),
    findById: (...args: unknown[]) => mockRepoFindById(...args),
    LastSuperAdminError,
  };
});

import {
  createAdminAction,
  updateAdminAction,
  deleteAdminAction,
} from "@/lib/actions/admin.actions";
import { LastSuperAdminError } from "@/lib/repositories/admin.repository";

// テストデータ
const validCreateData = {
  lastName: "管理",
  firstName: "太郎",
  email: "newadmin@example.com",
  password: "password1234",
  passwordConfirm: "password1234",
  role: "community_admin" as const,
  communityIds: [1],
};

const validUpdateData = {
  lastName: "管理",
  firstName: "太郎",
  email: "admin@example.com",
  role: "community_admin" as const,
  communityIds: [1],
};

function setupSuperAdmin(id = 1) {
  mockRequireAuthenticatedAdmin.mockResolvedValue({
    admin: { id, role: "super", adminCommunities: [] },
    isSuper: true,
    scopedCommunityIds: [1, 2, 3],
  });
}

function setupCommunityAdmin() {
  mockRequireAuthenticatedAdmin.mockResolvedValue({
    admin: { id: 2, role: "community_admin", adminCommunities: [{ communityId: 1 }] },
    isSuper: false,
    scopedCommunityIds: [1],
  });
}

// ============================================================
// createAdminAction
// ============================================================
describe("createAdminAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: 有効なデータで管理者が作成され、リダイレクトする", async () => {
    setupSuperAdmin();
    mockRepoExistsByEmail.mockResolvedValue(false);
    mockRepoCreate.mockResolvedValue({ id: 10 });

    await expect(createAdminAction(validCreateData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/admins"
    );
    expect(mockRepoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        lastName: "管理",
        firstName: "太郎",
        email: "newadmin@example.com",
        password: "password1234",
        role: "community_admin",
        communityIds: [1],
      })
    );
  });

  it("異常系: community_adminがアクセスするとエラーを返す", async () => {
    setupCommunityAdmin();

    const result = await createAdminAction(validCreateData);

    expect(result).toEqual({ error: "この操作を実行する権限がありません" });
    expect(mockRepoCreate).not.toHaveBeenCalled();
  });

  it("異常系: バリデーションエラーの場合、fieldErrorsを返す", async () => {
    setupSuperAdmin();

    const invalidData = {
      ...validCreateData,
      email: "invalid-email",
    };

    const result = await createAdminAction(invalidData);

    expect(result).toHaveProperty("fieldErrors");
    expect(mockRepoCreate).not.toHaveBeenCalled();
  });

  it("異常系: メールアドレスが重複している場合、エラーを返す", async () => {
    setupSuperAdmin();
    mockRepoExistsByEmail.mockResolvedValue(true);

    const result = await createAdminAction(validCreateData);

    expect(result).toEqual({
      error: "このメールアドレスは既に登録されています",
    });
    expect(mockRepoCreate).not.toHaveBeenCalled();
  });

  it("異常系: Prisma P2002エラーの場合、メール重複エラーを返す", async () => {
    setupSuperAdmin();
    mockRepoExistsByEmail.mockResolvedValue(false);
    mockRepoCreate.mockRejectedValue({ code: "P2002" });

    const result = await createAdminAction(validCreateData);

    expect(result).toEqual({
      error: "このメールアドレスは既に登録されています",
    });
  });

  it("異常系: パスワードが一致しない場合、fieldErrorsを返す", async () => {
    setupSuperAdmin();

    const data = {
      ...validCreateData,
      passwordConfirm: "differentpassword",
    };

    const result = await createAdminAction(data);

    expect(result).toHaveProperty("fieldErrors");
    expect(result?.fieldErrors?.["passwordConfirm"]).toBeDefined();
  });
});

// ============================================================
// updateAdminAction
// ============================================================
describe("updateAdminAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: 有効なデータで管理者が更新され、リダイレクトする", async () => {
    setupSuperAdmin();
    mockRepoFindById.mockResolvedValue({
      id: 2,
      role: "community_admin",
      adminCommunities: [],
    });
    mockRepoExistsByEmail.mockResolvedValue(false);
    mockRepoUpdate.mockResolvedValue({ id: 2 });

    await expect(updateAdminAction(2, validUpdateData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/admins"
    );
    expect(mockRepoUpdate).toHaveBeenCalledWith(
      2,
      expect.objectContaining({
        lastName: "管理",
        firstName: "太郎",
        email: "admin@example.com",
        role: "community_admin",
        communityIds: [1],
      })
    );
  });

  it("異常系: community_adminがアクセスするとエラーを返す", async () => {
    setupCommunityAdmin();

    const result = await updateAdminAction(2, validUpdateData);

    expect(result).toEqual({ error: "この操作を実行する権限がありません" });
  });

  it("異常系: 対象管理者が存在しない場合、エラーを返す", async () => {
    setupSuperAdmin();
    mockRepoFindById.mockResolvedValue(null);

    const result = await updateAdminAction(999, validUpdateData);

    expect(result).toEqual({ error: "管理者が見つかりません" });
  });

  it("異常系: 特権管理者のroleを変更しようとするとエラーを返す", async () => {
    setupSuperAdmin();
    mockRepoFindById.mockResolvedValue({
      id: 2,
      role: "super",
      adminCommunities: [],
    });

    const data = { ...validUpdateData, role: "community_admin" as const };
    const result = await updateAdminAction(2, data);

    expect(result).toEqual({
      error: "特権管理者の権限は変更できません",
    });
  });

  it("異常系: メールアドレスが重複している場合、エラーを返す", async () => {
    setupSuperAdmin();
    mockRepoFindById.mockResolvedValue({
      id: 2,
      role: "community_admin",
      adminCommunities: [],
    });
    mockRepoExistsByEmail.mockResolvedValue(true);

    const result = await updateAdminAction(2, validUpdateData);

    expect(result).toEqual({
      error: "このメールアドレスは既に登録されています",
    });
  });

  it("異常系: バリデーションエラーの場合、fieldErrorsを返す", async () => {
    setupSuperAdmin();

    const invalidData = { ...validUpdateData, email: "" };
    const result = await updateAdminAction(2, invalidData);

    expect(result).toHaveProperty("fieldErrors");
  });
});

// ============================================================
// deleteAdminAction
// ============================================================
describe("deleteAdminAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: community_admin管理者が削除され、リダイレクトする", async () => {
    setupSuperAdmin(1);
    mockRepoFindById.mockResolvedValue({ id: 2, role: "community_admin" });
    mockRepoDeleteById.mockResolvedValue({ id: 2 });

    await expect(deleteAdminAction(2)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/admins"
    );
    expect(mockRepoDeleteById).toHaveBeenCalledWith(2, undefined);
  });

  it("正常系: super管理者が複数いる場合、他のsuperを削除できる", async () => {
    setupSuperAdmin(1);
    mockRepoFindById.mockResolvedValue({ id: 3, role: "super" });
    mockRepoDeleteById.mockResolvedValue({ id: 3 });

    await expect(deleteAdminAction(3)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/admins"
    );
    expect(mockRepoDeleteById).toHaveBeenCalledWith(3, { ensureMinSuperCount: 1 });
  });

  it("異常系: community_adminがアクセスするとエラーを返す", async () => {
    setupCommunityAdmin();

    const result = await deleteAdminAction(2);

    expect(result).toEqual({ error: "この操作を実行する権限がありません" });
  });

  it("異常系: 自分自身を削除しようとするとエラーを返す", async () => {
    setupSuperAdmin(1);

    const result = await deleteAdminAction(1);

    expect(result).toEqual({
      error: "自分自身を削除することはできません",
    });
  });

  it("異常系: 対象管理者が存在しない場合、エラーを返す", async () => {
    setupSuperAdmin(1);
    mockRepoFindById.mockResolvedValue(null);

    const result = await deleteAdminAction(999);

    expect(result).toEqual({ error: "管理者が見つかりません" });
  });

  it("異常系: 最後の特権管理者を削除しようとするとエラーを返す", async () => {
    setupSuperAdmin(1);
    mockRepoFindById.mockResolvedValue({ id: 3, role: "super" });
    mockRepoDeleteById.mockRejectedValue(new LastSuperAdminError());

    const result = await deleteAdminAction(3);

    expect(result).toEqual({
      error: "最後の特権管理者は削除できません",
    });
  });
});
