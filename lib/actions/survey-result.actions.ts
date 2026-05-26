"use server";

import {
  requireAuthenticatedAdmin,
  canAccessEvent,
} from "@/lib/auth/permissions";
import { findEventByIdForDetail } from "@/lib/repositories/event.repository";
import { findSurveyResultsByEventId } from "@/lib/repositories/survey.repository";
import { serializeEventForDetail } from "@/lib/serializers/event";
import { serializeSurveyResult } from "@/lib/serializers/survey";
import { buildSurveyResultsCsv } from "@/lib/helpers/survey-result-csv";
import type { ActionResult } from "@/lib/types/action";

/**
 * イベントのアンケート回答一覧を CSV でエクスポート
 */
export async function exportSurveyResultsAction(
  eventId: number
): Promise<{ csv: string } | ActionResult> {
  const { admin } = await requireAuthenticatedAdmin();

  const hasAccess = await canAccessEvent(admin, eventId);
  if (!hasAccess) {
    return { error: "このイベントにアクセスできません" };
  }

  const event = await findEventByIdForDetail(eventId);
  if (!event) {
    return { error: "イベントが見つかりません" };
  }

  const serializedEvent = serializeEventForDetail(event);
  if (!serializedEvent.community.hasSurvey) {
    return { error: "このコミュニティではアンケートがありません" };
  }

  const resultData = await findSurveyResultsByEventId(eventId);
  if (!resultData) {
    return { error: "アンケートが見つかりません" };
  }

  const surveyResult = serializeSurveyResult(resultData);
  if (surveyResult.respondents.length === 0) {
    return { error: "出力できる回答がありません" };
  }

  const csv = buildSurveyResultsCsv(serializedEvent, surveyResult);
  return { csv };
}
