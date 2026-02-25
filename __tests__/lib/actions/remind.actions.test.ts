import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "@/__tests__/helpers/mock-prisma";

// next/cache のモック
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// auth/permissions のモック
const mockRequireAuth = vi.fn();
const mockRequireAuthenticatedAdmin = vi.fn();
const mockCanAccessEvent = vi.fn();

vi.mock("@/lib/auth/permissions", () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  requireAuthenticatedAdmin: (...args: unknown[]) => mockRequireAuthenticatedAdmin(...args),
  canAccessEvent: (...args: unknown[]) => mockCanAccessEvent(...args),
}));

// mail/send のモック
const mockSendMail = vi.fn();
vi.mock("@/lib/mail/send", () => ({
  sendMail: (...args: unknown[]) => mockSendMail(...args),
}));

import {
  sendRemindAction,
  sendTestRemindAction,
} from "@/lib/actions/remind.actions";

// テストデータ
const superSession = {
  user: { id: "1", role: "super", firstName: "管理", lastName: "太郎", email: "admin@example.com" },
};

const validRemindData = {
  eventId: 1,
  emailTitle: "【テストイベント】参加可否のご回答をお願いします",
  emailBody: "テスト本文\n{RSVP_URL}",
};

const validTestRemindData = {
  eventId: 1,
  emailTitle: "【テストイベント】参加可否のご回答をお願いします",
  emailBody: "テスト本文\n{RSVP_URL}",
};

function setupSuperAdmin() {
  mockRequireAuth.mockResolvedValue(superSession);
  mockRequireAuthenticatedAdmin.mockResolvedValue({
    admin: { id: 1, role: "super", adminCommunities: [] },
    isSuper: true,
    scopedCommunityIds: [1, 2, 3],
  });
  mockPrisma.admin.findUnique.mockResolvedValue({
    id: 1,
    role: "super",
    email: "admin@example.com",
    adminCommunities: [],
  });
  mockCanAccessEvent.mockResolvedValue(true);
  mockPrisma.event.findFirst.mockResolvedValue({ id: 1 });
}

