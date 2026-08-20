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
      stockExchangeName: "東京証券取引所",
    },
    postalCode: "1000001",
    prefectureName: "東京都",
    city: "千代田区千代田1-1",
    gender: "male",
    note: "備考テキスト",
    departmentNames: ["内部監査室", "監査役"],
    ...overrides,
  };
}

describe("buildEventAttendeesCsv", () => {
  it("BOM とヘッダ・参加ラベルが含まれる（懇親会列なし）", () => {
    const csv = buildEventAttendeesCsv(makeEvent(), [row()]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain(
      "顧客ID,氏名,会社名,ステータス,回答日時,メッセージ,姓,名,セイ,メイ,メールアドレス,サブメール1,サブメール2,サブメール3,電話番号,上場区分,郵便番号,都道府県,市区町村,性別,備考,所属部署"
    );
    expect(csv).toContain("10,山田 太郎,株式会社テスト,参加");
    expect(csv).toContain(
      "山田,太郎,ヤマダ,タロウ,taro.yamada@example.com,sub1@example.com,sub2@example.com,,0312345678,東京証券取引所 プライム,1000001,東京都,千代田区千代田1-1,男性,備考テキスト,内部監査室・監査役"
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
        note: null,
        departmentNames: [],
      }),
    ]);

    const dataCells = csv.split("\n")[1].split(",");
    expect(dataCells.slice(8, 11)).toEqual([
      "",
      "",
      "taro.yamada@example.com",
    ]);
    expect(dataCells.slice(11)).toEqual(Array(11).fill(""));
  });
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
            note: "備考テキスト",
            prefecture: { name: "東京都" },
            listingCategory: {
              marketName: "プライム",
              stockExchangeName: "東京証券取引所",
            },
            customerDepartments: [
              { department: { name: "内部監査室" } },
              { department: { name: "監査役" } },
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
      note: "備考テキスト",
      departmentNames: ["内部監査室", "監査役"],
    });
  });
});
