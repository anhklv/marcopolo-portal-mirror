import { describe, it, expect, beforeAll } from "vitest";
import {
  toAttendeeRows,
  filterAttendees,
  computeEventSummary,
} from "@/lib/helpers/event-detail";
import type { SerializedRsvpForEventDetail } from "@/lib/types/serialized";
import type { AttendeeRow } from "@/lib/helpers/event-detail";

// テストデータ
const makeRsvp = (
  overrides: Partial<SerializedRsvpForEventDetail> & { id: number }
): SerializedRsvpForEventDetail => ({
  token: `token-${overrides.id}`,
  status: "pending",
  afterPartyStatus: null,
  comment: null,
  adminNote: null,
  respondedAt: null,
  customer: {
    id: overrides.id,
    lastName: "田中",
    firstName: "太郎",
    company: "テスト株式会社",
  },
  ...overrides,
});

const sampleRsvps: SerializedRsvpForEventDetail[] = [
  makeRsvp({
    id: 1,
    status: "attending",
    afterPartyStatus: "attending",
    comment: "楽しみです",
    respondedAt: "2026-01-10T10:00:00.000Z",
    customer: { id: 1, lastName: "田中", firstName: "太郎", company: "A社" },
  }),
  makeRsvp({
    id: 2,
    status: "online",
    afterPartyStatus: null,
    respondedAt: "2026-01-11T10:00:00.000Z",
    customer: { id: 2, lastName: "佐藤", firstName: "花子", company: "B社" },
  }),
  makeRsvp({
    id: 3,
    status: "absent",
    respondedAt: "2026-01-12T10:00:00.000Z",
    customer: { id: 3, lastName: "鈴木", firstName: "一郎", company: null },
  }),
  makeRsvp({
    id: 4,
    status: "pending",
    customer: { id: 4, lastName: "高橋", firstName: "次郎", company: "A社" },
  }),
  makeRsvp({
    id: 5,
    status: "attending",
    afterPartyStatus: "not_attending",
    respondedAt: "2026-01-13T10:00:00.000Z",
    customer: { id: 5, lastName: "渡辺", firstName: "三郎", company: "C社" },
  }),
];

describe("toAttendeeRows", () => {
  it("RSVPデータを正しく行データに変換する", () => {
    const rows = toAttendeeRows(sampleRsvps);

    expect(rows).toHaveLength(5);
    // 同一ステータス内は顧客ID降順なので、customerId=5の渡辺が先
    expect(rows[0]).toEqual({
      rsvpId: 5,
      customerId: 5,
      lastName: "渡辺",
      firstName: "三郎",
      company: "C社",
      status: "attending",
      afterPartyStatus: "not_attending",
      comment: null,
      adminNote: null,
      respondedAt: "2026-01-13T10:00:00.000Z",
    });
  });

  it("空配列を渡した場合は空配列を返す", () => {
    expect(toAttendeeRows([])).toEqual([]);
  });

  it("customer.companyがnullの場合もそのまま保持する", () => {
    const rows = toAttendeeRows(sampleRsvps);
    const nullCompanyRow = rows.find((r) => r.lastName === "鈴木");
    expect(nullCompanyRow?.company).toBeNull();
  });

  it("ステータス順にソートされる（attending → online → absent → pending）", () => {
    const rows = toAttendeeRows(sampleRsvps);
    expect(rows.map((r) => r.status)).toEqual([
      "attending",
      "attending",
      "online",
      "absent",
      "pending",
    ]);
  });

  it("同一ステータス内では顧客ID降順でソートされる", () => {
    const rows = toAttendeeRows(sampleRsvps);
    const attendingRows = rows.filter((r) => r.status === "attending");
    expect(attendingRows[0].customerId).toBe(5); // 渡辺
    expect(attendingRows[1].customerId).toBe(1); // 田中
  });
});

