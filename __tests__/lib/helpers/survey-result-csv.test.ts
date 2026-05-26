import { describe, it, expect } from "vitest";
import { buildSurveyResultsCsv } from "@/lib/helpers/survey-result-csv";
import type { SerializedEventDetail, SerializedSurveyResult } from "@/lib/types/serialized";
import { COMMUNITY_CODE } from "@/lib/constants/community";

function makeEvent(overrides: Partial<SerializedEventDetail> = {}): SerializedEventDetail {
  return {
    id: 1,
    title: "テストイベント",
    date: new Date().toISOString(),
    location: null,
    description: null,
    timetable: null,
    note: null,
    isPaused: false,
    allowsOnline: false,
    hasAfterParty: false,
    responseDeadline: null,
    community: {
      id: 1,
      code: COMMUNITY_CODE.VENTURE_AUDITOR,
      name: "ベンチャー監査役の会",
      hasSurvey: true,
    },
    rsvps: [],
    ...overrides,
  };
}

function makeSurveyResult(
  overrides: Partial<SerializedSurveyResult> = {}
): SerializedSurveyResult {
  return {
    questions: [{ id: 1, title: "満足度", sortOrder: 0 }],
    questionResponses: [],
    fixedResponses: [],
    respondents: [],
    ...overrides,
  };
}

