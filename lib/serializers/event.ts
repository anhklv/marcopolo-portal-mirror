// イベントデータのシリアライズ関数

import type { EventForList } from "@/lib/repositories/event.repository";
import type { SerializedEvent } from "@/lib/types/serialized";

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
