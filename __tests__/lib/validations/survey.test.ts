import { describe, it, expect } from "vitest";
import { saveSurveySchema } from "@/lib/validations/survey";

describe("saveSurveySchema", () => {
  it("正常系: eventId + 設問1件", () => {
    const result = saveSurveySchema.safeParse({
      eventId: 1,
      questions: [{ title: "満足度は？", sortOrder: 0 }],
    });
    expect(result.success).toBe(true);
  });

  it("正常系: 設問0件（空配列OK）", () => {
    const result = saveSurveySchema.safeParse({
      eventId: 1,
      questions: [],
    });
    expect(result.success).toBe(true);
  });

  it("正常系: 500文字ちょうど", () => {
    const result = saveSurveySchema.safeParse({
      eventId: 1,
      questions: [{ title: "あ".repeat(500), sortOrder: 0 }],
    });
    expect(result.success).toBe(true);
  });

  it("正常系: 複数設問", () => {
    const result = saveSurveySchema.safeParse({
      eventId: 1,
      questions: [
        { title: "設問1", sortOrder: 0 },
        { title: "設問2", sortOrder: 1 },
        { title: "設問3", sortOrder: 2 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("正常系: 既存設問（id付き）", () => {
    const result = saveSurveySchema.safeParse({
      eventId: 1,
      questions: [{ id: 10, title: "既存設問", sortOrder: 0 }],
    });
    expect(result.success).toBe(true);
  });

  it("異常系: eventId=0", () => {
    const result = saveSurveySchema.safeParse({
      eventId: 0,
      questions: [],
    });
    expect(result.success).toBe(false);
  });

  it("異常系: eventId が負数", () => {
    const result = saveSurveySchema.safeParse({
      eventId: -1,
      questions: [],
    });
    expect(result.success).toBe(false);
  });

  it("異常系: 設問タイトルが空", () => {
    const result = saveSurveySchema.safeParse({
      eventId: 1,
      questions: [{ title: "", sortOrder: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("異常系: 設問タイトルが空白のみ → trim後に失敗", () => {
    const result = saveSurveySchema.safeParse({
      eventId: 1,
      questions: [{ title: "   ", sortOrder: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("異常系: 設問タイトルが501文字", () => {
    const result = saveSurveySchema.safeParse({
      eventId: 1,
      questions: [{ title: "あ".repeat(501), sortOrder: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("異常系: 2件目のみタイトル空", () => {
    const result = saveSurveySchema.safeParse({
      eventId: 1,
      questions: [
        { title: "設問1", sortOrder: 0 },
        { title: "", sortOrder: 1 },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const titleError = result.error.issues.find(
        (i) => i.path.join(".") === "questions.1.title"
      );
      expect(titleError).toBeDefined();
    }
  });
});
