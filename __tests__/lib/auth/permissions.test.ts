import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../../helpers/mock-prisma";

// next-auth の auth() をモック
vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth/auth";
import type { Session } from "next-auth";
import {
  getScopedCommunityIds,
  canAccessCustomer,
  canAccessEvent,
  canManageSurvey,
  requireAuth,
  requireSuper,
  type AdminForPermission,
} from "@/lib/auth/permissions";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn<() => Promise<Session | null>>>;

// テスト用の管理者データ
const superAdmin: AdminForPermission = {
  id: 1,
  role: "super",
  adminCommunities: [],
};

const communityAdmin: AdminForPermission = {
  id: 2,
  role: "community_admin",
  adminCommunities: [{ communityId: 1 }, { communityId: 2 }],
};

const communityAdminNoScope: AdminForPermission = {
  id: 3,
  role: "community_admin",
  adminCommunities: [],
};

describe("getScopedCommunityIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("super → 全コミュニティIDを返す", async () => {
    mockPrisma.community.findMany.mockResolvedValue([
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
    ]);

    const ids = await getScopedCommunityIds(superAdmin);
    expect(ids).toEqual([1, 2, 3, 4]);
  });

  it("community_admin → 紐づきIDのみ返す", async () => {
    const ids = await getScopedCommunityIds(communityAdmin);
    expect(ids).toEqual([1, 2]);
  });

  it("community_admin (0件) → 空配列を返す", async () => {
    const ids = await getScopedCommunityIds(communityAdminNoScope);
    expect(ids).toEqual([]);
  });
});

describe("canAccessCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("super → 常にtrue", async () => {
    const result = await canAccessCustomer(superAdmin, 1);
    expect(result).toBe(true);
  });

  it("community_admin スコープ内 → true", async () => {
    mockPrisma.customerCommunity.findFirst.mockResolvedValue({
      id: 1,
      customerId: 1,
      communityId: 1,
    });

    const result = await canAccessCustomer(communityAdmin, 1);
    expect(result).toBe(true);
  });

  it("community_admin スコープ外 → false", async () => {
    mockPrisma.customerCommunity.findFirst.mockResolvedValue(null);

    const result = await canAccessCustomer(communityAdmin, 99);
    expect(result).toBe(false);
  });

  it("community_admin (スコープ0件) → false", async () => {
    const result = await canAccessCustomer(communityAdminNoScope, 1);
    expect(result).toBe(false);
  });
});

describe("canAccessEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("super → 常にtrue", async () => {
    const result = await canAccessEvent(superAdmin, 1);
    expect(result).toBe(true);
  });

  it("community_admin スコープ内 → true", async () => {
    mockPrisma.event.findFirst.mockResolvedValue({
      id: 1,
      communityId: 1,
    });

    const result = await canAccessEvent(communityAdmin, 1);
    expect(result).toBe(true);
  });

  it("community_admin スコープ外 → false", async () => {
    mockPrisma.event.findFirst.mockResolvedValue(null);

    const result = await canAccessEvent(communityAdmin, 99);
    expect(result).toBe(false);
  });
});

describe("canManageSurvey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("スコープ内 + has_survey=true → true", async () => {
    mockPrisma.event.findFirst.mockResolvedValue({
      id: 1,
      communityId: 1,
      community: { id: 1, hasSurvey: true },
    });

    const result = await canManageSurvey(communityAdmin, 1);
    expect(result).toBe(true);
  });

  it("スコープ内 + has_survey=false → false（superでも）", async () => {
    mockPrisma.event.findFirst.mockResolvedValue({
      id: 2,
      communityId: 2,
      community: { id: 2, hasSurvey: false },
    });

    const result = await canManageSurvey(superAdmin, 2);
    expect(result).toBe(false);
  });

  it("スコープ外 + has_survey=true → false", async () => {
    mockPrisma.event.findFirst.mockResolvedValue({
      id: 3,
      communityId: 3,
      community: { id: 3, hasSurvey: true },
    });

    const result = await canManageSurvey(communityAdmin, 3);
    expect(result).toBe(false);
  });

  it("存在しないイベント → false", async () => {
    mockPrisma.event.findFirst.mockResolvedValue(null);

    const result = await canManageSurvey(superAdmin, 999);
    expect(result).toBe(false);
  });
});

describe("requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未認証 → 例外", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireAuth()).rejects.toThrow("認証が必要です");
  });

  it("認証済み → セッション返却", async () => {
    const session = {
      user: { id: "1", role: "super" as const, firstName: "太郎", lastName: "管理", email: "admin@example.com" },
      expires: "",
    };
    mockAuth.mockResolvedValue(session);
    const result = await requireAuth();
    expect(result.user.id).toBe("1");
  });
});

describe("requireSuper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未認証 → 例外", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireSuper()).rejects.toThrow("認証が必要です");
  });

  it("community_admin → 権限不足で例外", async () => {
    const session = {
      user: { id: "2", role: "community_admin" as const, firstName: "花子", lastName: "運営", email: "community@example.com" },
      expires: "",
    };
    mockAuth.mockResolvedValue(session);
    await expect(requireSuper()).rejects.toThrow("特権管理者の権限が必要です");
  });

  it("super → セッション返却", async () => {
    const session = {
      user: { id: "1", role: "super" as const, firstName: "太郎", lastName: "管理", email: "admin@example.com" },
      expires: "",
    };
    mockAuth.mockResolvedValue(session);
    const result = await requireSuper();
    expect(result.user.role).toBe("super");
  });
});
