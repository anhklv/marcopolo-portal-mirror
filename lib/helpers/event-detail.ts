// イベント詳細画面のヘルパー関数（純粋関数、テスト対象）

import type { RsvpStatus } from "@/lib/generated/prisma";
import type { SerializedRsvpForEventDetail } from "@/lib/types/serialized";

// ============================================================
// 型定義
// ============================================================

export interface AttendeeRow {
  rsvpId: number;
  customerId: number;
  lastName: string;
  firstName: string;
  company: string | null;
  status: string;
  afterPartyStatus: string | null;
  comment: string | null;
  respondedAt: string | null;
}

export interface EventSummary {
  onsiteCount: number;
  onlineCount: number;
  afterPartyCount: number;
  absentCount: number;
  pendingCount: number;
}

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * RSVPデータ → 表示用行への変換
 */
export function toAttendeeRows(
  rsvps: SerializedRsvpForEventDetail[]
): AttendeeRow[] {
  return rsvps.map((r) => ({
    rsvpId: r.id,
    customerId: r.customer.id,
    lastName: r.customer.lastName,
    firstName: r.customer.firstName,
    company: r.customer.company,
    status: r.status,
    afterPartyStatus: r.afterPartyStatus,
    comment: r.comment,
    respondedAt: r.respondedAt,
  }));
}

/**
 * キーワード検索 + ステータスフィルタ
 */
export function filterAttendees(
  rows: AttendeeRow[],
  keyword: string,
  statuses: RsvpStatus[]
): AttendeeRow[] {
  return rows.filter((row) => {
    // キーワード検索（氏名・会社名）
    const matchesKeyword =
      keyword === "" ||
      `${row.lastName}${row.firstName}`
        .toLowerCase()
        .includes(keyword.toLowerCase()) ||
      (row.company?.toLowerCase().includes(keyword.toLowerCase()) ?? false);

    // ステータスフィルタ（空配列 = 全表示）
    const matchesStatus =
      statuses.length === 0 || statuses.includes(row.status as RsvpStatus);

    return matchesKeyword && matchesStatus;
  });
}

/**
 * 集計（現地参加/オンライン/懇親会/不参加/未回答）
 */
export function computeEventSummary(rows: AttendeeRow[]): EventSummary {
  let onsiteCount = 0;
  let onlineCount = 0;
  let afterPartyCount = 0;
  let absentCount = 0;
  let pendingCount = 0;

  for (const row of rows) {
    switch (row.status) {
      case "attending":
        onsiteCount++;
        break;
      case "online":
        onlineCount++;
        break;
      case "absent":
        absentCount++;
        break;
      case "pending":
        pendingCount++;
        break;
    }
    if (row.afterPartyStatus === "attending") {
      afterPartyCount++;
    }
  }

  return { onsiteCount, onlineCount, afterPartyCount, absentCount, pendingCount };
}
