import { describe, it, expect, vi, beforeEach } from "vitest";
import "@/__tests__/helpers/mock-prisma";

// next/cache のモック
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// repository のモック
const mockFindRsvpByToken = vi.fn();
const mockUpdateRsvpResponse = vi.fn();

vi.mock("@/lib/repositories/rsvp.repository", () => ({
  findRsvpByToken: (...args: unknown[]) => mockFindRsvpByToken(...args),
  updateRsvpResponse: (...args: unknown[]) => mockUpdateRsvpResponse(...args),
}));

import { submitRsvpAction } from "@/lib/actions/rsvp.actions";

// テストデータ
function createMockRsvpData(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    eventId: 10,
    customerId: 20,
    token: "test-token-123",
    status: "pending",
    event: {
      id: 10,
      deletedAt: null,
      isPaused: false,
      hasAfterParty: false,
      responseDeadline: new Date("2099-12-31T23:59:59Z"),
      date: new Date("2099-12-31T23:59:59Z"),
    },
    customer: {
      id: 20,
      deletedAt: null,
    },
    ...overrides,
  };
}

const validFormData = {
  token: "test-token-123",
  status: "attending" as const,
  afterPartyStatus: null,
  comment: "よろしくお願いします",
};

describe("submitRsvpAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================
  // 正常系
  // =========================================================

  it("正常系: 有効データ → updateRsvpResponse呼出 → success", async () => {
    const rsvpData = createMockRsvpData();
    mockFindRsvpByToken.mockResolvedValue(rsvpData);
    mockUpdateRsvpResponse.mockResolvedValue({});

    const result = await submitRsvpAction(validFormData);

    expect(result).toEqual({ success: true });
    expect(mockFindRsvpByToken).toHaveBeenCalledWith("test-token-123");
    expect(mockUpdateRsvpResponse).toHaveBeenCalledWith(1, {
      status: "attending",
      afterPartyStatus: null,
      comment: "よろしくお願いします",
      respondedAt: expect.any(Date),
    });
  });

  it("正常系: 不参加 → afterPartyStatusがnullでDB更新", async () => {
    const rsvpData = createMockRsvpData({
      event: {
        ...createMockRsvpData().event,
        hasAfterParty: true,
      },
    });
    mockFindRsvpByToken.mockResolvedValue(rsvpData);
    mockUpdateRsvpResponse.mockResolvedValue({});

    const result = await submitRsvpAction({
      token: "test-token-123",
      status: "absent",
      afterPartyStatus: "attending",
    });

    expect(result).toEqual({ success: true });
    expect(mockUpdateRsvpResponse).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        status: "absent",
        afterPartyStatus: null,
      })
    );
  });

  it("正常系: オンライン → afterPartyStatusがnullでDB更新", async () => {
    const rsvpData = createMockRsvpData({
      event: {
        ...createMockRsvpData().event,
        hasAfterParty: true,
      },
    });
    mockFindRsvpByToken.mockResolvedValue(rsvpData);
    mockUpdateRsvpResponse.mockResolvedValue({});

    const result = await submitRsvpAction({
      token: "test-token-123",
      status: "online",
      afterPartyStatus: "attending",
    });

    expect(result).toEqual({ success: true });
    expect(mockUpdateRsvpResponse).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        status: "online",
        afterPartyStatus: null,
      })
    );
  });

  it("正常系: 参加+懇親会参加 → afterPartyStatus=attendingでDB更新", async () => {
    const rsvpData = createMockRsvpData({
      event: {
        ...createMockRsvpData().event,
        hasAfterParty: true,
      },
    });
    mockFindRsvpByToken.mockResolvedValue(rsvpData);
    mockUpdateRsvpResponse.mockResolvedValue({});

    const result = await submitRsvpAction({
      token: "test-token-123",
      status: "attending",
      afterPartyStatus: "attending",
    });

    expect(result).toEqual({ success: true });
    expect(mockUpdateRsvpResponse).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        status: "attending",
        afterPartyStatus: "attending",
      })
    );
  });

  it("正常系: comment省略 → nullでDB更新", async () => {
    const rsvpData = createMockRsvpData();
    mockFindRsvpByToken.mockResolvedValue(rsvpData);
    mockUpdateRsvpResponse.mockResolvedValue({});

    const result = await submitRsvpAction({
      token: "test-token-123",
      status: "attending",
    });

    expect(result).toEqual({ success: true });
    expect(mockUpdateRsvpResponse).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ comment: null })
    );
  });

  it("正常系: revalidatePathが管理画面パスで呼ばれる", async () => {
    const rsvpData = createMockRsvpData();
    mockFindRsvpByToken.mockResolvedValue(rsvpData);
    mockUpdateRsvpResponse.mockResolvedValue({});

    await submitRsvpAction(validFormData);

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/events/10");
  });

  // =========================================================
  // 異常系
  // =========================================================

  it("異常系: バリデーション失敗（status不正値）", async () => {
    const result = await submitRsvpAction({
      token: "test-token-123",
      status: "maybe",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
    expect(mockFindRsvpByToken).not.toHaveBeenCalled();
  });

  it("異常系: トークン無効（findRsvpByTokenがnull）", async () => {
    mockFindRsvpByToken.mockResolvedValue(null);

    const result = await submitRsvpAction(validFormData);

    expect(result).toEqual({ success: false, error: "無効なトークンです" });
  });

  it("異常系: イベント論理削除済み", async () => {
    const rsvpData = createMockRsvpData({
      event: {
        ...createMockRsvpData().event,
        deletedAt: new Date(),
      },
    });
    mockFindRsvpByToken.mockResolvedValue(rsvpData);

    const result = await submitRsvpAction(validFormData);

    expect(result).toEqual({
      success: false,
      error: "このイベントは終了しました",
    });
    expect(mockUpdateRsvpResponse).not.toHaveBeenCalled();
  });

  it("異常系: 顧客論理削除済み", async () => {
    const rsvpData = createMockRsvpData({
      customer: { id: 20, deletedAt: new Date() },
    });
    mockFindRsvpByToken.mockResolvedValue(rsvpData);

    const result = await submitRsvpAction(validFormData);

    expect(result).toEqual({ success: false, error: "アクセスできません" });
    expect(mockUpdateRsvpResponse).not.toHaveBeenCalled();
  });

  it("異常系: isPaused=true", async () => {
    const rsvpData = createMockRsvpData({
      event: {
        ...createMockRsvpData().event,
        isPaused: true,
      },
    });
    mockFindRsvpByToken.mockResolvedValue(rsvpData);

    const result = await submitRsvpAction(validFormData);

    expect(result).toEqual({
      success: false,
      error: "現在回答を受け付けていません",
    });
    expect(mockUpdateRsvpResponse).not.toHaveBeenCalled();
  });

  it("異常系: 回答期限切れ（responseDeadline指定あり）", async () => {
    const rsvpData = createMockRsvpData({
      event: {
        ...createMockRsvpData().event,
        responseDeadline: new Date("2020-01-01T00:00:00Z"),
        date: new Date("2099-12-31T23:59:59Z"),
      },
    });
    mockFindRsvpByToken.mockResolvedValue(rsvpData);

    const result = await submitRsvpAction(validFormData);

    expect(result).toEqual({
      success: false,
      error: "回答期限を過ぎています",
    });
    expect(mockUpdateRsvpResponse).not.toHaveBeenCalled();
  });

  it("異常系: 回答期限切れ（responseDeadline未設定、event.dateで判定）", async () => {
    const rsvpData = createMockRsvpData({
      event: {
        ...createMockRsvpData().event,
        responseDeadline: null,
        date: new Date("2020-01-01T00:00:00Z"),
      },
    });
    mockFindRsvpByToken.mockResolvedValue(rsvpData);

    const result = await submitRsvpAction(validFormData);

    expect(result).toEqual({
      success: false,
      error: "回答期限を過ぎています",
    });
  });

  it("異常系: hasAfterParty && attending && afterPartyStatus未指定", async () => {
    const rsvpData = createMockRsvpData({
      event: {
        ...createMockRsvpData().event,
        hasAfterParty: true,
      },
    });
    mockFindRsvpByToken.mockResolvedValue(rsvpData);

    const result = await submitRsvpAction({
      token: "test-token-123",
      status: "attending",
    });

    expect(result).toEqual({
      success: false,
      error: "懇親会の参加可否を選択してください",
    });
    expect(mockUpdateRsvpResponse).not.toHaveBeenCalled();
  });

  it("異常系: DB更新失敗", async () => {
    const rsvpData = createMockRsvpData();
    mockFindRsvpByToken.mockResolvedValue(rsvpData);
    mockUpdateRsvpResponse.mockRejectedValue(new Error("DB error"));

    const result = await submitRsvpAction(validFormData);

    expect(result).toEqual({
      success: false,
      error: "回答の送信中にエラーが発生しました",
    });
  });
});
