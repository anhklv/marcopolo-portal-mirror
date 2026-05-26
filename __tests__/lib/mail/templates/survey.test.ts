import { describe, it, expect } from "vitest";
import {
  generateSurveySubject,
  generateSurveyBody,
} from "@/lib/mail/templates/survey";

describe("generateSurveySubject", () => {
  it("イベントタイトルを含む件名を生成する", () => {
    const result = generateSurveySubject({
      eventTitle: "第10回ベンチャー監査役の会",
    });
    expect(result).toBe("【第10回ベンチャー監査役の会】アンケートのお願い");
  });
});

describe("generateSurveyBody", () => {
  it("{SURVEY_URL} プレースホルダを含む", () => {
    const result = generateSurveyBody({
      eventTitle: "テストイベント",
    });
    expect(result).toContain("{SURVEY_URL}");
  });

  it("{CUSTOMER_NAME} プレースホルダを含む", () => {
    const result = generateSurveyBody({
      eventTitle: "テストイベント",
    });
    expect(result).toContain("{CUSTOMER_NAME}");
  });

  it("イベントタイトルを含む", () => {
    const result = generateSurveyBody({
      eventTitle: "第10回ベンチャー監査役の会",
    });
    expect(result).toContain("第10回ベンチャー監査役の会");
  });
});
