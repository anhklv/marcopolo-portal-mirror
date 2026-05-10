import { describe, it, expect } from "vitest";
import {
  computeSurveyAggregation,
  toSurveyResultRows,
  getSurveyRatingBgClass,
} from "@/lib/helpers/survey-result";
import type { SerializedSurveyResult } from "@/lib/types/serialized";

// ============================================================
// テストデータヘルパー
// ============================================================

const makeSurveyResult = (
  overrides: Partial<SerializedSurveyResult> = {}
): SerializedSurveyResult => ({
  questions: [
    { id: 1, title: "設問1", sortOrder: 0 },
    { id: 2, title: "設問2", sortOrder: 1 },
  ],
  questionResponses: [],
  fixedResponses: [],
  respondents: [],
  ...overrides,
});

// ============================================================
// computeSurveyAggregation
// ============================================================

describe("computeSurveyAggregation", () => {
  it("カスタム設問ごとの評価カウントが正しい", () => {
    const data = makeSurveyResult({
      questions: [{ id: 1, title: "設問1", sortOrder: 0 }],
      questionResponses: [
        { questionId: 1, customerId: 1, rating: "excellent", reason: null },
        { questionId: 1, customerId: 2, rating: "excellent", reason: null },
        { questionId: 1, customerId: 3, rating: "good", reason: null },
        { questionId: 1, customerId: 4, rating: "fair", reason: null },
      ],
      respondents: [
        { id: 1, lastName: "田中", firstName: "太郎", company: null, isMemberOfVentureAuditor: true },
        { id: 2, lastName: "佐藤", firstName: "花子", company: null, isMemberOfVentureAuditor: true },
        { id: 3, lastName: "鈴木", firstName: "一郎", company: null, isMemberOfVentureAuditor: true },
        { id: 4, lastName: "高橋", firstName: "二郎", company: null, isMemberOfVentureAuditor: true },
      ],
    });

    const agg = computeSurveyAggregation(data, false, "venture_auditor");

    expect(agg.questions).toHaveLength(1);
    expect(agg.questions[0].ratingCounts).toEqual([
      { key: "excellent", label: "よかった", count: 2 },
      { key: "good", label: "まぁよかった", count: 1 },
      { key: "fair", label: "あまりよくなかった", count: 1 },
      { key: "poor", label: "よくなかった", count: 0 },
    ]);
  });

  it("懇親会ありの場合にafterPartyの集計が含まれる", () => {
    const data = makeSurveyResult({
      fixedResponses: [
        { customerId: 1, afterPartyRating: "excellent", afterPartyReason: null, futureParticipation: null, futureParticipationReason: null, membership: null, membershipReason: null, comments: null, respondedAt: null },
        { customerId: 2, afterPartyRating: "good", afterPartyReason: null, futureParticipation: null, futureParticipationReason: null, membership: null, membershipReason: null, comments: null, respondedAt: null },
      ],
      respondents: [
        { id: 1, lastName: "田中", firstName: "太郎", company: null, isMemberOfVentureAuditor: true },
        { id: 2, lastName: "佐藤", firstName: "花子", company: null, isMemberOfVentureAuditor: true },
      ],
    });

    const agg = computeSurveyAggregation(data, true, "venture_auditor");
    expect(agg.afterParty).not.toBeNull();
    expect(agg.afterParty![0]).toEqual({ key: "excellent", label: "よかった", count: 1 });
    expect(agg.afterParty![1]).toEqual({ key: "good", label: "まぁよかった", count: 1 });
  });

  it("懇親会なしの場合にafterPartyがnull", () => {
    const data = makeSurveyResult({
      respondents: [
        { id: 1, lastName: "田中", firstName: "太郎", company: null, isMemberOfVentureAuditor: true },
      ],
    });

    const agg = computeSurveyAggregation(data, false, "venture_auditor");
    expect(agg.afterParty).toBeNull();
  });

  it("非会員がいる場合に今後の参加・入会の集計が含まれる", () => {
    const data = makeSurveyResult({
      fixedResponses: [
        { customerId: 1, afterPartyRating: null, afterPartyReason: null, futureParticipation: "definitely_yes", futureParticipationReason: null, membership: "want_to_join", membershipReason: null, comments: null, respondedAt: null },
        { customerId: 2, afterPartyRating: null, afterPartyReason: null, futureParticipation: "considering", futureParticipationReason: null, membership: "considering", membershipReason: null, comments: null, respondedAt: null },
      ],
      respondents: [
        { id: 1, lastName: "田中", firstName: "太郎", company: null, isMemberOfVentureAuditor: false },
        { id: 2, lastName: "佐藤", firstName: "花子", company: null, isMemberOfVentureAuditor: false },
      ],
    });

    const agg = computeSurveyAggregation(data, false, "venture_auditor");

    expect(agg.futureParticipation).not.toBeNull();
    expect(agg.futureParticipation![0]).toEqual({ key: "definitely_yes", label: "ぜひ参加したい", count: 1 });
    expect(agg.futureParticipation![1]).toEqual({ key: "considering", label: "参加を検討したい", count: 1 });
    expect(agg.futureParticipation![2]).toEqual({ key: "no", label: "参加しない", count: 0 });

    expect(agg.membership).not.toBeNull();
    expect(agg.membership![0]).toEqual({ key: "want_to_join", label: "入会をしたい", count: 1 });
    expect(agg.membership![1]).toEqual({ key: "considering", label: "入会を検討したい", count: 1 });
    expect(agg.membership![2]).toEqual({ key: "not_interested", label: "関心がない", count: 0 });
  });

  it("全員が会員の場合に今後の参加・入会がnull", () => {
    const data = makeSurveyResult({
      respondents: [
        { id: 1, lastName: "田中", firstName: "太郎", company: null, isMemberOfVentureAuditor: true },
      ],
    });

    const agg = computeSurveyAggregation(data, false, "venture_auditor");
    expect(agg.futureParticipation).toBeNull();
    expect(agg.membership).toBeNull();
  });

  it("会員と非会員が混在する場合、非会員のみ集計される", () => {
    const data = makeSurveyResult({
      fixedResponses: [
        { customerId: 1, afterPartyRating: null, afterPartyReason: null, futureParticipation: "definitely_yes", futureParticipationReason: null, membership: "want_to_join", membershipReason: null, comments: null, respondedAt: null },
        { customerId: 2, afterPartyRating: null, afterPartyReason: null, futureParticipation: "considering", futureParticipationReason: null, membership: null, membershipReason: null, comments: null, respondedAt: null },
      ],
      respondents: [
        { id: 1, lastName: "田中", firstName: "太郎", company: null, isMemberOfVentureAuditor: false },
        { id: 2, lastName: "佐藤", firstName: "花子", company: null, isMemberOfVentureAuditor: true },
      ],
    });

    const agg = computeSurveyAggregation(data, false, "venture_auditor");
    // 非会員は1人なので futureParticipation は表示される
    expect(agg.futureParticipation).not.toBeNull();
    // customerId=1（非会員）のみカウント
    expect(agg.futureParticipation![0].count).toBe(1); // definitely_yes
    expect(agg.futureParticipation![1].count).toBe(0); // considering（会員なので除外）
  });

  it("ベンチャー監査役の会以外では入会がnull", () => {
    const data = makeSurveyResult({
      fixedResponses: [
        { customerId: 1, afterPartyRating: null, afterPartyReason: null, futureParticipation: "definitely_yes", futureParticipationReason: null, membership: "want_to_join", membershipReason: null, comments: null, respondedAt: null },
      ],
      respondents: [
        { id: 1, lastName: "田中", firstName: "太郎", company: null, isMemberOfVentureAuditor: false },
      ],
    });

    const agg = computeSurveyAggregation(data, false, "naikan_meetup");
    expect(agg.futureParticipation).not.toBeNull();
    expect(agg.membership).toBeNull();
  });

  it("空データの場合", () => {
    const data = makeSurveyResult();
    const agg = computeSurveyAggregation(data, false, "venture_auditor");

    expect(agg.questions).toHaveLength(2);
    expect(agg.questions[0].ratingCounts.every((r) => r.count === 0)).toBe(true);
    expect(agg.afterParty).toBeNull();
    expect(agg.futureParticipation).toBeNull();
    expect(agg.membership).toBeNull();
  });
});

