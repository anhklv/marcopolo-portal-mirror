import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "@/__tests__/helpers/mock-prisma";

// next/cache, next/navigation のモック
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    // redirect は例外を投げてフローを中断するため、モックでも同様にする
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

// requireAuth, canAccessCustomer, getScopedCommunityIds のモック
const mockRequireAuth = vi.fn();
const mockCanAccessCustomer = vi.fn();
const mockGetScopedCommunityIds = vi.fn();

vi.mock("@/lib/auth/permissions", () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  canAccessCustomer: (...args: unknown[]) => mockCanAccessCustomer(...args),
  getScopedCommunityIds: (...args: unknown[]) => mockGetScopedCommunityIds(...args),
}));

// repository のモック
const mockRepoCreate = vi.fn();
const mockRepoUpdate = vi.fn();
const mockRepoSoftDelete = vi.fn();
const mockRepoExistsByEmail = vi.fn();
const mockRepoFindAll = vi.fn();

vi.mock("@/lib/repositories/customer.repository", () => ({
  create: (...args: unknown[]) => mockRepoCreate(...args),
  update: (...args: unknown[]) => mockRepoUpdate(...args),
  softDelete: (...args: unknown[]) => mockRepoSoftDelete(...args),
  existsByEmail: (...args: unknown[]) => mockRepoExistsByEmail(...args),
  findAll: (...args: unknown[]) => mockRepoFindAll(...args),
}));

import {
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
  exportCustomersAction,
} from "@/lib/actions/customer.actions";

// テストデータ
const validFormData = {
  firstName: "田中",
  lastName: "太郎",
  email: "tanaka@example.com",
  communities: [{ communityId: 1, joinedAt: "2024-04-01" }],
};

const superSession = {
  user: { id: "1", role: "super", firstName: "管理", lastName: "太郎", email: "admin@example.com" },
};

const communityAdminSession = {
  user: { id: "2", role: "community_admin", firstName: "監査", lastName: "一郎", email: "kansa@example.com" },
};

function setupSuperAdmin() {
  mockRequireAuth.mockResolvedValue(superSession);
  mockPrisma.admin.findUnique.mockResolvedValue({
    id: 1,
    role: "super",
    adminCommunities: [],
  });
  mockGetScopedCommunityIds.mockResolvedValue([1, 2, 3]);
}

function setupCommunityAdmin(scopedIds: number[] = [1]) {
  mockRequireAuth.mockResolvedValue(communityAdminSession);
  mockPrisma.admin.findUnique.mockResolvedValue({
    id: 2,
    role: "community_admin",
    adminCommunities: scopedIds.map((id) => ({ communityId: id })),
  });
  mockGetScopedCommunityIds.mockResolvedValue(scopedIds);
}

describe("createCustomerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: 有効なデータ → create 呼び出し → redirect", async () => {
    setupSuperAdmin();
    mockRepoExistsByEmail.mockResolvedValue(false);
    mockRepoCreate.mockResolvedValue({ id: 1 });

    await expect(createCustomerAction(validFormData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRepoCreate).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith("/admin/customers");
  });

  it("異常系: 未認証 → エラー", async () => {
    mockRequireAuth.mockRejectedValue(new Error("認証が必要です"));

    await expect(createCustomerAction(validFormData)).rejects.toThrow("認証が必要です");
  });

  it("異常系: バリデーションエラー（firstName 空）→ fieldErrors 返却", async () => {
    setupSuperAdmin();

    const result = await createCustomerAction({
      ...validFormData,
      firstName: "",
    });

    expect(result).toHaveProperty("fieldErrors");
    expect(result?.fieldErrors).toHaveProperty("firstName");
  });

  it("異常系: メールアドレス重複（existsByEmail）→ error 返却", async () => {
    setupSuperAdmin();
    mockRepoExistsByEmail.mockResolvedValue(true);

    const result = await createCustomerAction(validFormData);

    expect(result).toEqual({ error: "このメールアドレスは既に登録されています" });
  });

  it("異常系: メールアドレス重複（Prisma P2002）→ error 返却", async () => {
    setupSuperAdmin();
    mockRepoExistsByEmail.mockResolvedValue(false);
    mockRepoCreate.mockRejectedValue({ code: "P2002" });

    const result = await createCustomerAction(validFormData);

    expect(result).toEqual({ error: "このメールアドレスは既に登録されています" });
  });

  it("異常系: community_admin がスコープ外コミュニティIDを指定 → エラー", async () => {
    setupCommunityAdmin([1]);

    const result = await createCustomerAction({
      ...validFormData,
      communities: [{ communityId: 99 }],
    });

    expect(result).toEqual({ error: "権限のないコミュニティが含まれています" });
  });

  it("正常系: community_admin がスコープ内コミュニティIDを指定 → 成功", async () => {
    setupCommunityAdmin([1]);
    mockRepoExistsByEmail.mockResolvedValue(false);
    mockRepoCreate.mockResolvedValue({ id: 1 });

    await expect(
      createCustomerAction({
        ...validFormData,
        communities: [{ communityId: 1 }],
      })
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRepoCreate).toHaveBeenCalled();
  });
});

