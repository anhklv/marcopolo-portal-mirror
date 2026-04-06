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
const mockCanManageSurvey = vi.fn();

vi.mock("@/lib/auth/permissions", () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  requireAuthenticatedAdmin: (...args: unknown[]) =>
    mockRequireAuthenticatedAdmin(...args),
  canManageSurvey: (...args: unknown[]) => mockCanManageSurvey(...args),
}));

// mail/send のモック
const mockSendMail = vi.fn();
vi.mock("@/lib/mail/send", () => ({
  sendMail: (...args: unknown[]) => mockSendMail(...args),
}));

// mail/survey-send のモック
const mockSendSurveyMailBatch = vi.fn();
vi.mock("@/lib/mail/survey-send", () => ({
  sendSurveyMailBatch: (...args: unknown[]) =>
    mockSendSurveyMailBatch(...args),
}));

// repositories/survey.repository のモック
const mockFindSurveyByEventId = vi.fn();
const mockCreateSurvey = vi.fn();
vi.mock("@/lib/repositories/survey.repository", () => ({
  findSurveyByEventId: (...args: unknown[]) =>
    mockFindSurveyByEventId(...args),
  createSurvey: (...args: unknown[]) => mockCreateSurvey(...args),
}));

import {
  sendSurveyAction,
  sendTestSurveyAction,
} from "@/lib/actions/survey-send.actions";

// テストデータ
const superSession = {
  user: {
    id: "1",
    role: "super",
    firstName: "管理",
    lastName: "太郎",
    email: "admin@example.com",
  },
};

const validSurveyData = {
  eventId: 1,
  customerIds: [10, 20],
  emailTitle: "【テストイベント】アンケートのお願い",
  emailBody: "テスト本文\n{SURVEY_URL}",
};

const validTestSurveyData = {
  eventId: 1,
  emailTitle: "【テストイベント】アンケートのお願い",
  emailBody: "テスト本文\n{SURVEY_URL}",
};

// 終了済みイベント（過去日付）
const closedEvent = {
  id: 1,
  date: new Date("2020-01-01"),
  responseDeadline: null,
  isPaused: false,
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
  mockCanManageSurvey.mockResolvedValue(true);
  // イベント終了チェック用
  mockPrisma.event.findFirst.mockResolvedValue(closedEvent);
  // 参加者検証用（デフォルト: customerIds [10, 20] が参加者）
  mockPrisma.rsvp.findMany.mockResolvedValue([
    { customerId: 10 },
    { customerId: 20 },
  ]);
  mockFindSurveyByEventId.mockResolvedValue({
    id: 100,
    eventId: 1,
    questions: [],
  });
}

