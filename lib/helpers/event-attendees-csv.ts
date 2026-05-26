import {
  RSVP_STATUS_CONFIG,
  AFTER_PARTY_STATUS_CONFIG,
} from "@/lib/constants/event";
import type { SerializedEventDetail } from "@/lib/types/serialized";
import type { AttendeeRow } from "@/lib/helpers/event-detail";
import { formatDateTime } from "@/lib/utils/event";
import { encodeCsvDocument } from "@/lib/utils/csv";
import type { AfterPartyStatus, RsvpStatus } from "@/lib/generated/prisma";

/**
 * 参加状況一覧（管理画面テーブル）と同じ列で CSV 文字列を生成する（BOM 付き）
 */
export function buildEventAttendeesCsv(
  event: SerializedEventDetail,
  rows: AttendeeRow[]
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
  headers.push("回答日時", "メッセージ");

  const dataRows = rows.map((row) => buildRow(event.hasAfterParty, row));
  return encodeCsvDocument(headers, dataRows);
}

function buildRow(hasAfterParty: boolean, row: AttendeeRow): string[] {
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

  cells.push(
    row.respondedAt ? formatDateTime(row.respondedAt) : "",
    row.comment ?? ""
  );

  return cells;
}
