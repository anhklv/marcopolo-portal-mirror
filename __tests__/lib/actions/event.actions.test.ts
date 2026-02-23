import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "@/__tests__/helpers/mock-prisma";

// next/cache のモック
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// next/navigation のモック
const mockRedirect = vi.fn().mockImplementation(() => {
  throw new Error("NEXT_REDIRECT");
});
vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

// requireAuth, getScopedCommunityIds, canAccessEvent のモック
const mockRequireAuth = vi.fn();
const mockGetScopedCommunityIds = vi.fn();
const mockCanAccessEvent = vi.fn();

vi.mock("@/lib/auth/permissions", () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  getScopedCommunityIds: (...args: unknown[]) => mockGetScopedCommunityIds(...args),
  canAccessEvent: (...args: unknown[]) => mockCanAccessEvent(...args),
}));

// repository のモック
const mockCreateEvent = vi.fn();
const mockUpdateEvent = vi.fn();

vi.mock("@/lib/repositories/event.repository", () => ({
  createEvent: (...args: unknown[]) => mockCreateEvent(...args),
  updateEvent: (...args: unknown[]) => mockUpdateEvent(...args),
}));

import { createEventAction, updateEventAction } from "@/lib/actions/event.actions";

// テストデータ
const validFormData = {
  title: "テストイベント",
  communityId: 1,
  date: "2026-03-01T18:00:00",
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

describe("createEventAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: 有効データ → createEvent呼出 → eventId返却", async () => {
    setupSuperAdmin();
    mockCreateEvent.mockResolvedValue({ id: 42 });

    const result = await createEventAction(validFormData);

    expect(result).toEqual({ success: true, eventId: 42 });
    expect(mockCreateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "テストイベント",
        communityId: 1,
      })
    );
  });

  it("異常系: 未認証 → エラー", async () => {
    mockRequireAuth.mockRejectedValue(new Error("認証が必要です"));

    await expect(createEventAction(validFormData)).rejects.toThrow("認証が必要です");
  });

  it("異常系: title 空 → fieldErrors返却", async () => {
    setupSuperAdmin();

    const result = await createEventAction({
      ...validFormData,
      title: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toHaveProperty("title");
    }
  });

  it("異常系: communityId 未指定 → fieldErrors返却", async () => {
    setupSuperAdmin();

    const result = await createEventAction({
      title: "テストイベント",
      date: "2026-03-01T18:00:00",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toHaveProperty("communityId");
    }
  });

  it("異常系: title 201文字 → fieldErrors返却", async () => {
    setupSuperAdmin();

    const result = await createEventAction({
      ...validFormData,
      title: "あ".repeat(201),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toHaveProperty("title");
    }
  });

  it("異常系: community_admin がスコープ外communityId指定 → エラー", async () => {
    setupCommunityAdmin([1]);

    const result = await createEventAction({
      ...validFormData,
      communityId: 99,
    });

    expect(result).toEqual({
      success: false,
      error: "権限のないコミュニティが指定されています",
    });
  });

  it("正常系: community_admin がスコープ内communityId指定 → 成功", async () => {
    setupCommunityAdmin([1]);
    mockCreateEvent.mockResolvedValue({ id: 10 });

    const result = await createEventAction({
      ...validFormData,
      communityId: 1,
    });

    expect(result).toEqual({ success: true, eventId: 10 });
    expect(mockCreateEvent).toHaveBeenCalled();
  });

  it("正常系: super が任意communityIdで作成可能", async () => {
    setupSuperAdmin();
    mockCreateEvent.mockResolvedValue({ id: 20 });

    const result = await createEventAction({
      ...validFormData,
      communityId: 99,
    });

    expect(result).toEqual({ success: true, eventId: 20 });
  });

  it("正常系: 任意項目がnull/空文字列 → 成功", async () => {
    setupSuperAdmin();
    mockCreateEvent.mockResolvedValue({ id: 30 });

    const result = await createEventAction({
      ...validFormData,
      location: "",
      description: "",
      timetable: "",
      note: "",
      responseDeadline: null,
      allowsOnline: false,
      hasAfterParty: false,
    });

    expect(result).toEqual({ success: true, eventId: 30 });
  });

  it("正常系: responseDeadlineあり → 正常保存", async () => {
    setupSuperAdmin();
    mockCreateEvent.mockResolvedValue({ id: 31 });

    const result = await createEventAction({
      ...validFormData,
      responseDeadline: "2026-02-28T23:59:00",
    });

    expect(result).toEqual({ success: true, eventId: 31 });
    expect(mockCreateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        responseDeadline: expect.any(Date),
      })
    );
  });

  it("異常系: responseDeadline > date → エラー返却", async () => {
    setupSuperAdmin();

    const result = await createEventAction({
      ...validFormData,
      date: "2026-03-01T18:00:00",
      responseDeadline: "2026-03-02T00:00:00",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toHaveProperty("responseDeadline");
    }
  });

  it("成功時に revalidatePath が呼ばれること", async () => {
    setupSuperAdmin();
    mockCreateEvent.mockResolvedValue({ id: 50 });

    await createEventAction(validFormData);

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/events");
  });
});