// ============================================================
// toSurveyResultRows
// ============================================================

describe("toSurveyResultRows", () => {
  it("回答者ごとの行データを正しく構築する", () => {
    const data = makeSurveyResult({
      questions: [{ id: 1, title: "設問1", sortOrder: 0 }],
      questionResponses: [
        { questionId: 1, customerId: 1, rating: "excellent", reason: "素晴らしい" },
      ],
      fixedResponses: [
        {
          customerId: 1,
          afterPartyRating: "good",
          afterPartyReason: "楽しかった",
          futureParticipation: "definitely_yes",
          futureParticipationReason: null,
          membership: null,
          membershipReason: null,
          comments: "ありがとう",
          respondedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      respondents: [
        { id: 1, lastName: "田中", firstName: "太郎", company: "テスト社", isMemberOfVentureAuditor: true },
      ],
    });

    const rows = toSurveyResultRows(data);

    expect(rows).toHaveLength(1);
    expect(rows[0].customerId).toBe(1);
    expect(rows[0].lastName).toBe("田中");
    expect(rows[0].firstName).toBe("太郎");
    expect(rows[0].company).toBe("テスト社");
    expect(rows[0].isMemberOfVentureAuditor).toBe(true);
    expect(rows[0].questionResponses.get(1)).toEqual({ rating: "excellent", reason: "素晴らしい" });
    expect(rows[0].afterPartyRating).toBe("good");
    expect(rows[0].afterPartyReason).toBe("楽しかった");
    expect(rows[0].futureParticipation).toBe("definitely_yes");
    expect(rows[0].comments).toBe("ありがとう");
    expect(rows[0].respondedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("回答がない設問のquestionResponsesにはエントリがない", () => {
    const data = makeSurveyResult({
      questions: [
        { id: 1, title: "設問1", sortOrder: 0 },
        { id: 2, title: "設問2", sortOrder: 1 },
      ],
      questionResponses: [
        { questionId: 1, customerId: 1, rating: "good", reason: null },
      ],
      fixedResponses: [
        { customerId: 1, afterPartyRating: null, afterPartyReason: null, futureParticipation: null, futureParticipationReason: null, membership: null, membershipReason: null, comments: null, respondedAt: null },
      ],
      respondents: [
        { id: 1, lastName: "田中", firstName: "太郎", company: null, isMemberOfVentureAuditor: true },
      ],
    });

    const rows = toSurveyResultRows(data);
    expect(rows[0].questionResponses.has(1)).toBe(true);
    expect(rows[0].questionResponses.has(2)).toBe(false);
  });

  it("fixedResponseがない回答者はnull値になる", () => {
    const data = makeSurveyResult({
      fixedResponses: [],
      respondents: [
        { id: 1, lastName: "田中", firstName: "太郎", company: null, isMemberOfVentureAuditor: true },
      ],
    });

    const rows = toSurveyResultRows(data);
    expect(rows[0].afterPartyRating).toBeNull();
    expect(rows[0].comments).toBeNull();
    expect(rows[0].respondedAt).toBeNull();
  });

  it("空の回答者リストの場合は空配列", () => {
    const data = makeSurveyResult();
    const rows = toSurveyResultRows(data);
    expect(rows).toEqual([]);
  });
});

// ============================================================
// getSurveyRatingBgClass
// ============================================================

describe("getSurveyRatingBgClass", () => {
  it("excellent → bg-gray-50", () => {
    expect(getSurveyRatingBgClass("excellent")).toBe("!bg-gray-50 !text-gray-800");
  });

  it("good → bg-gray-100", () => {
    expect(getSurveyRatingBgClass("good")).toBe("!bg-gray-100 !text-gray-800");
  });

  it("fair → bg-gray-200", () => {
    expect(getSurveyRatingBgClass("fair")).toBe("!bg-gray-200 !text-gray-800");
  });

  it("poor → bg-gray-300", () => {
    expect(getSurveyRatingBgClass("poor")).toBe("!bg-gray-300 !text-gray-800");
  });

  it("definitely_yes → bg-gray-50", () => {
    expect(getSurveyRatingBgClass("definitely_yes")).toBe("!bg-gray-50 !text-gray-800");
  });

  it("considering → bg-gray-100 (FutureParticipation/MembershipInterest共通)", () => {
    expect(getSurveyRatingBgClass("considering")).toBe("!bg-gray-100 !text-gray-800");
  });

  it("no → bg-gray-300", () => {
    expect(getSurveyRatingBgClass("no")).toBe("!bg-gray-300 !text-gray-800");
  });

  it("want_to_join → bg-gray-50", () => {
    expect(getSurveyRatingBgClass("want_to_join")).toBe("!bg-gray-50 !text-gray-800");
  });

  it("not_interested → bg-gray-200", () => {
    expect(getSurveyRatingBgClass("not_interested")).toBe("!bg-gray-200 !text-gray-800");
  });

  it("null → 空文字", () => {
    expect(getSurveyRatingBgClass(null)).toBe("");
  });

  it("未知の値 → 空文字", () => {
    expect(getSurveyRatingBgClass("unknown")).toBe("");
  });
});
