import { describe, it, expect } from "vitest";
import { serializeRsvpForPage } from "@/lib/serializers/rsvp";
import type { RsvpForPage } from "@/lib/repositories/rsvp.repository";

function createMockRsvp(
  overrides: Partial<RsvpForPage> = {}
): RsvpForPage {
  return {
    id: 1,
    eventId: 10,
    customerId: 20,
    token: "test-token-123",
    status: "pending",
    afterPartyStatus: null,
    comment: null,
    respondedAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    event: {
      id: 10,
      communityId: 1,
      title: "テストイベント",
      date: new Date("2026-03-01T18:00:00Z"),
      location: "東京都千代田区",
      description: "イベント概要",
      timetable: "18:00 開場",
      note: "備考",
      attendeesCount: 0,
      responseDeadline: new Date("2026-02-28T23:59:59Z"),
      isPaused: false,
      allowsOnline: true,
      hasAfterParty: true,
      deletedAt: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
      community: {
        name: "ベンチャー監査役の会",
      },
    },
    customer: {
      id: 20,
      lastName: "山田",
      firstName: "太郎",
      deletedAt: null,
    },
    ...overrides,
  };
}

describe("serializeRsvpForPage", () => {
  it("全フィールドが正しくシリアライズされる", () => {
    const rsvp = createMockRsvp();
    const result = serializeRsvpForPage(rsvp);

    expect(result.event.id).toBe(10);
    expect(result.event.title).toBe("テストイベント");
    expect(result.event.date).toBe("2026-03-01T18:00:00.000Z");
    expect(result.event.location).toBe("東京都千代田区");
    expect(result.event.description).toBe("イベント概要");
    expect(result.event.timetable).toBe("18:00 開場");
    expect(result.event.note).toBe("備考");
    expect(result.event.allowsOnline).toBe(true);
    expect(result.event.hasAfterParty).toBe(true);
    expect(result.event.responseDeadline).toBe("2026-02-28T23:59:59.000Z");
    expect(result.event.community.name).toBe("ベンチャー監査役の会");

    expect(result.rsvp.id).toBe(1);
    expect(result.rsvp.token).toBe("test-token-123");
    expect(result.rsvp.status).toBe("pending");
    expect(result.rsvp.afterPartyStatus).toBeNull();
    expect(result.rsvp.comment).toBeNull();
    expect(result.rsvp.respondedAt).toBeNull();

    expect(result.customer.lastName).toBe("山田");
    expect(result.customer.firstName).toBe("太郎");
  });

  it("responseDeadline=null → null", () => {
    const rsvp = createMockRsvp({
      event: {
        ...createMockRsvp().event,
        responseDeadline: null,
      },
    });
    const result = serializeRsvpForPage(rsvp);
    expect(result.event.responseDeadline).toBeNull();
  });

  it("respondedAt が Date → ISO文字列に変換される", () => {
    const rsvp = createMockRsvp({
      respondedAt: new Date("2026-02-20T10:30:00Z"),
    });
    const result = serializeRsvpForPage(rsvp);
    expect(result.rsvp.respondedAt).toBe("2026-02-20T10:30:00.000Z");
  });

  it("回答済みRSVPのフィールドが正しくシリアライズされる", () => {
    const rsvp = createMockRsvp({
      status: "attending",
      afterPartyStatus: "attending",
      comment: "楽しみにしています",
      respondedAt: new Date("2026-02-20T10:30:00Z"),
    });
    const result = serializeRsvpForPage(rsvp);

    expect(result.rsvp.status).toBe("attending");
    expect(result.rsvp.afterPartyStatus).toBe("attending");
    expect(result.rsvp.comment).toBe("楽しみにしています");
    expect(result.rsvp.respondedAt).toBe("2026-02-20T10:30:00.000Z");
  });

  it("location/description/timetable/noteがnullの場合", () => {
    const rsvp = createMockRsvp({
      event: {
        ...createMockRsvp().event,
        location: null,
        description: null,
        timetable: null,
        note: null,
      },
    });
    const result = serializeRsvpForPage(rsvp);

    expect(result.event.location).toBeNull();
    expect(result.event.description).toBeNull();
    expect(result.event.timetable).toBeNull();
    expect(result.event.note).toBeNull();
  });
});