describe("filterAttendees", () => {
  let rows: AttendeeRow[];

  beforeAll(() => {
    rows = toAttendeeRows(sampleRsvps);
  });

  it("キーワード空・ステータス空 → 全件返す", () => {
    expect(filterAttendees(rows, "", [])).toHaveLength(5);
  });

  it("氏名でキーワード検索", () => {
    const result = filterAttendees(rows, "田中", []);
    expect(result).toHaveLength(1);
    expect(result[0].lastName).toBe("田中");
  });

  it("姓名をスペース区切りで検索できること（例: '田中 太郎'）", () => {
    const result = filterAttendees(rows, "田中 太郎", []);
    expect(result).toHaveLength(1);
    expect(result[0].lastName).toBe("田中");
  });

  it("会社名でキーワード検索", () => {
    const result = filterAttendees(rows, "A社", []);
    expect(result).toHaveLength(2); // 田中太郎(A社)、高橋次郎(A社)
  });

  it("大文字小文字を区別しない", () => {
    const result = filterAttendees(rows, "a社", []);
    expect(result).toHaveLength(2);
  });

  it("ステータスフィルタ（attending）", () => {
    const result = filterAttendees(rows, "", ["attending"]);
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.status === "attending")).toBe(true);
  });

  it("ステータスフィルタ（複数）", () => {
    const result = filterAttendees(rows, "", ["attending", "online"]);
    expect(result).toHaveLength(3);
  });

  it("キーワード + ステータスの組み合わせ", () => {
    const result = filterAttendees(rows, "田中", ["attending"]);
    expect(result).toHaveLength(1);
    expect(result[0].lastName).toBe("田中");
    expect(result[0].status).toBe("attending");
  });

  it("一致なしの場合は空配列を返す", () => {
    const result = filterAttendees(rows, "存在しない名前", []);
    expect(result).toHaveLength(0);
  });

  it("スペース区切りでAND検索できること（姓名の組み合わせ）", () => {
    const result = filterAttendees(rows, "田中 太郎", []);
    expect(result).toHaveLength(1);
    expect(result[0].lastName).toBe("田中");
  });

  it("全角スペース区切りでもAND検索できること", () => {
    const result = filterAttendees(rows, "佐藤\u3000花子", []);
    expect(result).toHaveLength(1);
    expect(result[0].lastName).toBe("佐藤");
  });

  it("姓名の逆順でもヒットすること", () => {
    const result = filterAttendees(rows, "太郎 田中", []);
    expect(result).toHaveLength(1);
    expect(result[0].lastName).toBe("田中");
  });

  it("AND検索で全トークンが含まれない場合はヒットしないこと", () => {
    const result = filterAttendees(rows, "田中 花子", []);
    expect(result).toHaveLength(0);
  });

  it("会社名がnullの行はキーワード検索でスキップされる", () => {
    const result = filterAttendees(rows, "B社", []);
    // 鈴木一郎(company=null)は含まれない
    expect(result).toHaveLength(1);
    expect(result[0].lastName).toBe("佐藤");
  });
});

describe("computeEventSummary", () => {
  it("各ステータスのカウントが正しい", () => {
    const rows = toAttendeeRows(sampleRsvps);
    const summary = computeEventSummary(rows);

    expect(summary).toEqual({
      onsiteCount: 2,
      onlineCount: 1,
      afterPartyCount: 1, // afterPartyStatus === "attending" のみ
      absentCount: 1,
      pendingCount: 1,
    });
  });

  it("空配列の場合は全て0", () => {
    const summary = computeEventSummary([]);
    expect(summary).toEqual({
      onsiteCount: 0,
      onlineCount: 0,
      afterPartyCount: 0,
      absentCount: 0,
      pendingCount: 0,
    });
  });

  it("全員未回答の場合", () => {
    const pendingOnly = toAttendeeRows([
      makeRsvp({ id: 1, status: "pending" }),
      makeRsvp({ id: 2, status: "pending" }),
    ]);
    const summary = computeEventSummary(pendingOnly);
    expect(summary.pendingCount).toBe(2);
    expect(summary.onsiteCount).toBe(0);
    expect(summary.onlineCount).toBe(0);
    expect(summary.absentCount).toBe(0);
    expect(summary.afterPartyCount).toBe(0);
  });

  it("懇親会カウントはafterPartyStatus=attendingのみ", () => {
    const mixed = toAttendeeRows([
      makeRsvp({ id: 1, status: "attending", afterPartyStatus: "attending" }),
      makeRsvp({
        id: 2,
        status: "attending",
        afterPartyStatus: "not_attending",
      }),
      makeRsvp({ id: 3, status: "attending", afterPartyStatus: null }),
    ]);
    const summary = computeEventSummary(mixed);
    expect(summary.afterPartyCount).toBe(1);
  });
});
