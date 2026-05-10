import { notFound } from "next/navigation";
import { getAuthenticatedAdmin, canManageSurvey } from "@/lib/auth/permissions";
import { findSurveyByEventId } from "@/lib/repositories/survey.repository";
import { SurveyCreateForm } from "./_components/survey-create-form";

export default async function SurveyCreatePage({
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

  const hasPermission = await canManageSurvey(admin, eventId);
  if (!hasPermission) {
    notFound();
  }

  const existing = await findSurveyByEventId(eventId);
  const initialQuestions = (existing?.questions ?? []).map((q) => ({
    id: q.id,
    clientId: `existing-${q.id}`,
    title: q.title,
    sortOrder: q.sortOrder,
  }));

  return (
    <SurveyCreateForm eventId={eventId} initialQuestions={initialQuestions} />
  );
}
