import { describe, it, expect, vi, beforeEach } from "vitest";
import "@/__tests__/helpers/mock-prisma";

// repository のモック
const mockFindSurveyTokenByToken = vi.fn();
const mockFindExistingResponses = vi.fn();
const mockSaveSurveyResponses = vi.fn();

vi.mock("@/lib/repositories/survey.repository", () => ({
  findSurveyTokenByToken: (...args: unknown[]) =>
    mockFindSurveyTokenByToken(...args),
  findExistingResponses: (...args: unknown[]) =>
    mockFindExistingResponses(...args),
  saveSurveyResponses: (...args: unknown[]) =>
    mockSaveSurveyResponses(...args),
}));

import { submitSurveyAnswerAction } from "@/lib/actions/survey-answer.actions";

// テストデータ
function createMockSurveyTokenData(
  overrides: Record<string, unknown> = {}
) {
  return {
    id: 1,
    surveyId: 100,
    customerId: 200,
    token: "test-token-123",
    survey: {
      id: 100,
      eventId: 10,
      questions: [
        { id: 1, surveyId: 100, title: "第1部の感想", sortOrder: 0 },
        { id: 2, surveyId: 100, title: "第2部の感想", sortOrder: 1 },
      ],
      event: {
        id: 10,
        deletedAt: null,
        hasAfterParty: true,
        community: { id: 1, code: "venture_auditor", name: "ベンチャー監査役の会" },
      },
    },
    customer: {
      id: 200,
      lastName: "山田",
      firstName: "太郎",
      deletedAt: null,
      customerCommunities: [],
    },
    ...overrides,
  };
}

const validFormData = {
  token: "test-token-123",
  questionResponses: [
    { questionId: 1, rating: "excellent" as const, reason: "とても良かった" },
    { questionId: 2, rating: "good" as const, reason: "良かった" },
  ],
  afterPartyRating: "excellent" as const,
  afterPartyReason: "楽しかった",
  futureParticipation: "definitely_yes" as const,
  futureParticipationReason: "また参加したい",
  membership: "want_to_join" as const,
  membershipReason: "入りたい",
  comments: "ありがとうございました",
};

