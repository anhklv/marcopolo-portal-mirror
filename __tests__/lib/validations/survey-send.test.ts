import { describe, it, expect } from "vitest";
import { sendSurveySchema, testSurveySchema } from "@/lib/validations/survey-send";

describe("sendSurveySchema", () => {
  const validData = {
    eventId: 1,
    customerIds: [10, 20],
    emailTitle: "【テストイベント】アンケートのお願い",
    emailBody: "テスト本文\n{SURVEY_URL}",
  };

  it("正常系: 全項目入力で成功", () => {
    const result = sendSurveySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("正常系: customerIds 1名で成功", () => {
    const result = sendSurveySchema.safeParse({
      ...validData,
      customerIds: [1],
    });
    expect(result.success).toBe(true);
  });

  it("正常系: emailTitle 200文字ちょうどで成功", () => {
    const result = sendSurveySchema.safeParse({
      ...validData,
      emailTitle: "あ".repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it("異常系: customerIds 空配列", () => {
    const result = sendSurveySchema.safeParse({
      ...validData,
      customerIds: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "送信先を1名以上選択してください"
      );
    }
  });

  it("異常系: emailTitle 空文字", () => {
    const result = sendSurveySchema.safeParse({
      ...validData,
      emailTitle: "",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: emailTitle 201文字", () => {
    const result = sendSurveySchema.safeParse({
      ...validData,
      emailTitle: "あ".repeat(201),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "メールタイトルは200文字以内で入力してください"
      );
    }
  });

  it("異常系: emailBody 空文字", () => {
    const result = sendSurveySchema.safeParse({
      ...validData,
      emailBody: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("testSurveySchema", () => {
  it("正常系: customerIds不要で成功", () => {
    const result = testSurveySchema.safeParse({
      eventId: 1,
      emailTitle: "テストタイトル",
      emailBody: "テスト本文",
    });
    expect(result.success).toBe(true);
  });

  it("異常系: emailTitle 空文字", () => {
    const result = testSurveySchema.safeParse({
      eventId: 1,
      emailTitle: "",
      emailBody: "テスト本文",
    });
    expect(result.success).toBe(false);
  });
});
