import {
  RSVP_STATUS_CONFIG,
  AFTER_PARTY_STATUS_CONFIG,
} from "@/lib/constants/event";
import {
  toAttendeeRows,
  type AttendeeRow,
} from "@/lib/helpers/event-detail";
import { formatDateTime } from "@/lib/utils/event";
import { encodeCsvDocument } from "@/lib/utils/csv";
import type {
  AfterPartyStatus,
  Gender,
  JobChangeIntent,
  RsvpStatus,
} from "@/lib/generated/prisma";
import type { EventForAttendeesExport } from "@/lib/repositories/event.repository";

const DEPARTMENT_CSV_COLUMNS = [
  "内部監査室",
  "監査役",
  "管理部門",
  "経営者",
  "コンサルタント",
  "スポンサー",
  "オブザーバー",
] as const;

const GENDER_CSV_VALUES: Record<Gender, string> = {
  male: "1",
  female: "2",
};

const JOB_CHANGE_INTENT_CSV_VALUES: Record<JobChangeIntent, string> = {
  active: "1",
  considering: "2",
  if_good: "3",
  not_thinking: "4",
};

export interface EventAttendeeCsvRow extends AttendeeRow {
  lastNameKana: string | null;
  firstNameKana: string | null;
  email: string;
  subEmails: string[];
  phone: string | null;
  listingCategory: {
    marketName: string;
  } | null;
  postalCode: string | null;
  prefectureName: string | null;
  city: string | null;
  gender: Gender | null;
  jobChangeIntent: JobChangeIntent | null;
  note: string | null;
  customerDepartments: {
    name: string;
    note: string | null;
  }[];
}

/**
 * DB の RSVP データを、画面と同じ並び順を持つ CSV 行へ変換する。
 */
export function toEventAttendeeCsvRows(
  rsvps: EventForAttendeesExport["rsvps"]
): EventAttendeeCsvRow[] {
  const customersById = new Map(
    rsvps.map((rsvp) => [rsvp.customer.id, rsvp.customer])
  );
  const rows = toAttendeeRows(
    rsvps.map((rsvp) => ({
      id: rsvp.id,
      status: rsvp.status,
      afterPartyStatus: rsvp.afterPartyStatus,
      comment: rsvp.comment,
      respondedAt: rsvp.respondedAt?.toISOString() ?? null,
      customer: {
        id: rsvp.customer.id,
        lastName: rsvp.customer.lastName,
        firstName: rsvp.customer.firstName,
        company: rsvp.customer.company,
      },
    }))
  );

  return rows.map((row) => {
    const customer = customersById.get(row.customerId);
    if (!customer) {
      throw new Error(`Customer not found for attendee: ${row.customerId}`);
    }

    return {
      ...row,
      lastNameKana: customer.lastNameKana,
      firstNameKana: customer.firstNameKana,
      email: customer.email,
      subEmails: customer.subEmails,
      phone: customer.phone,
      listingCategory: customer.listingCategory,
      postalCode: customer.postalCode,
      prefectureName: customer.prefecture?.name ?? null,
      city: customer.city,
      gender: customer.gender,
      jobChangeIntent: customer.jobChangeIntent,
      note: customer.note,
      customerDepartments: customer.customerDepartments.map(
        ({ department, note }) => ({ name: department.name, note })
      ),
    };
  });
}

/**
 * 参加状況一覧の既存項目と顧客プロフィール項目で CSV 文字列を生成する（BOM 付き）
 */
export function buildEventAttendeesCsv(
  event: { hasAfterParty: boolean },
  rows: EventAttendeeCsvRow[]
): string {
  const headers: string[] = [
    "顧客ID",
    "氏名",
    "会社名",
    "ステータス",
  ];
  if (event.hasAfterParty) {
    headers.push("懇親会");
  }
  headers.push(
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
    ...DEPARTMENT_CSV_COLUMNS.map((name) => `所属部署_${name}`),
    "所属部署_その他",
    "上場区分",
    "電話番号",
    "郵便番号",
    "都道府県",
    "市区町村",
    "性別",
    "転職意欲",
    "備考"
  );

  const dataRows = rows.map((row) => buildRow(event.hasAfterParty, row));
  return encodeCsvDocument(headers, dataRows);
}

function buildRow(hasAfterParty: boolean, row: EventAttendeeCsvRow): string[] {
  const statusLabel =
    RSVP_STATUS_CONFIG[row.status as RsvpStatus]?.label ?? row.status;

  const cells: string[] = [
    String(row.customerId),
    `${row.lastName} ${row.firstName}`.trim(),
    row.company ?? "",
    statusLabel,
  ];

  if (hasAfterParty) {
    if (row.afterPartyStatus) {
      cells.push(
        AFTER_PARTY_STATUS_CONFIG[row.afterPartyStatus as AfterPartyStatus]
          ?.label ?? row.afterPartyStatus
      );
    } else {
      cells.push("");
    }
  }

  const departmentNames = new Set(
    row.customerDepartments.map(({ name }) => name)
  );
  const otherDepartmentNote =
    row.customerDepartments.find(({ name }) => name === "その他")?.note ?? "";

  cells.push(
    row.respondedAt ? formatDateTime(row.respondedAt) : "",
    row.comment ?? "",
    row.lastName,
    row.firstName,
    row.lastNameKana ?? "",
    row.firstNameKana ?? "",
    row.email,
    row.subEmails[0] ?? "",
    row.subEmails[1] ?? "",
    row.subEmails[2] ?? "",
    ...DEPARTMENT_CSV_COLUMNS.map((name) =>
      departmentNames.has(name) ? "1" : "0"
    ),
    otherDepartmentNote,
    row.listingCategory?.marketName ?? "",
    row.phone ?? "",
    row.postalCode ?? "",
    row.prefectureName ?? "",
    row.city ?? "",
    row.gender ? GENDER_CSV_VALUES[row.gender] : "",
    row.jobChangeIntent
      ? JOB_CHANGE_INTENT_CSV_VALUES[row.jobChangeIntent]
      : "",
    row.note ?? ""
  );

  return cells;
}
