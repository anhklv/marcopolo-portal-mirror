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
const mockSendMailBatch = vi.fn();
vi.mock("@/lib/mail/send", () => ({
  sendMail: (...args: unknown[]) => mockSendMail(...args),
  sendMailBatch: (...args: unknown[]) => mockSendMailBatch(...args),
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
    mockSendMailBatch.mockResolvedValue({ sentCount: 2, failedCount: 0, failedNames: [], successCustomerIds: [10, 20] });

    const result = await sendInviteAction(validInviteData);

    expect(result).toEqual({
      success: true,
      sentCount: 2,
      failedCount: 0,
      failedNames: [],
    });
    expect(mockSendMailBatch).toHaveBeenCalledTimes(1);
    // メール送信後にRSVP作成（新規のみcreateMany）
    expect(mockPrisma.rsvp.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ eventId: 1, customerId: 10 }),
        expect.objectContaining({ eventId: 1, customerId: 20 }),
      ]),
      skipDuplicates: true,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/events/1");
  });

  it("正常系: 回答済み（attending）の顧客はスキップする", async () => {
    setupSuperAdmin();
    // customerId: 10 は attending（回答済み）
    mockPrisma.rsvp.findMany.mockResolvedValueOnce([{ customerId: 10, status: "attending" }]);
    mockPrisma.customer.findMany.mockResolvedValue([
      { id: 20, lastName: "佐藤", firstName: "花子", email: "sato@example.com" },
    ]);
    mockPrisma.rsvp.createMany.mockResolvedValue({ count: 1 });
    mockSendMailBatch.mockResolvedValue({ sentCount: 1, failedCount: 0, failedNames: [], successCustomerIds: [20] });

    const result = await sendInviteAction(validInviteData);

    expect(result).toEqual({
      success: true,
      sentCount: 1,
      failedCount: 0,
      failedNames: [],
    });
  });

  it("異常系: 全員が回答済みの場合", async () => {
    setupSuperAdmin();
    mockPrisma.rsvp.findMany.mockResolvedValueOnce([
      { customerId: 10, status: "attending" },
      { customerId: 20, status: "absent" },
    ]);

    const result = await sendInviteAction(validInviteData);

    expect(result).toEqual({
      success: false,
      error: "選択された顧客は全て回答済みです",
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
    mockRequireAuthenticatedAdmin.mockRejectedValue(new Error("認証が必要です"));

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
    mockRequireAuthenticatedAdmin.mockResolvedValue({
      admin: { id: 2, role: "community_admin", adminCommunities: [{ communityId: 1 }] },
      isSuper: false,
      scopedCommunityIds: [1],
    });
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
    mockSendMailBatch.mockResolvedValue({ sentCount: 1, failedCount: 1, failedNames: ["佐藤 花子"], successCustomerIds: [10] });

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
      skipDuplicates: true,
    });
  });

  it("正常系: 12名の顧客に送信される", async () => {
    setupSuperAdmin();
    mockPrisma.rsvp.findMany.mockResolvedValueOnce([]);

    // 12名の顧客を生成
    const customerIds = Array.from({ length: 12 }, (_, i) => i + 1);
    const customers = customerIds.map((id) => ({
      id,
      lastName: `姓${id}`,
      firstName: `名${id}`,
      email: `user${id}@example.com`,
    }));
    mockPrisma.customer.findMany.mockResolvedValue(customers);
    mockPrisma.rsvp.createMany.mockResolvedValue({ count: 12 });
    mockSendMailBatch.mockResolvedValue({ sentCount: 12, failedCount: 0, failedNames: [], successCustomerIds: customerIds });

    const result = await sendInviteAction({
      ...validInviteData,
      customerIds,
    });

    expect(result).toEqual({
      success: true,
      sentCount: 12,
      failedCount: 0,
      failedNames: [],
    });
    expect(mockSendMailBatch).toHaveBeenCalledWith(
      expect.objectContaining({ customers })
    );
  });

  it("正常系: pending顧客への再送でトークンが更新される", async () => {
    setupSuperAdmin();
    // customerId: 10 は pending（未回答）
    mockPrisma.rsvp.findMany.mockResolvedValueOnce([{ customerId: 10, status: "pending" }]);
    mockPrisma.customer.findMany.mockResolvedValue([
      { id: 10, lastName: "田中", firstName: "太郎", email: "tanaka@example.com" },
    ]);
    mockPrisma.rsvp.update.mockResolvedValue({});
    mockSendMailBatch.mockResolvedValue({ sentCount: 1, failedCount: 0, failedNames: [], successCustomerIds: [10] });

    const result = await sendInviteAction({
      ...validInviteData,
      customerIds: [10],
    });

    expect(result).toEqual({
      success: true,
      sentCount: 1,
      failedCount: 0,
      failedNames: [],
    });
    // createManyは呼ばれない（新規がないため）
    expect(mockPrisma.rsvp.createMany).not.toHaveBeenCalled();
    // updateでトークン更新
    expect(mockPrisma.rsvp.update).toHaveBeenCalledWith({
      where: { eventId_customerId: { eventId: 1, customerId: 10 } },
      data: { token: expect.any(String) },
    });
  });

  it("正常系: pending + 新規の混在ケース", async () => {
    setupSuperAdmin();
    // customerId: 10 は pending、customerId: 20 は新規
    mockPrisma.rsvp.findMany.mockResolvedValueOnce([{ customerId: 10, status: "pending" }]);
    mockPrisma.customer.findMany.mockResolvedValue([
      { id: 10, lastName: "田中", firstName: "太郎", email: "tanaka@example.com" },
      { id: 20, lastName: "佐藤", firstName: "花子", email: "sato@example.com" },
    ]);
    mockPrisma.rsvp.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.rsvp.update.mockResolvedValue({});
    mockSendMailBatch.mockResolvedValue({ sentCount: 2, failedCount: 0, failedNames: [], successCustomerIds: [10, 20] });

    const result = await sendInviteAction(validInviteData);

    expect(result).toEqual({
      success: true,
      sentCount: 2,
      failedCount: 0,
      failedNames: [],
    });
    // 新規分はcreateMany
    expect(mockPrisma.rsvp.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ eventId: 1, customerId: 20 })],
      skipDuplicates: true,
    });
    // pending分はupdate
    expect(mockPrisma.rsvp.update).toHaveBeenCalledWith({
      where: { eventId_customerId: { eventId: 1, customerId: 10 } },
      data: { token: expect.any(String) },
    });
  });

  it("異常系: pending再送のDB更新失敗時はfailedとして集計される", async () => {
    setupSuperAdmin();
    mockPrisma.rsvp.findMany.mockResolvedValueOnce([{ customerId: 10, status: "pending" }]);
    mockPrisma.customer.findMany.mockResolvedValue([
      { id: 10, lastName: "田中", firstName: "太郎", email: "tanaka@example.com" },
    ]);
    mockSendMailBatch.mockResolvedValue({ sentCount: 1, failedCount: 0, failedNames: [], successCustomerIds: [10] });
    mockPrisma.rsvp.update.mockRejectedValue(new Error("DB error"));

    const result = await sendInviteAction({
      ...validInviteData,
      customerIds: [10],
    });

    expect(result).toEqual({
      success: true,
      sentCount: 0,
      failedCount: 1,
      failedNames: ["田中 太郎"],
    });
  });

  it("正常系: online/absent の回答済み顧客も除外される", async () => {
    setupSuperAdmin();
    mockPrisma.rsvp.findMany.mockResolvedValueOnce([
      { customerId: 10, status: "online" },
      { customerId: 20, status: "absent" },
    ]);

    const result = await sendInviteAction(validInviteData);

    expect(result).toEqual({
      success: false,
      error: "選択された顧客は全て回答済みです",
    });
  });

  it("正常系: subEmailsがある顧客がsendMailBatchに渡される", async () => {
    setupSuperAdmin();
    mockPrisma.rsvp.findMany.mockResolvedValueOnce([]);
    const customers = [
      { id: 10, lastName: "田中", firstName: "太郎", email: "tanaka@example.com", subEmails: ["tanaka-sub@example.com"] },
    ];
    mockPrisma.customer.findMany.mockResolvedValue(customers);
    mockPrisma.rsvp.createMany.mockResolvedValue({ count: 1 });
    mockSendMailBatch.mockResolvedValue({ sentCount: 1, failedCount: 0, failedNames: [], successCustomerIds: [10] });

    const result = await sendInviteAction({
      ...validInviteData,
      customerIds: [10],
    });

    expect(result).toEqual({
      success: true,
      sentCount: 1,
      failedCount: 0,
      failedNames: [],
    });
    expect(mockSendMailBatch).toHaveBeenCalledWith(
      expect.objectContaining({ customers })
    );
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
