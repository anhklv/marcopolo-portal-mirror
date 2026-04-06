import { describe, it, expect } from "vitest";
import { surveyAnswerSchema } from "@/lib/validations/survey-answer";

const validData = {
  token: "test-token-123",
  questionResponses: [
    { questionId: 1, rating: "excellent" as const, reason: "とても良かった" },
    { questionId: 2, rating: "good" as const },
  ],
  afterPartyRating: "excellent" as const,
  afterPartyReason: "楽しかった",
  futureParticipation: "definitely_yes" as const,
  futureParticipationReason: "また参加したい",
  membership: "want_to_join" as const,
  membershipReason: "入りたい",
  comments: "ありがとうございました",
};

describe("surveyAnswerSchema", () => {
  it("正常系: 全項目入力", () => {
    const result = surveyAnswerSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.token).toBe("test-token-123");
      expect(result.data.questionResponses).toHaveLength(2);
      expect(result.data.afterPartyRating).toBe("excellent");
      expect(result.data.futureParticipation).toBe("definitely_yes");
      expect(result.data.membership).toBe("want_to_join");
      expect(result.data.comments).toBe("ありがとうございました");
    }
  });

  it("正常系: 任意項目なし（最小構成）", () => {
    const result = surveyAnswerSchema.safeParse({
      token: "test-token",
      questionResponses: [{ questionId: 1, rating: "good" }],
      futureParticipation: "considering",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.afterPartyRating).toBeNull();
      expect(result.data.afterPartyReason).toBeNull();
      expect(result.data.membership).toBeNull();
      expect(result.data.membershipReason).toBeNull();
      expect(result.data.comments).toBeNull();
    }
  });

  it("正常系: reason空文字 → null変換", () => {
    const result = surveyAnswerSchema.safeParse({
      ...validData,
      questionResponses: [
        { questionId: 1, rating: "excellent", reason: "   " },
      ],
      afterPartyReason: "",
      futureParticipationReason: "  ",
      membershipReason: "",
      comments: "   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.questionResponses[0].reason).toBeNull();
      expect(result.data.afterPartyReason).toBeNull();
      expect(result.data.futureParticipationReason).toBeNull();
      expect(result.data.membershipReason).toBeNull();
      expect(result.data.comments).toBeNull();
    }
  });

  it("正常系: questionResponses空配列", () => {
    const result = surveyAnswerSchema.safeParse({
      token: "test-token",
      questionResponses: [],
      futureParticipation: "no",
    });
    expect(result.success).toBe(true);
  });

  it("異常系: token空文字", () => {
    const result = surveyAnswerSchema.safeParse({
      ...validData,
      token: "",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: rating不正値", () => {
    const result = surveyAnswerSchema.safeParse({
      ...validData,
      questionResponses: [
        { questionId: 1, rating: "invalid" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("異常系: futureParticipation未指定", () => {
    const result = surveyAnswerSchema.safeParse({
      token: "test-token",
      questionResponses: [],
    });
    expect(result.success).toBe(false);
  });

  it("異常系: futureParticipation不正値", () => {
    const result = surveyAnswerSchema.safeParse({
      ...validData,
      futureParticipation: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: reason 2001文字超", () => {
    const result = surveyAnswerSchema.safeParse({
      ...validData,
      questionResponses: [
        { questionId: 1, rating: "excellent", reason: "あ".repeat(2001) },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("異常系: comments 5001文字超", () => {
    const result = surveyAnswerSchema.safeParse({
      ...validData,
      comments: "あ".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("異常系: membership不正値", () => {
    const result = surveyAnswerSchema.safeParse({
      ...validData,
      membership: "invalid",
    });
    expect(result.success).toBe(false);
  });
});
