import { describe, it, expect, vi, beforeEach } from "vitest";
import "@/__tests__/helpers/mock-prisma";

// next/cache のモック
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const mockSendMailBatch = vi.fn();
vi.mock("@/lib/mail/send", () => ({
  sendMailBatch: (...args: unknown[]) => mockSendMailBatch(...args),
}));

const mockGetBaseUrl = vi.fn();
vi.mock("@/lib/helpers/base-url", () => ({
  getBaseUrl: (...args: unknown[]) => mockGetBaseUrl(...args),
}));

// repository のモック
const mockFindRsvpByToken = vi.fn();
const mockFindRsvpByIdForAdmin = vi.fn();
const mockUpdateRsvpResponse = vi.fn();

vi.mock("@/lib/repositories/rsvp.repository", () => ({
  findRsvpByToken: (...args: unknown[]) => mockFindRsvpByToken(...args),
  findRsvpByIdForAdmin: (...args: unknown[]) =>
    mockFindRsvpByIdForAdmin(...args),
  updateRsvpResponse: (...args: unknown[]) => mockUpdateRsvpResponse(...args),
}));

const mockRequireAuthenticatedAdmin = vi.fn();
const mockCanAccessEvent = vi.fn();

vi.mock("@/lib/auth/permissions", () => ({
  requireAuthenticatedAdmin: (...args: unknown[]) =>
    mockRequireAuthenticatedAdmin(...args),
  canAccessEvent: (...args: unknown[]) => mockCanAccessEvent(...args),
}));

import {
  adminUpdateRsvpAction,
  submitRsvpAction,
} from "@/lib/actions/rsvp.actions";

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

function createMockAdminRsvpData(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    eventId: 10,
    customerId: 20,
    token: "admin-test-token",
    status: "pending",
    event: {
      id: 10,
      deletedAt: null,
      hasAfterParty: false,
    },
    customer: {
      id: 20,
      lastName: "山田",
      firstName: "太郎",
      email: "yamada@example.com",
      subEmails: ["yamada-sub@example.com"],
      deletedAt: null,
    },
    ...overrides,
  };
}

const validAdminUpdateData = {
  rsvpId: 1,
  eventId: 10,
  status: "attending" as const,
  afterPartyStatus: null,
  comment: "管理者による変更",
  adminNote: "電話連絡により変更",
};