describe("submitSurveyAnswerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================
  // 正常系
  // =========================================================

  it("正常系: 回答保存成功", async () => {
    const tokenData = createMockSurveyTokenData();
    mockFindSurveyTokenByToken.mockResolvedValue(tokenData);
    mockFindExistingResponses.mockResolvedValue(false);
    mockSaveSurveyResponses.mockResolvedValue(undefined);

    const result = await submitSurveyAnswerAction(validFormData);

    expect(result).toEqual({ success: true });
    expect(mockFindSurveyTokenByToken).toHaveBeenCalledWith("test-token-123");
    expect(mockFindExistingResponses).toHaveBeenCalledWith(100, 200);
    expect(mockSaveSurveyResponses).toHaveBeenCalledWith({
      surveyTokenId: 1,
      surveyId: 100,
      customerId: 200,
      questionResponses: [
        { questionId: 1, rating: "excellent", reason: "とても良かった" },
        { questionId: 2, rating: "good", reason: "良かった" },
      ],
      afterPartyRating: "excellent",
      afterPartyReason: "楽しかった",
      futureParticipation: "definitely_yes",
      futureParticipationReason: "また参加したい",
      membership: "want_to_join",
      membershipReason: "入りたい",
      comments: "ありがとうございました",
    });
  });

  // =========================================================
  // 異常系
  // =========================================================

  it("異常系: バリデーション失敗", async () => {
    const result = await submitSurveyAnswerAction({
      token: "",
      questionResponses: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
    expect(mockFindSurveyTokenByToken).not.toHaveBeenCalled();
  });

  it("異常系: 無効トークン", async () => {
    mockFindSurveyTokenByToken.mockResolvedValue(null);

    const result = await submitSurveyAnswerAction(validFormData);

    expect(result).toEqual({ success: false, error: "無効なトークンです" });
  });

  it("異常系: イベント削除済み", async () => {
    const tokenData = createMockSurveyTokenData({
      survey: {
        ...createMockSurveyTokenData().survey,
        event: {
          ...createMockSurveyTokenData().survey.event,
          deletedAt: new Date(),
        },
      },
    });
    mockFindSurveyTokenByToken.mockResolvedValue(tokenData);

    const result = await submitSurveyAnswerAction(validFormData);

    expect(result).toEqual({
      success: false,
      error: "このイベントは終了しました",
    });
    expect(mockSaveSurveyResponses).not.toHaveBeenCalled();
  });

  it("異常系: 顧客削除済み", async () => {
    const tokenData = createMockSurveyTokenData({
      customer: {
        ...createMockSurveyTokenData().customer,
        deletedAt: new Date(),
      },
    });
    mockFindSurveyTokenByToken.mockResolvedValue(tokenData);

    const result = await submitSurveyAnswerAction(validFormData);

    expect(result).toEqual({ success: false, error: "アクセスできません" });
    expect(mockSaveSurveyResponses).not.toHaveBeenCalled();
  });

  it("異常系: 二重回答", async () => {
    const tokenData = createMockSurveyTokenData();
    mockFindSurveyTokenByToken.mockResolvedValue(tokenData);
    mockFindExistingResponses.mockResolvedValue(true);

    const result = await submitSurveyAnswerAction(validFormData);

    expect(result).toEqual({ success: false, error: "既に回答済みです" });
    expect(mockSaveSurveyResponses).not.toHaveBeenCalled();
  });

  it("異常系: 不正な設問ID", async () => {
    const tokenData = createMockSurveyTokenData();
    mockFindSurveyTokenByToken.mockResolvedValue(tokenData);
    mockFindExistingResponses.mockResolvedValue(false);

    const result = await submitSurveyAnswerAction({
      ...validFormData,
      questionResponses: [
        { questionId: 1, rating: "excellent" },
        { questionId: 999, rating: "good" },
      ],
    });

    expect(result).toEqual({
      success: false,
      error: "不正な設問が含まれています",
    });
    expect(mockSaveSurveyResponses).not.toHaveBeenCalled();
  });

  it("異常系: 設問数不一致", async () => {
    const tokenData = createMockSurveyTokenData();
    mockFindSurveyTokenByToken.mockResolvedValue(tokenData);
    mockFindExistingResponses.mockResolvedValue(false);

    const result = await submitSurveyAnswerAction({
      ...validFormData,
      questionResponses: [
        { questionId: 1, rating: "excellent" },
      ],
    });

    expect(result).toEqual({
      success: false,
      error: "すべての設問に回答してください",
    });
    expect(mockSaveSurveyResponses).not.toHaveBeenCalled();
  });

  it("異常系: 重複questionId", async () => {
    const tokenData = createMockSurveyTokenData();
    mockFindSurveyTokenByToken.mockResolvedValue(tokenData);
    mockFindExistingResponses.mockResolvedValue(false);

    const result = await submitSurveyAnswerAction({
      ...validFormData,
      questionResponses: [
        { questionId: 1, rating: "excellent" },
        { questionId: 1, rating: "good" },
      ],
    });

    expect(result).toEqual({
      success: false,
      error: "設問IDが重複しています",
    });
    expect(mockSaveSurveyResponses).not.toHaveBeenCalled();
  });

  it("正常系: hasAfterParty=false → afterParty系がnullで保存される", async () => {
    const tokenData = createMockSurveyTokenData({
      survey: {
        ...createMockSurveyTokenData().survey,
        event: {
          ...createMockSurveyTokenData().survey.event,
          hasAfterParty: false,
        },
      },
    });
    mockFindSurveyTokenByToken.mockResolvedValue(tokenData);
    mockFindExistingResponses.mockResolvedValue(false);
    mockSaveSurveyResponses.mockResolvedValue(undefined);

    const result = await submitSurveyAnswerAction(validFormData);

    expect(result).toEqual({ success: true });
    expect(mockSaveSurveyResponses).toHaveBeenCalledWith(
      expect.objectContaining({
        afterPartyRating: null,
        afterPartyReason: null,
      })
    );
  });

  it("正常系: venture_auditorの会員 → membership系がnullで保存される", async () => {
    const tokenData = createMockSurveyTokenData({
      customer: {
        ...createMockSurveyTokenData().customer,
        customerCommunities: [
          { resignedAt: null, community: { code: "venture_auditor" } },
        ],
      },
    });
    mockFindSurveyTokenByToken.mockResolvedValue(tokenData);
    mockFindExistingResponses.mockResolvedValue(false);
    mockSaveSurveyResponses.mockResolvedValue(undefined);

    const result = await submitSurveyAnswerAction(validFormData);

    expect(result).toEqual({ success: true });
    expect(mockSaveSurveyResponses).toHaveBeenCalledWith(
      expect.objectContaining({
        membership: null,
        membershipReason: null,
      })
    );
  });

  it("異常系: DB保存失敗", async () => {
    const tokenData = createMockSurveyTokenData();
    mockFindSurveyTokenByToken.mockResolvedValue(tokenData);
    mockFindExistingResponses.mockResolvedValue(false);
    mockSaveSurveyResponses.mockRejectedValue(new Error("DB error"));

    const result = await submitSurveyAnswerAction(validFormData);

    expect(result).toEqual({
      success: false,
      error: "回答の送信中にエラーが発生しました",
    });
  });
});