describe("buildSurveyResultsCsv", () => {
  it("BOM とヘッダ・データ行が含まれる", () => {
    const event = makeEvent();
    const surveyResult = makeSurveyResult({
      questionResponses: [
        { questionId: 1, customerId: 10, rating: "excellent", reason: null },
      ],
      fixedResponses: [
        {
          customerId: 10,
          afterPartyRating: null,
          afterPartyReason: null,
          futureParticipation: null,
          futureParticipationReason: null,
          membership: null,
          membershipReason: null,
          comments: "通常のコメント",
          respondedAt: "2024-06-15T10:30:00.000Z",
        },
      ],
      respondents: [
        {
          id: 10,
          lastName: "山田",
          firstName: "太郎",
          company: "テスト株式会社",
          isMemberOfVentureAuditor: true,
        },
      ],
    });

    const csv = buildSurveyResultsCsv(event, surveyResult);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("顧客ID,回答者,会社名,満足度");
    expect(csv).toContain("10,山田 太郎,テスト株式会社,よかった");
    expect(csv).toContain("通常のコメント");
  });

  it("懇親会列あり・理由付き評価は改行で連結される", () => {
    const event = makeEvent({ hasAfterParty: true });
    const surveyResult = makeSurveyResult({
      questionResponses: [
        { questionId: 1, customerId: 1, rating: "good", reason: "もう少し時間が欲しい" },
      ],
      fixedResponses: [
        {
          customerId: 1,
          afterPartyRating: "excellent",
          afterPartyReason: "雰囲気が良い",
          futureParticipation: null,
          futureParticipationReason: null,
          membership: null,
          membershipReason: null,
          comments: null,
          respondedAt: "2024-01-01T12:00:00.000Z",
        },
      ],
      respondents: [
        {
          id: 1,
          lastName: "田",
          firstName: "中",
          company: null,
          isMemberOfVentureAuditor: true,
        },
      ],
    });

    const csv = buildSurveyResultsCsv(event, surveyResult);
    expect(csv).toContain("満足度");
    expect(csv).toContain("懇親会");
    expect(csv).toContain("まぁよかった");
    expect(csv).toContain("もう少し時間が欲しい");
    expect(csv).toContain("懇親会");
    expect(csv).toContain("よかった");
    expect(csv).toContain("雰囲気が良い");
  });

  it("非会員がいる場合は今後の参加・入会列が含まれ会員行の該当セルは空白", () => {
    const event = makeEvent();
    const surveyResult = makeSurveyResult({
      questionResponses: [
        { questionId: 1, customerId: 1, rating: "excellent", reason: null },
        { questionId: 1, customerId: 2, rating: "good", reason: null },
      ],
      fixedResponses: [
        {
          customerId: 1,
          afterPartyRating: null,
          afterPartyReason: null,
          futureParticipation: null,
          futureParticipationReason: null,
          membership: null,
          membershipReason: null,
          comments: null,
          respondedAt: null,
        },
        {
          customerId: 2,
          afterPartyRating: null,
          afterPartyReason: null,
          futureParticipation: "definitely_yes",
          futureParticipationReason: null,
          membership: "considering",
          membershipReason: null,
          comments: null,
          respondedAt: null,
        },
      ],
      respondents: [
        {
          id: 1,
          lastName: "会員",
          firstName: "氏名",
          company: null,
          isMemberOfVentureAuditor: true,
        },
        {
          id: 2,
          lastName: "非会員",
          firstName: "氏名",
          company: null,
          isMemberOfVentureAuditor: false,
        },
      ],
    });

    const csv = buildSurveyResultsCsv(event, surveyResult);
    expect(csv).toContain("今後の参加について");
    expect(csv).toContain("ベンチャー監査役の会への入会について");
    expect(csv).toContain("会員 氏名");
    expect(csv).toContain("よかった");
    expect(csv).toContain("ぜひ参加したい");
    expect(csv).toContain("入会を検討したい");
  });

  it("コメントにカンマ・引用符が含まれてもエスケープされる", () => {
    const event = makeEvent();
    const surveyResult = makeSurveyResult({
      questionResponses: [
        { questionId: 1, customerId: 1, rating: "excellent", reason: null },
      ],
      fixedResponses: [
        {
          customerId: 1,
          afterPartyRating: null,
          afterPartyReason: null,
          futureParticipation: null,
          futureParticipationReason: null,
          membership: null,
          membershipReason: null,
          comments: '感想,あり"です',
          respondedAt: null,
        },
      ],
      respondents: [
        {
          id: 1,
          lastName: "A",
          firstName: "B",
          company: null,
          isMemberOfVentureAuditor: true,
        },
      ],
    });

    const csv = buildSurveyResultsCsv(event, surveyResult);
    expect(csv).toContain('感想,あり""です');
  });

  it("= で始まるセルは CSV インジェクション対策でエスケープされる", () => {
    const event = makeEvent();
    const surveyResult = makeSurveyResult({
      questionResponses: [
        { questionId: 1, customerId: 1, rating: "excellent", reason: null },
      ],
      fixedResponses: [
        {
          customerId: 1,
          afterPartyRating: null,
          afterPartyReason: null,
          futureParticipation: null,
          futureParticipationReason: null,
          membership: null,
          membershipReason: null,
          comments: "=SUM(A1:A10)",
          respondedAt: null,
        },
      ],
      respondents: [
        {
          id: 1,
          lastName: "A",
          firstName: "B",
          company: null,
          isMemberOfVentureAuditor: true,
        },
      ],
    });

    const csv = buildSurveyResultsCsv(event, surveyResult);
    expect(csv).toContain("'=SUM(A1:A10)");
  });

  it("ないかん等で非会員のみの場合は入会列が出力されない", () => {
    const event = makeEvent({
      community: {
        id: 2,
        code: COMMUNITY_CODE.NAIKAN_MEETUP,
        name: "ないかんMeetup",
        hasSurvey: true,
      },
    });
    const surveyResult = makeSurveyResult({
      questionResponses: [
        { questionId: 1, customerId: 1, rating: "good", reason: null },
      ],
      fixedResponses: [
        {
          customerId: 1,
          afterPartyRating: null,
          afterPartyReason: null,
          futureParticipation: "no",
          futureParticipationReason: null,
          membership: null,
          membershipReason: null,
          comments: null,
          respondedAt: null,
        },
      ],
      respondents: [
        {
          id: 1,
          lastName: "外",
          firstName: "部",
          company: null,
          isMemberOfVentureAuditor: false,
        },
      ],
    });

    const csv = buildSurveyResultsCsv(event, surveyResult);
    expect(csv).toContain("今後の参加について");
    expect(csv).not.toContain("への入会について");
    expect(csv).toContain("参加しない");
  });
});
