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

interface EventSummary {
  onsiteCount: number;
  onlineCount: number;
  afterPartyCount: number;
  absentCount: number;
  pendingCount: number;
}

// ============================================================
// ヘルパー関数
// ============================================================

const RSVP_STATUS_ORDER: Record<string, number> = {
  attending: 0,
  online: 1,
  absent: 2,
  pending: 3,
};

/**
 * RSVPデータ → 表示用行への変換（ステータス優先、同一ステータス内はcreatedAt昇順）
 */
export function toAttendeeRows(
  rsvps: SerializedRsvpForEventDetail[]
): AttendeeRow[] {
  return rsvps
    .map((r) => ({
      rsvpId: r.id,
      customerId: r.customer.id,
      lastName: r.customer.lastName,
      firstName: r.customer.firstName,
      company: r.customer.company,
      status: r.status,
      afterPartyStatus: r.afterPartyStatus,
      comment: r.comment,
      respondedAt: r.respondedAt,
    }))
    .sort((a, b) => {
      const orderA = RSVP_STATUS_ORDER[a.status] ?? 99;
      const orderB = RSVP_STATUS_ORDER[b.status] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return b.customerId - a.customerId;
    });
}

/**
 * キーワード検索 + ステータスフィルタ
 */
export function filterAttendees<T extends AttendeeRow>(
  rows: T[],
  keyword: string,
  statuses: RsvpStatus[]
): T[] {
  return rows.filter((row) => {
    // キーワード検索（氏名・会社名、スペース区切りでAND検索）
    let matchesKeyword = true;
    if (keyword) {
      const tokens = keyword.toLowerCase().split(/[\s\u3000]+/).filter(Boolean);
      const searchTarget = `${row.lastName} ${row.firstName} ${row.company ?? ""}`.toLowerCase();
      matchesKeyword = tokens.every((token) => searchTarget.includes(token));
    }

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
