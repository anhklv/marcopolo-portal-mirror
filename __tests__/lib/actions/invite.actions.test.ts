import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "@/__tests__/helpers/mock-prisma";

// next/cache のモック
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// auth/permissions のモック
const mockRequireAuth = vi.fn();
const mockGetScopedCommunityIds = vi.fn();
const mockCanAccessEvent = vi.fn();

vi.mock("@/lib/auth/permissions", () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  getScopedCommunityIds: (...args: unknown[]) => mockGetScopedCommunityIds(...args),
  canAccessEvent: (...args: unknown[]) => mockCanAccessEvent(...args),
}));

// mail/send のモック
const mockSendMail = vi.fn();
vi.mock("@/lib/mail/send", () => ({
  sendMail: (...args: unknown[]) => mockSendMail(...args),
}));

import {
  sendInviteAction,
  sendTestInviteAction,
} from "@/lib/actions/invite.actions";

// テストデータ
const superSession = {
  user: { id: "1", role: "super", firstName: "管理", lastName: "太郎", email: "admin@example.com" },
};

const validInviteData = {
  eventId: 1,
  customerIds: [10, 20],
  emailTitle: "【テストイベント】ご案内",
  emailBody: "テスト本文\n{RSVP_URL}",
};

const validTestInviteData = {
  eventId: 1,
  emailTitle: "【テストイベント】ご案内",
  emailBody: "テスト本文\n{RSVP_URL}",
};

function setupSuperAdmin() {
  mockRequireAuth.mockResolvedValue(superSession);
  mockPrisma.admin.findUnique.mockResolvedValue({
    id: 1,
    role: "super",
    email: "admin@example.com",
    adminCommunities: [],
  });
  mockGetScopedCommunityIds.mockResolvedValue([1, 2, 3]);
  mockCanAccessEvent.mockResolvedValue(true);
  mockPrisma.event.findFirst.mockResolvedValue({ id: 1 });
}