describe("sendSurveyAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: 新規送信成功", async () => {
    setupSuperAdmin();
    mockPrisma.surveyToken.findMany.mockResolvedValue([]); // 既存トークンなし
    mockPrisma.customer.findMany.mockResolvedValue([
      {
        id: 10,
        lastName: "田中",
        firstName: "太郎",
        email: "tanaka@example.com",
      },
      {
        id: 20,
        lastName: "佐藤",
        firstName: "花子",
        email: "sato@example.com",
      },
    ]);
    mockPrisma.surveyToken.createMany.mockResolvedValue({ count: 2 });
    mockSendSurveyMailBatch.mockResolvedValue({
      sentCount: 2,
      failedCount: 0,
      failedNames: [],
      successCustomerIds: [10, 20],
    });

    const result = await sendSurveyAction(validSurveyData);

    expect(result).toEqual({
      success: true,
      sentCount: 2,
      failedCount: 0,
      failedNames: [],
    });
    expect(mockSendSurveyMailBatch).toHaveBeenCalledTimes(1);
    expect(mockPrisma.surveyToken.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ surveyId: 100, customerId: 10 }),
        expect.objectContaining({ surveyId: 100, customerId: 20 }),
      ]),
      skipDuplicates: true,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/events/1");
  });

  it("正常系: 再送（既存トークンの sentAt 更新）", async () => {
    setupSuperAdmin();
    mockPrisma.rsvp.findMany.mockResolvedValue([{ customerId: 10 }]);
    mockPrisma.surveyToken.findMany.mockResolvedValue([
      { customerId: 10, token: "existing-token-10" },
    ]);
    mockPrisma.customer.findMany.mockResolvedValue([
      {
        id: 10,
        lastName: "田中",
        firstName: "太郎",
        email: "tanaka@example.com",
      },
    ]);
    mockPrisma.surveyToken.update.mockResolvedValue({});
    mockSendSurveyMailBatch.mockResolvedValue({
      sentCount: 1,
      failedCount: 0,
      failedNames: [],
      successCustomerIds: [10],
    });

    const result = await sendSurveyAction({
      ...validSurveyData,
      customerIds: [10],
    });

    expect(result).toEqual({
      success: true,
      sentCount: 1,
      failedCount: 0,
      failedNames: [],
    });
    // createMany は呼ばれない（新規なし）
    expect(mockPrisma.surveyToken.createMany).not.toHaveBeenCalled();
    // update で sentAt 更新
    expect(mockPrisma.surveyToken.update).toHaveBeenCalledWith({
      where: {
        surveyId_customerId: { surveyId: 100, customerId: 10 },
      },
      data: { sentAt: expect.any(Date) },
    });
  });

  it("正常系: Survey未作成時に自動作成", async () => {
    setupSuperAdmin();
    mockPrisma.rsvp.findMany.mockResolvedValue([{ customerId: 10 }]);
    mockFindSurveyByEventId.mockResolvedValue(null); // Survey なし
    mockCreateSurvey.mockResolvedValue({ id: 200, eventId: 1 });
    mockPrisma.surveyToken.findMany.mockResolvedValue([]);
    mockPrisma.customer.findMany.mockResolvedValue([
      {
        id: 10,
        lastName: "田中",
        firstName: "太郎",
        email: "tanaka@example.com",
      },
    ]);
    mockPrisma.surveyToken.createMany.mockResolvedValue({ count: 1 });
    mockSendSurveyMailBatch.mockResolvedValue({
      sentCount: 1,
      failedCount: 0,
      failedNames: [],
      successCustomerIds: [10],
    });

    const result = await sendSurveyAction({
      ...validSurveyData,
      customerIds: [10],
    });

    expect(result.success).toBe(true);
    expect(mockCreateSurvey).toHaveBeenCalledWith({
      eventId: 1,
      questions: [],
    });
    expect(mockPrisma.surveyToken.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ surveyId: 200 })],
      skipDuplicates: true,
    });
  });

  it("正常系: 部分失敗（sentCount + failedCount）", async () => {
    setupSuperAdmin();
    mockPrisma.surveyToken.findMany.mockResolvedValue([]);
    mockPrisma.customer.findMany.mockResolvedValue([
      {
        id: 10,
        lastName: "田中",
        firstName: "太郎",
        email: "tanaka@example.com",
      },
      {
        id: 20,
        lastName: "佐藤",
        firstName: "花子",
        email: "sato@example.com",
      },
    ]);
    mockPrisma.surveyToken.createMany.mockResolvedValue({ count: 1 });
    mockSendSurveyMailBatch.mockResolvedValue({
      sentCount: 1,
      failedCount: 1,
      failedNames: ["佐藤 花子"],
      successCustomerIds: [10],
    });

    const result = await sendSurveyAction(validSurveyData);

    expect(result).toEqual({
      success: true,
      sentCount: 1,
      failedCount: 1,
      failedNames: ["佐藤 花子"],
    });
    expect(mockPrisma.surveyToken.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ customerId: 10 })],
      skipDuplicates: true,
    });
  });

  it("異常系: 未認証", async () => {
    mockRequireAuthenticatedAdmin.mockRejectedValue(
      new Error("認証が必要です")
    );

    await expect(sendSurveyAction(validSurveyData)).rejects.toThrow(
      "認証が必要です"
    );
  });

  it("異常系: 権限なし", async () => {
    setupSuperAdmin();
    mockCanManageSurvey.mockResolvedValue(false);

    const result = await sendSurveyAction(validSurveyData);

    expect(result).toEqual({
      success: false,
      error: "このイベントのアンケート操作権限がありません",
    });
  });

  it("異常系: バリデーション失敗（customerIds空）", async () => {
    setupSuperAdmin();

    const result = await sendSurveyAction({
      ...validSurveyData,
      customerIds: [],
    });

    expect(result.success).toBe(false);
  });

  it("異常系: 有効な送信先なし", async () => {
    setupSuperAdmin();
    mockPrisma.surveyToken.findMany.mockResolvedValue([]);
    mockPrisma.customer.findMany.mockResolvedValue([]); // 削除済み等で0件

    const result = await sendSurveyAction(validSurveyData);

    expect(result).toEqual({
      success: false,
      error: "有効な送信先が見つかりません",
    });
  });

  it("異常系: DB失敗", async () => {
    setupSuperAdmin();
    // findSurveyByEventId（try内）で失敗
    mockFindSurveyByEventId.mockRejectedValue(
      new Error("DB connection error")
    );

    const result = await sendSurveyAction(validSurveyData);

    expect(result).toEqual({
      success: false,
      error: "アンケートメールの送信中にエラーが発生しました",
    });
  });

  it("正常系: 再送のDB更新失敗時はfailedとして集計", async () => {
    setupSuperAdmin();
    mockPrisma.rsvp.findMany.mockResolvedValue([{ customerId: 10 }]);
    mockPrisma.surveyToken.findMany.mockResolvedValue([
      { customerId: 10, token: "existing-token-10" },
    ]);
    mockPrisma.customer.findMany.mockResolvedValue([
      {
        id: 10,
        lastName: "田中",
        firstName: "太郎",
        email: "tanaka@example.com",
      },
    ]);
    mockSendSurveyMailBatch.mockResolvedValue({
      sentCount: 1,
      failedCount: 0,
      failedNames: [],
      successCustomerIds: [10],
    });
    mockPrisma.surveyToken.update.mockRejectedValue(new Error("DB error"));

    const result = await sendSurveyAction({
      ...validSurveyData,
      customerIds: [10],
    });

    expect(result).toEqual({
      success: true,
      sentCount: 0,
      failedCount: 1,
      failedNames: ["田中 太郎"],
    });
  });

  it("異常系: 未終了イベントへの送信は拒否される", async () => {
    setupSuperAdmin();
    // 未来の日付 → closed ではない
    mockPrisma.event.findFirst.mockResolvedValue({
      id: 1,
      date: new Date("2099-12-31"),
      responseDeadline: null,
      isPaused: false,
    });

    const result = await sendSurveyAction(validSurveyData);

    expect(result).toEqual({
      success: false,
      error: "アンケートメールは終了したイベントのみ送信できます",
    });
  });

  it("異常系: 非参加者IDを含む送信は拒否される", async () => {
    setupSuperAdmin();
    // customerId: 10 のみが参加者、20 は非参加者
    mockPrisma.rsvp.findMany.mockResolvedValue([{ customerId: 10 }]);

    const result = await sendSurveyAction(validSurveyData);

    expect(result).toEqual({
      success: false,
      error: "選択された送信先にイベント参加者以外が含まれています",
    });
  });

  it("異常系: イベントが存在しない", async () => {
    setupSuperAdmin();
    mockPrisma.event.findFirst.mockResolvedValue(null);

    const result = await sendSurveyAction(validSurveyData);

    expect(result).toEqual({
      success: false,
      error: "イベントが見つかりません",
    });
  });

  it("revalidatePath が呼ばれる", async () => {
    setupSuperAdmin();
    mockPrisma.rsvp.findMany.mockResolvedValue([{ customerId: 10 }]);
    mockPrisma.surveyToken.findMany.mockResolvedValue([]);
    mockPrisma.customer.findMany.mockResolvedValue([
      {
        id: 10,
        lastName: "田中",
        firstName: "太郎",
        email: "tanaka@example.com",
      },
    ]);
    mockPrisma.surveyToken.createMany.mockResolvedValue({ count: 1 });
    mockSendSurveyMailBatch.mockResolvedValue({
      sentCount: 1,
      failedCount: 0,
      failedNames: [],
      successCustomerIds: [10],
    });

    await sendSurveyAction({ ...validSurveyData, customerIds: [10] });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/events/1");
  });
});

describe("sendTestSurveyAction", () => {
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

    const result = await sendTestSurveyAction(validTestSurveyData);

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

    await expect(
      sendTestSurveyAction(validTestSurveyData)
    ).rejects.toThrow("認証が必要です");
  });

  it("異常系: バリデーション失敗（emailTitle空）", async () => {
    mockRequireAuth.mockResolvedValue(superSession);

    const result = await sendTestSurveyAction({
      ...validTestSurveyData,
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

    const result = await sendTestSurveyAction(validTestSurveyData);

    expect(result).toEqual({
      success: false,
      error: "SMTP error",
    });
  });
});