describe("sendRemindAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: pending 2名にリマインドメール送信成功", async () => {
    setupSuperAdmin();
    mockPrisma.rsvp.findMany.mockResolvedValueOnce([
      { customerId: 10, status: "pending", customer: { id: 10, lastName: "田中", firstName: "太郎", email: "tanaka@example.com", subEmails: [] } },
      { customerId: 20, status: "pending", customer: { id: 20, lastName: "佐藤", firstName: "花子", email: "sato@example.com", subEmails: [] } },
    ]);
    mockPrisma.rsvp.update.mockResolvedValue({});
    mockSendMail.mockResolvedValue({ success: true, messageId: "<msg>" });

    const result = await sendRemindAction(validRemindData);

    expect(result).toEqual({
      success: true,
      sentCount: 2,
      failedCount: 0,
      failedNames: [],
    });
    expect(mockSendMail).toHaveBeenCalledTimes(2);
    // トークン更新（updateが2回呼ばれる）
    expect(mockPrisma.rsvp.update).toHaveBeenCalledTimes(2);
    expect(mockPrisma.rsvp.update).toHaveBeenCalledWith({
      where: { eventId_customerId: { eventId: 1, customerId: 10 } },
      data: { token: expect.any(String) },
    });
    expect(mockPrisma.rsvp.update).toHaveBeenCalledWith({
      where: { eventId_customerId: { eventId: 1, customerId: 20 } },
      data: { token: expect.any(String) },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/events/1");
  });

  it("正常系: subEmailsありの顧客はメイン+サブ宛先で送信される", async () => {
    setupSuperAdmin();
    mockPrisma.rsvp.findMany.mockResolvedValueOnce([
      { customerId: 10, status: "pending", customer: { id: 10, lastName: "田中", firstName: "太郎", email: "tanaka@example.com", subEmails: ["tanaka-sub@example.com"] } },
    ]);
    mockPrisma.rsvp.update.mockResolvedValue({});
    mockSendMail.mockResolvedValue({ success: true, messageId: "<msg>" });

    const result = await sendRemindAction(validRemindData);

    expect(result).toEqual({
      success: true,
      sentCount: 1,
      failedCount: 0,
      failedNames: [],
    });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "tanaka@example.com, tanaka-sub@example.com",
      })
    );
  });

  it("正常系: 11名以上で複数バッチに分かれて送信される", async () => {
    setupSuperAdmin();

    // 12名のpending RSVPを生成
    const pendingRsvps = Array.from({ length: 12 }, (_, i) => ({
      customerId: i + 1,
      status: "pending",
      customer: {
        id: i + 1,
        lastName: `姓${i + 1}`,
        firstName: `名${i + 1}`,
        email: `user${i + 1}@example.com`,
        subEmails: [],
      },
    }));
    mockPrisma.rsvp.findMany.mockResolvedValueOnce(pendingRsvps);
    mockPrisma.rsvp.update.mockResolvedValue({});
    mockSendMail.mockResolvedValue({ success: true, messageId: "<msg>" });

    const result = await sendRemindAction(validRemindData);

    expect(result).toEqual({
      success: true,
      sentCount: 12,
      failedCount: 0,
      failedNames: [],
    });
    expect(mockSendMail).toHaveBeenCalledTimes(12);
  });

  it("正常系: メール送信失敗分はトークン未更新", async () => {
    setupSuperAdmin();
    mockPrisma.rsvp.findMany.mockResolvedValueOnce([
      { customerId: 10, status: "pending", customer: { id: 10, lastName: "田中", firstName: "太郎", email: "tanaka@example.com", subEmails: [] } },
      { customerId: 20, status: "pending", customer: { id: 20, lastName: "佐藤", firstName: "花子", email: "sato@example.com", subEmails: [] } },
    ]);
    // 1通目成功、2通目失敗
    mockSendMail
      .mockResolvedValueOnce({ success: true, messageId: "<msg>" })
      .mockResolvedValueOnce({ success: false, error: "SMTP error" });
    mockPrisma.rsvp.update.mockResolvedValue({});

    const result = await sendRemindAction(validRemindData);

    expect(result).toEqual({
      success: true,
      sentCount: 1,
      failedCount: 1,
      failedNames: ["佐藤 花子"],
    });
    // 成功分(customerId: 10)のみトークン更新
    expect(mockPrisma.rsvp.update).toHaveBeenCalledTimes(1);
    expect(mockPrisma.rsvp.update).toHaveBeenCalledWith({
      where: { eventId_customerId: { eventId: 1, customerId: 10 } },
      data: { token: expect.any(String) },
    });
  });

  it("異常系: バリデーションエラー（emailTitle空）", async () => {
    setupSuperAdmin();

    const result = await sendRemindAction({
      ...validRemindData,
      emailTitle: "",
    });

    expect(result.success).toBe(false);
  });

  it("異常系: 未認証", async () => {
    mockRequireAuthenticatedAdmin.mockRejectedValue(new Error("認証が必要です"));

    await expect(sendRemindAction(validRemindData)).rejects.toThrow("認証が必要です");
  });

  it("異常系: アクセス権なし", async () => {
    setupSuperAdmin();
    mockCanAccessEvent.mockResolvedValue(false);

    const result = await sendRemindAction(validRemindData);

    expect(result).toEqual({
      success: false,
      error: "このイベントへのアクセス権がありません",
    });
  });

  it("異常系: イベントが存在しない", async () => {
    setupSuperAdmin();
    mockPrisma.event.findFirst.mockResolvedValue(null);

    const result = await sendRemindAction(validRemindData);

    expect(result).toEqual({
      success: false,
      error: "イベントが見つかりません",
    });
  });

  it("異常系: pending RSVPが0件", async () => {
    setupSuperAdmin();
    mockPrisma.rsvp.findMany.mockResolvedValueOnce([]);

    const result = await sendRemindAction(validRemindData);

    expect(result).toEqual({
      success: false,
      error: "未回答の参加者がいません",
    });
  });

  it("異常系: DB更新失敗 → failedとして集計", async () => {
    setupSuperAdmin();
    mockPrisma.rsvp.findMany.mockResolvedValueOnce([
      { customerId: 10, status: "pending", customer: { id: 10, lastName: "田中", firstName: "太郎", email: "tanaka@example.com", subEmails: [] } },
    ]);
    mockSendMail.mockResolvedValue({ success: true, messageId: "<msg>" });
    mockPrisma.rsvp.update.mockRejectedValue(new Error("DB error"));

    const result = await sendRemindAction(validRemindData);

    expect(result).toEqual({
      success: true,
      sentCount: 0,
      failedCount: 1,
      failedNames: ["田中 太郎"],
    });
  });

  it("正常系: 削除済み顧客はpending取得から除外される（whereに含まれることを確認）", async () => {
    setupSuperAdmin();
    // rsvp.findManyが呼ばれた際、customer.deletedAt: null がwhereに含まれることを確認
    mockPrisma.rsvp.findMany.mockResolvedValueOnce([
      { customerId: 10, status: "pending", customer: { id: 10, lastName: "田中", firstName: "太郎", email: "tanaka@example.com", subEmails: [] } },
    ]);
    mockPrisma.rsvp.update.mockResolvedValue({});
    mockSendMail.mockResolvedValue({ success: true, messageId: "<msg>" });

    await sendRemindAction(validRemindData);

    expect(mockPrisma.rsvp.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          customer: { deletedAt: null },
        }),
      })
    );
  });

  it("異常系: DB操作エラー時にエラーメッセージを返す", async () => {
    setupSuperAdmin();
    mockPrisma.rsvp.findMany.mockRejectedValue(new Error("DB connection error"));

    const result = await sendRemindAction(validRemindData);

    expect(result).toEqual({
      success: false,
      error: "リマインドメールの送信中にエラーが発生しました",
    });
  });
});

describe("sendTestRemindAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: テスト送信成功", async () => {
    mockRequireAuth.mockResolvedValue(superSession);
    mockPrisma.admin.findUnique.mockResolvedValue({
      id: 1,
      email: "admin@example.com",
    });
    mockSendMail.mockResolvedValue({ success: true, messageId: "<test>" });

    const result = await sendTestRemindAction(validTestRemindData);

    expect(result).toEqual({ success: true });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "admin@example.com",
        subject: expect.stringContaining("[テスト]"),
      })
    );
  });

  it("異常系: 未認証", async () => {
    mockRequireAuth.mockRejectedValue(new Error("認証が必要です"));

    await expect(sendTestRemindAction(validTestRemindData)).rejects.toThrow("認証が必要です");
  });

  it("異常系: バリデーションエラー（emailTitle空）", async () => {
    mockRequireAuth.mockResolvedValue(superSession);

    const result = await sendTestRemindAction({
      ...validTestRemindData,
      emailTitle: "",
    });

    expect(result.success).toBe(false);
  });

  it("異常系: メール送信失敗", async () => {
    mockRequireAuth.mockResolvedValue(superSession);
    mockPrisma.admin.findUnique.mockResolvedValue({
      id: 1,
      email: "admin@example.com",
    });
    mockSendMail.mockResolvedValue({ success: false, error: "SMTP error" });

    const result = await sendTestRemindAction(validTestRemindData);

    expect(result).toEqual({
      success: false,
      error: "SMTP error",
    });
  });
});
