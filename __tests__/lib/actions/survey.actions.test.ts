import { describe, it, expect, vi, beforeEach } from "vitest";
import "@/__tests__/helpers/mock-prisma";

// next/cache のモック
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// requireAuthenticatedAdmin, canManageSurvey のモック
const mockRequireAuthenticatedAdmin = vi.fn();
const mockCanManageSurvey = vi.fn();

vi.mock("@/lib/auth/permissions", () => ({
  requireAuthenticatedAdmin: (...args: unknown[]) => mockRequireAuthenticatedAdmin(...args),
  canManageSurvey: (...args: unknown[]) => mockCanManageSurvey(...args),
}));

// repository のモック
const mockFindSurveyByEventId = vi.fn();
const mockCreateSurvey = vi.fn();
const mockUpdateSurveyQuestions = vi.fn();

vi.mock("@/lib/repositories/survey.repository", () => ({
  findSurveyByEventId: (...args: unknown[]) => mockFindSurveyByEventId(...args),
  createSurvey: (...args: unknown[]) => mockCreateSurvey(...args),
  updateSurveyQuestions: (...args: unknown[]) => mockUpdateSurveyQuestions(...args),
}));

import {
  saveSurveyAction,
  skipSurveyAction,
} from "@/lib/actions/survey.actions";

// テストデータ
const validFormData = {
  eventId: 1,
  questions: [
    { title: "満足度は？", sortOrder: 0 },
    { title: "改善点は？", sortOrder: 1 },
  ],
};

function setupSuperAdmin() {
  mockRequireAuthenticatedAdmin.mockResolvedValue({
    admin: { id: 1, role: "super", adminCommunities: [] },
    isSuper: true,
    scopedCommunityIds: [1, 2, 3],
  });
}

// ============================================================
// saveSurveyAction
// ============================================================

describe("saveSurveyAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: 新規作成 → createSurvey呼出 → surveyId返却", async () => {
    setupSuperAdmin();
    mockCanManageSurvey.mockResolvedValue(true);
    mockFindSurveyByEventId.mockResolvedValue(null);
    mockCreateSurvey.mockResolvedValue({ id: 10 });

    const result = await saveSurveyAction(validFormData);

    expect(result).toEqual({ success: true, surveyId: 10 });
    expect(mockCreateSurvey).toHaveBeenCalledWith({
      eventId: 1,
      questions: [
        { title: "満足度は？", sortOrder: 0 },
        { title: "改善点は？", sortOrder: 1 },
      ],
    });
  });

  it("正常系: 更新 → updateSurveyQuestions呼出", async () => {
    setupSuperAdmin();
    mockCanManageSurvey.mockResolvedValue(true);
    mockFindSurveyByEventId.mockResolvedValue({ id: 5, eventId: 1, questions: [] });
    mockUpdateSurveyQuestions.mockResolvedValue({ id: 5 });

    const result = await saveSurveyAction(validFormData);

    expect(result).toEqual({ success: true, surveyId: 5 });
    expect(mockUpdateSurveyQuestions).toHaveBeenCalledWith(5, [
      { title: "満足度は？", sortOrder: 0 },
      { title: "改善点は？", sortOrder: 1 },
    ]);
  });

  it("正常系: 設問0件で保存", async () => {
    setupSuperAdmin();
    mockCanManageSurvey.mockResolvedValue(true);
    mockFindSurveyByEventId.mockResolvedValue(null);
    mockCreateSurvey.mockResolvedValue({ id: 11 });

    const result = await saveSurveyAction({ eventId: 1, questions: [] });

    expect(result).toEqual({ success: true, surveyId: 11 });
    expect(mockCreateSurvey).toHaveBeenCalledWith({
      eventId: 1,
      questions: [],
    });
  });

  it("異常系: 未認証 → エラー", async () => {
    mockRequireAuthenticatedAdmin.mockRejectedValue(new Error("認証が必要です"));

    await expect(saveSurveyAction(validFormData)).rejects.toThrow("認証が必要です");
  });

  it("異常系: 権限なし → エラー", async () => {
    setupSuperAdmin();
    mockCanManageSurvey.mockResolvedValue(false);

    const result = await saveSurveyAction(validFormData);

    expect(result).toEqual({
      success: false,
      error: "このイベントのアンケートを操作する権限がありません",
    });
  });

  it("異常系: バリデーション失敗 → fieldErrors返却", async () => {
    setupSuperAdmin();

    const result = await saveSurveyAction({
      eventId: 1,
      questions: [{ title: "", sortOrder: 0 }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toHaveProperty("questions.0.title");
    }
  });

  it("異常系: DB失敗 → エラー返却", async () => {
    setupSuperAdmin();
    mockCanManageSurvey.mockResolvedValue(true);
    mockFindSurveyByEventId.mockResolvedValue(null);
    mockCreateSurvey.mockRejectedValue(new Error("DB error"));

    const result = await saveSurveyAction(validFormData);

    expect(result).toEqual({
      success: false,
      error: "アンケートの保存に失敗しました",
    });
  });

  it("成功時に revalidatePath が呼ばれること", async () => {
    setupSuperAdmin();
    mockCanManageSurvey.mockResolvedValue(true);
    mockFindSurveyByEventId.mockResolvedValue(null);
    mockCreateSurvey.mockResolvedValue({ id: 20 });

    await saveSurveyAction(validFormData);

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/events/1/survey");
  });
});

// ============================================================
// skipSurveyAction
// ============================================================

describe("skipSurveyAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: 新規作成（設問なし）", async () => {
    setupSuperAdmin();
    mockCanManageSurvey.mockResolvedValue(true);
    mockFindSurveyByEventId.mockResolvedValue(null);
    mockCreateSurvey.mockResolvedValue({ id: 30 });

    const result = await skipSurveyAction(1);

    expect(result).toEqual({ success: true, surveyId: 30 });
    expect(mockCreateSurvey).toHaveBeenCalledWith({
      eventId: 1,
      questions: [],
    });
  });

  it("正常系: 既存ありならそのIDを返す", async () => {
    setupSuperAdmin();
    mockCanManageSurvey.mockResolvedValue(true);
    mockFindSurveyByEventId.mockResolvedValue({ id: 5, eventId: 1, questions: [] });

    const result = await skipSurveyAction(1);

    expect(result).toEqual({ success: true, surveyId: 5 });
    expect(mockCreateSurvey).not.toHaveBeenCalled();
  });

  it("異常系: 未認証 → エラー", async () => {
    mockRequireAuthenticatedAdmin.mockRejectedValue(new Error("認証が必要です"));

    await expect(skipSurveyAction(1)).rejects.toThrow("認証が必要です");
  });

  it("異常系: 権限なし → エラー", async () => {
    setupSuperAdmin();
    mockCanManageSurvey.mockResolvedValue(false);

    const result = await skipSurveyAction(1);

    expect(result).toEqual({
      success: false,
      error: "このイベントのアンケートを操作する権限がありません",
    });
  });

  it("異常系: DB失敗 → エラー返却", async () => {
    setupSuperAdmin();
    mockCanManageSurvey.mockResolvedValue(true);
    mockFindSurveyByEventId.mockResolvedValue(null);
    mockCreateSurvey.mockRejectedValue(new Error("DB error"));

    const result = await skipSurveyAction(1);

    expect(result).toEqual({
      success: false,
      error: "アンケートの作成に失敗しました",
    });
  });
});