describe("adminUpdateRsvpAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedAdmin.mockResolvedValue({
      admin: { id: 1, role: "super", adminCommunities: [] },
    });
    mockCanAccessEvent.mockResolvedValue(true);
    mockGetBaseUrl.mockResolvedValue("http://localhost:3000");
    mockSendMailBatch.mockResolvedValue({
      sentCount: 1,
      failedCount: 0,
      failedNames: [],
      successCustomerIds: [20],
    });
  });

  it("正常系: RSVPを更新してイベント詳細を再検証する", async () => {
    mockFindRsvpByIdForAdmin.mockResolvedValue(createMockAdminRsvpData());
    mockUpdateRsvpResponse.mockResolvedValue({});

    const result = await adminUpdateRsvpAction(validAdminUpdateData);

    expect(result).toEqual({ success: true });
    expect(mockFindRsvpByIdForAdmin).toHaveBeenCalledWith(1, 10);
    expect(mockUpdateRsvpResponse).toHaveBeenCalledWith(1, {
      status: "attending",
      afterPartyStatus: null,
      comment: "管理者による変更",
      adminNote: "電話連絡により変更",
      respondedAt: expect.any(Date),
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/events/10");
    expect(mockSendMailBatch).not.toHaveBeenCalled();
  });

  it("正常系: 通知指定時は更新後に顧客へメールを送信する", async () => {
    const rsvp = createMockAdminRsvpData();
    mockFindRsvpByIdForAdmin.mockResolvedValue(rsvp);
    mockUpdateRsvpResponse.mockResolvedValue({});

    const result = await adminUpdateRsvpAction({
      ...validAdminUpdateData,
      notifyCustomerByEmail: true,
      emailSubject: "更新のお知らせ",
      emailBody: "更新しました",
    });

    expect(result).toEqual({ success: true });
    expect(mockUpdateRsvpResponse).toHaveBeenCalled();
    expect(mockSendMailBatch).toHaveBeenCalledWith({
      customers: [rsvp.customer],
      tokenMap: new Map([[20, "admin-test-token"]]),
      eventId: 10,
      baseUrl: "http://localhost:3000",
      from: "noreply@example.com",
      emailTitle: "更新のお知らせ",
      emailBody: "更新しました",
    });
  });

  it("正常系: メール送信失敗時も更新成功として警告を返す", async () => {
    mockFindRsvpByIdForAdmin.mockResolvedValue(createMockAdminRsvpData());
    mockUpdateRsvpResponse.mockResolvedValue({});
    mockSendMailBatch.mockResolvedValue({
      sentCount: 0,
      failedCount: 1,
      failedNames: ["山田 太郎"],
      successCustomerIds: [],
    });

    const result = await adminUpdateRsvpAction({
      ...validAdminUpdateData,
      notifyCustomerByEmail: true,
      emailSubject: "更新のお知らせ",
      emailBody: "更新しました",
    });

    expect(result).toEqual({
      success: true,
      emailWarning:
        "参加ステータスは更新しましたが、通知メールの送信に失敗しました",
    });
  });

  it("異常系: 通知指定時に件名が空の場合は更新しない", async () => {
    const result = await adminUpdateRsvpAction({
      ...validAdminUpdateData,
      notifyCustomerByEmail: true,
      emailSubject: " ",
      emailBody: "更新しました",
    });

    expect(result).toEqual({
      success: false,
      error: "メールタイトルを入力してください",
    });
    expect(mockRequireAuthenticatedAdmin).not.toHaveBeenCalled();
    expect(mockUpdateRsvpResponse).not.toHaveBeenCalled();
  });

  it("正常系: オンライン参加の場合は懇親会回答をnullにする", async () => {
    mockFindRsvpByIdForAdmin.mockResolvedValue(
      createMockAdminRsvpData({
        event: { id: 10, deletedAt: null, hasAfterParty: true },
      })
    );
    mockUpdateRsvpResponse.mockResolvedValue({});

    const result = await adminUpdateRsvpAction({
      ...validAdminUpdateData,
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

  it("異常系: イベントへのアクセス権がない", async () => {
    mockCanAccessEvent.mockResolvedValue(false);

    const result = await adminUpdateRsvpAction(validAdminUpdateData);

    expect(result).toEqual({
      success: false,
      error: "このイベントへのアクセス権がありません",
    });
    expect(mockFindRsvpByIdForAdmin).not.toHaveBeenCalled();
  });

  it("異常系: RSVPがイベント内に存在しない", async () => {
    mockFindRsvpByIdForAdmin.mockResolvedValue(null);

    const result = await adminUpdateRsvpAction(validAdminUpdateData);

    expect(result).toEqual({
      success: false,
      error: "参加者が見つかりません",
    });
    expect(mockUpdateRsvpResponse).not.toHaveBeenCalled();
  });

  it("異常系: 顧客が論理削除されている", async () => {
    mockFindRsvpByIdForAdmin.mockResolvedValue(
      createMockAdminRsvpData({
        customer: { id: 20, deletedAt: new Date() },
      })
    );

    const result = await adminUpdateRsvpAction(validAdminUpdateData);

    expect(result).toEqual({
      success: false,
      error: "この顧客は削除されています",
    });
    expect(mockUpdateRsvpResponse).not.toHaveBeenCalled();
  });

  it("異常系: 現地参加かつ懇親会の回答が未選択", async () => {
    mockFindRsvpByIdForAdmin.mockResolvedValue(
      createMockAdminRsvpData({
        event: { id: 10, deletedAt: null, hasAfterParty: true },
      })
    );

    const result = await adminUpdateRsvpAction({
      rsvpId: 1,
      eventId: 10,
      status: "attending",
    });

    expect(result).toEqual({
      success: false,
      error: "懇親会の参加可否を選択してください",
    });
    expect(mockUpdateRsvpResponse).not.toHaveBeenCalled();
  });

  it("異常系: メッセージが1000文字を超える", async () => {
    const result = await adminUpdateRsvpAction({
      ...validAdminUpdateData,
      comment: "あ".repeat(1001),
    });

    expect(result).toEqual({
      success: false,
      error: "メッセージは1000文字以内で入力してください",
    });
    expect(mockRequireAuthenticatedAdmin).not.toHaveBeenCalled();
  });

  it("異常系: DB更新に失敗する", async () => {
    mockFindRsvpByIdForAdmin.mockResolvedValue(createMockAdminRsvpData());
    mockUpdateRsvpResponse.mockRejectedValue(new Error("DB error"));

    const result = await adminUpdateRsvpAction(validAdminUpdateData);

    expect(result).toEqual({
      success: false,
      error: "参加ステータスの更新に失敗しました",
    });
  });
});