describe("sendInviteAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: 案内メール送信成功", async () => {
    setupSuperAdmin();
    mockPrisma.rsvp.findMany.mockResolvedValueOnce([]); // 既存RSVPなし
    mockPrisma.customer.findMany.mockResolvedValue([
      { id: 10, lastName: "田中", firstName: "太郎", email: "tanaka@example.com" },
      { id: 20, lastName: "佐藤", firstName: "花子", email: "sato@example.com" },
    ]);
    mockPrisma.rsvp.createMany.mockResolvedValue({ count: 2 });
    mockSendMail.mockResolvedValue({ success: true, messageId: "<msg>" });

    const result = await sendInviteAction(validInviteData);

    expect(result).toEqual({
      success: true,
      sentCount: 2,
      failedCount: 0,
      failedNames: [],
    });
    expect(mockSendMail).toHaveBeenCalledTimes(2);
    // メール送信後にRSVP作成
    expect(mockPrisma.rsvp.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ eventId: 1, customerId: 10 }),
        expect.objectContaining({ eventId: 1, customerId: 20 }),
      ]),
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/events/1");
  });

  it("正常系: 既存RSVP分はスキップする", async () => {
    setupSuperAdmin();
    // customerId: 10 は既存RSVP
    mockPrisma.rsvp.findMany.mockResolvedValueOnce([{ customerId: 10 }]);
    mockPrisma.customer.findMany.mockResolvedValue([
      { id: 20, lastName: "佐藤", firstName: "花子", email: "sato@example.com" },
    ]);
    mockPrisma.rsvp.createMany.mockResolvedValue({ count: 1 });
    mockSendMail.mockResolvedValue({ success: true, messageId: "<msg>" });

    const result = await sendInviteAction(validInviteData);

    expect(result).toEqual({
      success: true,
      sentCount: 1,
      failedCount: 0,
      failedNames: [],
    });
  });

  it("異常系: 全員が案内済みの場合", async () => {
    setupSuperAdmin();
    mockPrisma.rsvp.findMany.mockResolvedValueOnce([
      { customerId: 10 },
      { customerId: 20 },
    ]);

    const result = await sendInviteAction(validInviteData);

    expect(result).toEqual({
      success: false,
      error: "選択された顧客は全て案内済みです",
    });
  });

  it("異常系: バリデーションエラー（customerIds空）", async () => {
    setupSuperAdmin();

    const result = await sendInviteAction({
      ...validInviteData,
      customerIds: [],
    });

    expect(result.success).toBe(false);
  });

  it("異常系: 未認証", async () => {
    mockRequireAuth.mockRejectedValue(new Error("認証が必要です"));

    await expect(sendInviteAction(validInviteData)).rejects.toThrow("認証が必要です");
  });

  it("異常系: アクセス権なし", async () => {
    setupSuperAdmin();
    mockCanAccessEvent.mockResolvedValue(false);

    const result = await sendInviteAction(validInviteData);

    expect(result).toEqual({
      success: false,
      error: "このイベントへのアクセス権がありません",
    });
  });

  it("異常系: イベントが存在しない", async () => {
    setupSuperAdmin();
    mockPrisma.event.findFirst.mockResolvedValue(null);

    const result = await sendInviteAction(validInviteData);

    expect(result).toEqual({
      success: false,
      error: "イベントが見つかりません",
    });
  });

  it("異常系: community_adminでスコープ外顧客が含まれる場合", async () => {
    const communityAdminSession = {
      user: { id: "2", role: "community_admin", firstName: "地域", lastName: "管理" },
    };
    mockRequireAuth.mockResolvedValue(communityAdminSession);
    mockPrisma.admin.findUnique.mockResolvedValue({
      id: 2,
      role: "community_admin",
      email: "local@example.com",
      adminCommunities: [{ communityId: 1 }],
    });
    mockGetScopedCommunityIds.mockResolvedValue([1]);
    mockCanAccessEvent.mockResolvedValue(true);
    mockPrisma.event.findFirst.mockResolvedValue({ id: 1 });
    // customerId: 10 はスコープ内、customerId: 20 はスコープ外
    mockPrisma.customerCommunity.findMany.mockResolvedValue([
      { customerId: 10 },
    ]);

    const result = await sendInviteAction(validInviteData);

    expect(result).toEqual({
      success: false,
      error: "選択された顧客へのアクセス権がありません",
    });
  });

  it("メール送信失敗分はRSVP作成されない", async () => {
    setupSuperAdmin();
    mockPrisma.rsvp.findMany.mockResolvedValueOnce([]);
    mockPrisma.customer.findMany.mockResolvedValue([
      { id: 10, lastName: "田中", firstName: "太郎", email: "tanaka@example.com" },
      { id: 20, lastName: "佐藤", firstName: "花子", email: "sato@example.com" },
    ]);
    mockPrisma.rsvp.createMany.mockResolvedValue({ count: 1 });
    // 1通目成功、2通目失敗
    mockSendMail
      .mockResolvedValueOnce({ success: true, messageId: "<msg>" })
      .mockResolvedValueOnce({ success: false, error: "SMTP error" });

    const result = await sendInviteAction(validInviteData);

    expect(result).toEqual({
      success: true,
      sentCount: 1,
      failedCount: 1,
      failedNames: ["佐藤 花子"],
    });
    // 成功分(customerId: 10)のみRSVP作成
    expect(mockPrisma.rsvp.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ eventId: 1, customerId: 10 })],
    });
  });

  it("異常系: DB操作エラー時にエラーメッセージを返す", async () => {
    setupSuperAdmin();
    mockPrisma.rsvp.findMany.mockRejectedValue(new Error("DB connection error"));

    const result = await sendInviteAction(validInviteData);

    expect(result).toEqual({
      success: false,
      error: "案内メールの送信中にエラーが発生しました",
    });
  });
});

describe("sendTestInviteAction", () => {
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

    const result = await sendTestInviteAction(validTestInviteData);

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

    await expect(sendTestInviteAction(validTestInviteData)).rejects.toThrow("認証が必要です");
  });

  it("異常系: バリデーションエラー（emailTitle空）", async () => {
    mockRequireAuth.mockResolvedValue(superSession);

    const result = await sendTestInviteAction({
      ...validTestInviteData,
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

    const result = await sendTestInviteAction(validTestInviteData);

    expect(result).toEqual({
      success: false,
      error: "SMTP error",
    });
  });
});