describe("updateCustomerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: 有効なデータ → canAccessCustomer → update → redirect", async () => {
    setupSuperAdmin();
    mockCanAccessCustomer.mockResolvedValue(true);
    mockRepoExistsByEmail.mockResolvedValue(false);
    mockRepoUpdate.mockResolvedValue({ id: 1 });

    await expect(updateCustomerAction(1, validFormData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mockCanAccessCustomer).toHaveBeenCalled();
    expect(mockRepoUpdate).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith("/admin/customers/1");
  });

  it("異常系: アクセス権なし（canAccessCustomer=false）→ エラー", async () => {
    setupCommunityAdmin([1]);
    mockCanAccessCustomer.mockResolvedValue(false);

    const result = await updateCustomerAction(1, validFormData);

    expect(result).toEqual({ error: "この顧客へのアクセス権がありません" });
  });

  it("異常系: バリデーションエラー → fieldErrors 返却", async () => {
    setupSuperAdmin();
    mockCanAccessCustomer.mockResolvedValue(true);

    const result = await updateCustomerAction(1, {
      ...validFormData,
      lastName: "",
    });

    expect(result).toHaveProperty("fieldErrors");
  });

  it("異常系: メールアドレス重複（他の顧客と競合）→ error 返却", async () => {
    setupSuperAdmin();
    mockCanAccessCustomer.mockResolvedValue(true);
    mockRepoExistsByEmail.mockResolvedValue(true);

    const result = await updateCustomerAction(1, validFormData);

    expect(result).toEqual({ error: "このメールアドレスは既に登録されています" });
  });

  it("異常系: Prisma P2002 unique制約違反 → エラー", async () => {
    setupSuperAdmin();
    mockCanAccessCustomer.mockResolvedValue(true);
    mockRepoExistsByEmail.mockResolvedValue(false);
    mockRepoUpdate.mockRejectedValue({ code: "P2002" });

    const result = await updateCustomerAction(1, validFormData);

    expect(result).toEqual({ error: "このメールアドレスは既に登録されています" });
  });

  it("正常系: 自身のメールアドレスは重複チェックから除外", async () => {
    setupSuperAdmin();
    mockCanAccessCustomer.mockResolvedValue(true);
    mockRepoExistsByEmail.mockResolvedValue(false);
    mockRepoUpdate.mockResolvedValue({ id: 1 });

    await expect(updateCustomerAction(1, validFormData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRepoExistsByEmail).toHaveBeenCalledWith(validFormData.email, 1);
  });

  it("異常系: community_admin がスコープ外コミュニティIDを紐付け → エラー", async () => {
    setupCommunityAdmin([1]);
    mockCanAccessCustomer.mockResolvedValue(true);
    mockRepoExistsByEmail.mockResolvedValue(false);

    const result = await updateCustomerAction(1, {
      ...validFormData,
      communities: [{ communityId: 99 }],
    });

    expect(result).toEqual({ error: "権限のないコミュニティが含まれています" });
  });
});

describe("deleteCustomerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: softDelete → redirect", async () => {
    setupSuperAdmin();
    mockCanAccessCustomer.mockResolvedValue(true);
    mockRepoSoftDelete.mockResolvedValue({ id: 1 });

    await expect(deleteCustomerAction(1)).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRepoSoftDelete).toHaveBeenCalledWith(1);
    expect(mockRedirect).toHaveBeenCalledWith("/admin/customers");
  });

  it("異常系: アクセス権なし → エラー", async () => {
    setupCommunityAdmin([1]);
    mockCanAccessCustomer.mockResolvedValue(false);

    const result = await deleteCustomerAction(1);

    expect(result).toEqual({ error: "この顧客へのアクセス権がありません" });
  });

  it("異常系: 未認証 → エラー", async () => {
    mockRequireAuth.mockRejectedValue(new Error("認証が必要です"));

    await expect(deleteCustomerAction(1)).rejects.toThrow("認証が必要です");
  });
});

describe("exportCustomersAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: CSV文字列が生成される（BOM付き確認）", async () => {
    setupSuperAdmin();
    mockRepoFindAll.mockResolvedValue([
      {
        id: 1,
        firstName: "太郎",
        lastName: "田中",
        firstNameKana: "タロウ",
        lastNameKana: "タナカ",
        email: "tanaka@example.com",
        company: "テスト株式会社",
        memberCategory: "member",
        registeredAt: new Date("2024-01-15"),
        customerCommunities: [
          { community: { name: "ベンチャー監査役の会" } },
        ],
      },
    ]);

    const result = await exportCustomersAction();

    expect(result).toHaveProperty("csv");
    const csv = (result as { csv: string }).csv;
    // BOM確認
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    // ヘッダー行
    expect(csv).toContain("ID,姓,名,セイ,メイ");
    // データ行
    expect(csv).toContain("田中");
    expect(csv).toContain("太郎");
    expect(csv).toContain("2024/01/15");
  });

  it("正常系: scopedCommunityIds が正しく適用される", async () => {
    setupCommunityAdmin([1]);
    mockRepoFindAll.mockResolvedValue([]);

    await exportCustomersAction();

    expect(mockRepoFindAll).toHaveBeenCalledWith(
      [1],
      false,
      expect.objectContaining({ includeNonMember: false })
    );
  });

  it("正常系: フィルタ条件が Repository に渡される", async () => {
    setupSuperAdmin();
    mockRepoFindAll.mockResolvedValue([]);

    await exportCustomersAction({ keyword: "テスト", premiumOnly: true });

    expect(mockRepoFindAll).toHaveBeenCalledWith(
      [1, 2, 3],
      true,
      expect.objectContaining({ keyword: "テスト", premiumOnly: true })
    );
  });
});
