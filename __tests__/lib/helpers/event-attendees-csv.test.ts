import { describe, it, expect } from "vitest";
import { buildEventAttendeesCsv } from "@/lib/helpers/event-attendees-csv";
import type { SerializedEventDetail } from "@/lib/types/serialized";
import type { AttendeeRow } from "@/lib/helpers/event-detail";
import { COMMUNITY_CODE } from "@/lib/constants/community";

function makeEvent(
  overrides: Partial<SerializedEventDetail> = {}
): SerializedEventDetail {
  return {
    id: 1,
    title: "テスト",
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

function row(overrides: Partial<AttendeeRow> = {}): AttendeeRow {
  return {
    rsvpId: 1,
    customerId: 10,
    lastName: "山田",
    firstName: "太郎",
    company: "株式会社テスト",
    status: "attending",
    afterPartyStatus: null,
    comment: null,
    respondedAt: "2024-06-01T15:00:00.000Z",
    ...overrides,
  };
}

describe("buildEventAttendeesCsv", () => {
  it("BOM とヘッダ・参加ラベルが含まれる（懇親会列なし）", () => {
    const csv = buildEventAttendeesCsv(makeEvent(), [row()]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain(
      "顧客ID,氏名,会社名,ステータス,回答日時,メッセージ"
    );
    expect(csv).toContain("10,山田 太郎,株式会社テスト,参加");
  });

  it("懇親会列ありのときヘッダと懇親会ラベルが含まれる", () => {
    const csv = buildEventAttendeesCsv(
      makeEvent({ hasAfterParty: true }),
      [
        row({
          afterPartyStatus: "attending",
        }),
      ]
    );
    expect(csv).toContain("懇親会");
    expect(csv).toContain("参加");
  });

  it("空の会社名・メッセージは空セルとして出る", () => {
    const csv = buildEventAttendeesCsv(
      makeEvent(),
      [
        row({
          company: null,
          comment: null,
          respondedAt: null,
        }),
      ]
    );
    const lines = csv.split("\n").filter((l) => l.length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines[1]).toContain("10,山田 太郎,,参加");
  });
});
