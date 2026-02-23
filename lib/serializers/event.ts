// イベントデータのシリアライズ関数

import type { EventForDetail, EventForList } from "@/lib/repositories/event.repository";
import type { SerializedEvent, SerializedEventDetail } from "@/lib/types/serialized";

/**
 * イベント一覧用シリアライズ
 */
export function serializeEventForList(e: EventForList): SerializedEvent {
  return {
    id: e.id,
    title: e.title,
    date: e.date.toISOString(),
    location: e.location,
    description: e.description,
    note: e.note,
    isPaused: e.isPaused,
    responseDeadline: e.responseDeadline?.toISOString() ?? null,
    community: {
      id: e.community.id,
      code: e.community.code,
      name: e.community.name,
    },
    attendeesCount: e._count.rsvps,
  };
}

/**
 * イベント詳細用シリアライズ
 */
export function serializeEventForDetail(e: EventForDetail): SerializedEventDetail {
  return {
    id: e.id,
    title: e.title,
    date: e.date.toISOString(),
    location: e.location,
    description: e.description,
    timetable: e.timetable,
    note: e.note,
    isPaused: e.isPaused,
    allowsOnline: e.allowsOnline,
    hasAfterParty: e.hasAfterParty,
    responseDeadline: e.responseDeadline?.toISOString() ?? null,
    community: {
      id: e.community.id,
      code: e.community.code,
      name: e.community.name,
    },
    rsvps: e.rsvps.map((r) => ({
      id: r.id,
      status: r.status,
      afterPartyStatus: r.afterPartyStatus,
      comment: r.comment,
      respondedAt: r.respondedAt?.toISOString() ?? null,
      customer: {
        id: r.customer.id,
        lastName: r.customer.lastName,
        firstName: r.customer.firstName,
        company: r.customer.company,
      },
    })),
  };
}
