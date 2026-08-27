import { describe, it, expect } from "vitest";
import { serializeEventForDetail } from "@/lib/serializers/event";
import type { EventForDetail } from "@/lib/repositories/event.repository";

function makeEvent(overrides: Partial<EventForDetail> = {}): EventForDetail {
  return {
    id: 1,
    communityId: 1,
    title: "テストイベント",
    date: new Date("2026-03-01T18:00:00.000Z"),
    location: "東京",
    description: "テストの説明",
    timetable: "18:00 開始",
    note: "備考テスト",
    attendeesCount: 0,
    responseDeadline: new Date("2026-02-28T23:59:00.000Z"),
    isPaused: false,
    allowsOnline: true,
    hasAfterParty: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    deletedAt: null,
    community: {
      id: 1,
      code: "venture_auditor",
      name: "ベンチャー監査役の会",
      hasSurvey: true,
      sortOrder: 1,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
    rsvps: [
      {
        id: 10,
        eventId: 1,
        customerId: 100,
        token: "token-1",
        status: "attending",
        afterPartyStatus: "attending",
        comment: "楽しみです",
        respondedAt: new Date("2026-02-01T10:00:00.000Z"),
        createdAt: new Date("2026-01-15T00:00:00.000Z"),
        updatedAt: new Date("2026-01-15T00:00:00.000Z"),
        customer: {
          id: 100,
          lastName: "田中",
          firstName: "太郎",
          company: "テスト株式会社",
        },
      },
    ],
    ...overrides,
  };
}

describe("serializeEventForDetail", () => {
  it("Date型をISO文字列に変換する", () => {
    const event = makeEvent();
    const serialized = serializeEventForDetail(event);

    expect(serialized.date).toBe("2026-03-01T18:00:00.000Z");
    expect(serialized.responseDeadline).toBe("2026-02-28T23:59:00.000Z");
  });

  it("イベントの基本フィールドがシリアライズされる", () => {
    const serialized = serializeEventForDetail(makeEvent());

    expect(serialized.id).toBe(1);
    expect(serialized.title).toBe("テストイベント");
    expect(serialized.location).toBe("東京");
    expect(serialized.description).toBe("テストの説明");
    expect(serialized.timetable).toBe("18:00 開始");
    expect(serialized.note).toBe("備考テスト");
    expect(serialized.isPaused).toBe(false);
    expect(serialized.allowsOnline).toBe(true);
    expect(serialized.hasAfterParty).toBe(true);
  });

  it("communityが正しくシリアライズされる", () => {
    const serialized = serializeEventForDetail(makeEvent());

    expect(serialized.community).toEqual({
      id: 1,
      code: "venture_auditor",
      name: "ベンチャー監査役の会",
      hasSurvey: true,
    });
  });

  it("RSVPデータが正しくシリアライズされる", () => {
    const serialized = serializeEventForDetail(makeEvent());

    expect(serialized.rsvps).toHaveLength(1);
    expect(serialized.rsvps[0]).toEqual({
      id: 10,
      token: "token-1",
      status: "attending",
      afterPartyStatus: "attending",
      comment: "楽しみです",
      respondedAt: "2026-02-01T10:00:00.000Z",
      customer: {
        id: 100,
        lastName: "田中",
        firstName: "太郎",
        company: "テスト株式会社",
      },
    });
  });

  it("responseDeadlineがnullの場合はnullを返す", () => {
    const event = makeEvent({ responseDeadline: null });
    const serialized = serializeEventForDetail(event);

    expect(serialized.responseDeadline).toBeNull();
  });

  it("null値のフィールドが正しく処理される", () => {
    const event = makeEvent({
      location: null,
      description: null,
      timetable: null,
      note: null,
    });
    const serialized = serializeEventForDetail(event);

    expect(serialized.location).toBeNull();
    expect(serialized.description).toBeNull();
    expect(serialized.timetable).toBeNull();
    expect(serialized.note).toBeNull();
  });

  it("RSVPが空配列の場合は空配列を返す", () => {
    const event = makeEvent({ rsvps: [] });
    const serialized = serializeEventForDetail(event);

    expect(serialized.rsvps).toEqual([]);
  });

  it("respondedAtがnullのRSVPも正しくシリアライズされる", () => {
    const event = makeEvent({
      rsvps: [
        {
          id: 20,
          eventId: 1,
          customerId: 200,
          token: "token-2",
          status: "pending",
          afterPartyStatus: null,
          comment: null,
          respondedAt: null,
          createdAt: new Date("2026-01-15T00:00:00.000Z"),
          updatedAt: new Date("2026-01-15T00:00:00.000Z"),
          customer: {
            id: 200,
            lastName: "佐藤",
            firstName: "花子",
            company: null,
          },
        },
      ],
    });
    const serialized = serializeEventForDetail(event);

    expect(serialized.rsvps[0].respondedAt).toBeNull();
    expect(serialized.rsvps[0].afterPartyStatus).toBeNull();
    expect(serialized.rsvps[0].comment).toBeNull();
    expect(serialized.rsvps[0].customer.company).toBeNull();
  });
});
