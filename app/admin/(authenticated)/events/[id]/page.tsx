import { getAuthenticatedAdmin, canAccessEvent } from "@/lib/auth/permissions";
import { findEventByIdForDetail } from "@/lib/repositories/event.repository";
import { findSurveyResultsByEventId } from "@/lib/repositories/survey.repository";
import { serializeEventForDetail } from "@/lib/serializers/event";
import { serializeSurveyResult } from "@/lib/serializers/survey";
import { EventDetail } from "./_components/event-detail";
import { notFound } from "next/navigation";

export const metadata = {
  title: "イベント詳細",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = Number(id);

  if (isNaN(eventId)) {
    notFound();
  }

  const { admin } = await getAuthenticatedAdmin();

  const hasAccess = await canAccessEvent(admin, eventId);
  if (!hasAccess) {
    notFound();
  }

  const event = await findEventByIdForDetail(eventId);
  if (!event) {
    notFound();
  }

  const serializedEvent = serializeEventForDetail(event);

  // アンケート対応コミュニティの場合のみ結果データを取得
  let surveyResult = null;
  if (serializedEvent.community.hasSurvey) {
    const resultData = await findSurveyResultsByEventId(eventId);
    if (resultData) {
      surveyResult = serializeSurveyResult(resultData);
    }
  }

  return <EventDetail event={serializedEvent} surveyResult={surveyResult} />;
}
