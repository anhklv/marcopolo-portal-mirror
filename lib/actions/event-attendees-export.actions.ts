"use server";

import {
  requireAuthenticatedAdmin,
  canAccessEvent,
} from "@/lib/auth/permissions";
import { findEventByIdForDetail } from "@/lib/repositories/event.repository";
import { serializeEventForDetail } from "@/lib/serializers/event";
import {
  toAttendeeRows,
  filterAttendees,
} from "@/lib/helpers/event-detail";
import { buildEventAttendeesCsv } from "@/lib/helpers/event-attendees-csv";
import { exportEventAttendeesCsvSchema } from "@/lib/validations/event";
import { formatZodFieldErrors } from "@/lib/validations/utils";
import type { ActionResult } from "@/lib/types/action";
/**
 * イベント参加状況一覧を CSV でエクスポート（フィルターは UI と同じ keyword / statuses）
 */
export async function exportEventAttendeesCsvAction(
  rawInput: unknown
): Promise<{ csv: string } | ActionResult> {
  const parsed = exportEventAttendeesCsvSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      error: "入力が不正です",
      fieldErrors: formatZodFieldErrors(parsed.error),
    };
  }

  const { eventId, keyword, statuses } = parsed.data;

  const { admin } = await requireAuthenticatedAdmin();

  const hasAccess = await canAccessEvent(admin, eventId);
  if (!hasAccess) {
    return { error: "このイベントにアクセスできません" };
  }

  const event = await findEventByIdForDetail(eventId);
  if (!event) {
    return { error: "イベントが見つかりません" };
  }

  const serialized = serializeEventForDetail(event);
  const allRows = toAttendeeRows(serialized.rsvps);
  const filtered = filterAttendees(allRows, keyword, statuses);

  const csv = buildEventAttendeesCsv(serialized, filtered);
  return { csv };
}
