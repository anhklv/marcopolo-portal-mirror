import { describe, it, expect } from "vitest";
import {
  buildEventAttendeesCsv,
  toEventAttendeeCsvRows,
  type EventAttendeeCsvRow,
} from "@/lib/helpers/event-attendees-csv";
import type { SerializedEventDetail } from "@/lib/types/serialized";
import type { EventForAttendeesExport } from "@/lib/repositories/event.repository";
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

function row(
  overrides: Partial<EventAttendeeCsvRow> = {}
): EventAttendeeCsvRow {
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
    lastNameKana: "ヤマダ",
    firstNameKana: "タロウ",
    email: "taro.yamada@example.com",
    subEmails: ["sub1@example.com", "sub2@example.com"],
    phone: "0312345678",
    listingCategory: {
      marketName: "プライム",
    },
    postalCode: "1000001",
    prefectureName: "東京都",
    city: "千代田区千代田1-1",
    gender: "male",
    jobChangeIntent: "active",
    note: "備考テキスト",
    customerDepartments: [
      { name: "内部監査室", note: null },
      { name: "監査役", note: null },
      { name: "管理部門", note: null },
      { name: "経営者", note: null },
      { name: "コンサルタント", note: null },
      { name: "スポンサー", note: null },
      { name: "オブザーバー", note: null },
      { name: "その他", note: "その他所属内容" },
    ],
    ...overrides,
  };
}

describe("buildEventAttendeesCsv", () => {
  it("BOM とヘッダ・参加ラベルが含まれる（懇親会列なし）", () => {
    const csv = buildEventAttendeesCsv(makeEvent(), [row()]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.split("\n")[0].replace(/^\uFEFF/, "").split(",")).toEqual([
      "顧客ID",
      "氏名",
      "会社名",
      "ステータス",
      "回答日時",
      "メッセージ",
      "姓",
      "名",
      "セイ",
      "メイ",
      "メールアドレス",
      "サブメール1",
      "サブメール2",
      "サブメール3",
      "所属部署_内部監査室",
      "所属部署_監査役",
      "所属部署_管理部門",
      "所属部署_経営者",
      "所属部署_コンサルタント",
      "所属部署_スポンサー",
      "所属部署_オブザーバー",
      "所属部署_その他",
      "上場区分",
      "電話番号",
      "郵便番号",
      "都道府県",
      "市区町村",
      "性別",
      "転職意欲",
      "備考",
    ]);
    expect(csv).toContain("10,山田 太郎,株式会社テスト,参加");
    expect(csv).toContain(
      "山田,太郎,ヤマダ,タロウ,taro.yamada@example.com,sub1@example.com,sub2@example.com,,1,1,1,1,1,1,1,その他所属内容,プライム,0312345678,1000001,東京都,千代田区千代田1-1,1,1,備考テキスト"
    );
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

  it("未設定のプロフィール項目は空セルとして出る", () => {
    const csv = buildEventAttendeesCsv(makeEvent(), [
      row({
        lastNameKana: null,
        firstNameKana: null,
        subEmails: [],
        phone: null,
        listingCategory: null,
        postalCode: null,
        prefectureName: null,
        city: null,
        gender: null,
        jobChangeIntent: null,
        note: null,
        customerDepartments: [],
      }),
    ]);

    const dataCells = csv.split("\n")[1].split(",");
    expect(dataCells.slice(8, 11)).toEqual([
      "",
      "",
      "taro.yamada@example.com",
    ]);
    expect(dataCells.slice(11, 14)).toEqual(["", "", ""]);
    expect(dataCells.slice(14, 21)).toEqual(Array(7).fill("0"));
    expect(dataCells.slice(21)).toEqual(Array(9).fill(""));
  });

  it.each([
    ["male", "active", "1", "1"],
    ["female", "considering", "2", "2"],
    ["male", "if_good", "1", "3"],
    ["female", "not_thinking", "2", "4"],
  ] as const)(
    "性別と転職意欲を定義済みコードで出力する (%s, %s)",
    (gender, jobChangeIntent, expectedGender, expectedJobChangeIntent) => {
      const csv = buildEventAttendeesCsv(makeEvent(), [
        row({ gender, jobChangeIntent }),
      ]);
      const [headerLine, dataLine] = csv.split("\n");
      const headers = headerLine.replace(/^\uFEFF/, "").split(",");
      const cells = dataLine.split(",");

      expect(cells[headers.indexOf("性別")]).toBe(expectedGender);
      expect(cells[headers.indexOf("転職意欲")]).toBe(
        expectedJobChangeIntent
      );
    }
  );
});

describe("toEventAttendeeCsvRows", () => {
  it("顧客プロフィールを含む CSV 行へ変換する", () => {
    const event: EventForAttendeesExport = {
      id: 1,
      hasAfterParty: false,
      rsvps: [
        {
          id: 1,
          status: "attending",
          afterPartyStatus: null,
          comment: "参加します",
          respondedAt: new Date("2026-08-13T08:00:00.000Z"),
          customer: {
            id: 10,
            lastName: "鈴木",
            firstName: "花子",
            lastNameKana: "スズキ",
            firstNameKana: "ハナコ",
            company: "鈴木監査法人",
            email: "hanako.suzuki@example.com",
            subEmails: ["sub1@example.com"],
            phone: "0312345678",
            postalCode: "1000001",
            city: "千代田区千代田1-1",
            gender: "female",
            jobChangeIntent: "considering",
            note: "備考テキスト",
            prefecture: { name: "東京都" },
            listingCategory: {
              marketName: "プライム",
            },
            customerDepartments: [
              { department: { name: "内部監査室" }, note: null },
              { department: { name: "監査役" }, note: null },
              {
                department: { name: "その他" },
                note: "その他所属内容",
              },
            ],
          },
        },
      ],
    };

    expect(toEventAttendeeCsvRows(event.rsvps)[0]).toMatchObject({
      customerId: 10,
      lastNameKana: "スズキ",
      firstNameKana: "ハナコ",
      email: "hanako.suzuki@example.com",
      subEmails: ["sub1@example.com"],
      phone: "0312345678",
      postalCode: "1000001",
      prefectureName: "東京都",
      city: "千代田区千代田1-1",
      gender: "female",
      jobChangeIntent: "considering",
      note: "備考テキスト",
      customerDepartments: [
        { name: "内部監査室", note: null },
        { name: "監査役", note: null },
        { name: "その他", note: "その他所属内容" },
      ],
    });
  });
});