describe("updateEventAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: 有効データ → updateEvent呼出 → redirect", async () => {
    setupSuperAdmin();
    mockCanAccessEvent.mockResolvedValue(true);
    mockUpdateEvent.mockResolvedValue({ id: 1 });

    await expect(updateEventAction(1, validFormData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mockUpdateEvent).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        title: "テストイベント",
        communityId: 1,
      })
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/events");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/events");
  });

  it("異常系: 未認証 → エラー", async () => {
    mockRequireAuth.mockRejectedValue(new Error("認証が必要です"));

    await expect(updateEventAction(1, validFormData)).rejects.toThrow("認証が必要です");
  });

  it("異常系: アクセス権なし → エラー", async () => {
    setupSuperAdmin();
    mockCanAccessEvent.mockResolvedValue(false);

    const result = await updateEventAction(1, validFormData);

    expect(result).toEqual({
      success: false,
      error: "このイベントへのアクセス権がありません",
    });
  });

  it("異常系: title 空 → fieldErrors返却", async () => {
    setupSuperAdmin();
    mockCanAccessEvent.mockResolvedValue(true);

    const result = await updateEventAction(1, {
      ...validFormData,
      title: "",
    });

    expect(result).toBeDefined();
    if (result && !result.success) {
      expect(result.fieldErrors).toHaveProperty("title");
    }
  });

  it("異常系: community_admin がスコープ外communityId指定 → エラー", async () => {
    setupCommunityAdmin([1]);
    mockCanAccessEvent.mockResolvedValue(true);

    const result = await updateEventAction(1, {
      ...validFormData,
      communityId: 99,
    });

    expect(result).toEqual({
      success: false,
      error: "権限のないコミュニティが指定されています",
    });
  });

  it("正常系: community_admin がスコープ内communityId指定 → 成功", async () => {
    setupCommunityAdmin([1]);
    mockCanAccessEvent.mockResolvedValue(true);
    mockUpdateEvent.mockResolvedValue({ id: 1 });

    await expect(updateEventAction(1, {
      ...validFormData,
      communityId: 1,
    })).rejects.toThrow("NEXT_REDIRECT");

    expect(mockUpdateEvent).toHaveBeenCalled();
  });

  it("正常系: super が任意communityIdで更新可能", async () => {
    setupSuperAdmin();
    mockCanAccessEvent.mockResolvedValue(true);
    mockUpdateEvent.mockResolvedValue({ id: 1 });

    await expect(updateEventAction(1, {
      ...validFormData,
      communityId: 99,
    })).rejects.toThrow("NEXT_REDIRECT");

    expect(mockUpdateEvent).toHaveBeenCalled();
  });

  it("異常系: responseDeadline > date → エラー返却", async () => {
    setupSuperAdmin();
    mockCanAccessEvent.mockResolvedValue(true);

    const result = await updateEventAction(1, {
      ...validFormData,
      date: "2026-03-01T18:00:00",
      responseDeadline: "2026-03-02T00:00:00",
    });

    expect(result).toBeDefined();
    if (result && !result.success) {
      expect(result.fieldErrors).toHaveProperty("responseDeadline");
    }
  });

  it("異常系: DB更新失敗 → エラー返却", async () => {
    setupSuperAdmin();
    mockCanAccessEvent.mockResolvedValue(true);
    mockUpdateEvent.mockRejectedValue(new Error("DB error"));

    const result = await updateEventAction(1, validFormData);

    expect(result).toEqual({
      success: false,
      error: "イベントの更新に失敗しました",
    });
  });

  it("成功時に revalidatePath が呼ばれること", async () => {
    setupSuperAdmin();
    mockCanAccessEvent.mockResolvedValue(true);
    mockUpdateEvent.mockResolvedValue({ id: 1 });

    await expect(updateEventAction(1, validFormData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/events");
  });
});
