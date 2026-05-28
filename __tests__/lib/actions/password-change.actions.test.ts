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

// bcryptjs のモック
const mockBcryptCompare = vi.fn();
vi.mock("bcryptjs", () => ({
  default: {
    compare: (...args: unknown[]) => mockBcryptCompare(...args),
    hash: vi.fn().mockResolvedValue("hashed_password"),
  },
}));

// repository のモック
const mockRepoFindById = vi.fn();
const mockRepoUpdatePassword = vi.fn();

vi.mock("@/lib/repositories/admin.repository", () => ({
  findById: (...args: unknown[]) => mockRepoFindById(...args),
  updatePassword: (...args: unknown[]) => mockRepoUpdatePassword(...args),
  existsByEmail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  deleteById: vi.fn(),
  LastSuperAdminError: class extends Error {
    constructor() {
      super("最後の特権管理者は削除できません");
      this.name = "LastSuperAdminError";
    }
  },
}));

import { changePasswordAction } from "@/lib/actions/admin.actions";

// テストデータ
const validFormData = {
  currentPassword: "oldpassword12",
  newPassword: "newpassword123",
  newPasswordConfirm: "newpassword123",
};

function setupSuperAdmin(id = 1) {
  mockRequireAuthenticatedAdmin.mockResolvedValue({
    admin: { id, role: "super", adminCommunities: [] },
    isSuper: true,
    scopedCommunityIds: [1, 2, 3],
  });
}

function setupCommunityAdmin(id = 2) {
  mockRequireAuthenticatedAdmin.mockResolvedValue({
    admin: {
      id,
      role: "community_admin",
      adminCommunities: [{ communityId: 1 }],
    },
    isSuper: false,
    scopedCommunityIds: [1],
  });
}

// ============================================================
// changePasswordAction
// ============================================================
describe("changePasswordAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: パスワード変更成功でリダイレクトする", async () => {
    setupSuperAdmin(1);
    mockRepoFindById.mockResolvedValue({
      id: 1,
      passwordHash: "hashed_old_password",
    });
    mockBcryptCompare.mockResolvedValue(true);
    mockRepoUpdatePassword.mockResolvedValue(undefined);

    await expect(changePasswordAction(validFormData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/customers"
    );
    expect(mockRepoUpdatePassword).toHaveBeenCalledWith(1, "newpassword123");
  });

  it("正常系: community_adminもパスワード変更可能", async () => {
    setupCommunityAdmin(2);
    mockRepoFindById.mockResolvedValue({
      id: 2,
      passwordHash: "hashed_old_password",
    });
    mockBcryptCompare.mockResolvedValue(true);
    mockRepoUpdatePassword.mockResolvedValue(undefined);

    await expect(changePasswordAction(validFormData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/customers"
    );
    expect(mockRepoUpdatePassword).toHaveBeenCalledWith(2, "newpassword123");
  });

  it("異常系: バリデーションエラー（12文字未満）", async () => {
    setupSuperAdmin(1);

    const result = await changePasswordAction({
      currentPassword: "oldpassword12",
      newPassword: "short",
      newPasswordConfirm: "short",
    });

    expect(result).toHaveProperty("fieldErrors");
    expect(result?.fieldErrors?.["newPassword"]).toBeDefined();
    expect(mockRepoFindById).not.toHaveBeenCalled();
  });

  it("異常系: 現在のパスワードが不正", async () => {
    setupSuperAdmin(1);
    mockRepoFindById.mockResolvedValue({
      id: 1,
      passwordHash: "hashed_old_password",
    });
    mockBcryptCompare.mockResolvedValue(false);

    const result = await changePasswordAction(validFormData);

    expect(result).toEqual({
      fieldErrors: { currentPassword: ["現在のパスワードが正しくありません"] },
    });
    expect(mockRepoUpdatePassword).not.toHaveBeenCalled();
  });

it("異常系: 管理者が見つからない", async () => {
    setupSuperAdmin(1);
    mockRepoFindById.mockResolvedValue(null);

    const result = await changePasswordAction(validFormData);

    expect(result).toEqual({ error: "管理者が見つかりません" });
    expect(mockRepoUpdatePassword).not.toHaveBeenCalled();
  });
});
