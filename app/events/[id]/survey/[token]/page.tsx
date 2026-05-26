import { findSurveyTokenByToken, findExistingResponses } from "@/lib/repositories/survey.repository";
import { serializeSurveyForAnswerPage } from "@/lib/serializers/survey";
import { SurveyAnswerForm } from "./_components/survey-answer-form";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Stack } from "@/components/ui/stack";

export const metadata = {
  title: { absolute: "アンケート回答 - Marcopolo" },
};

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg border bg-card p-6 shadow-sm text-center">
          <Stack gap="md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              アクセスエラー
            </h1>
            <p className="text-sm text-muted-foreground">{message}</p>
          </Stack>
        </div>
      </div>
    </div>
  );
}

function CompletedPage() {
  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg border bg-card p-6 shadow-sm text-center">
          <Stack gap="md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              回答ありがとうございました
            </h1>
            <p className="text-sm text-muted-foreground">
              アンケートへのご回答は既に受け付け済みです。
            </p>
          </Stack>
        </div>
      </div>
    </div>
  );
}

export default async function SurveyAnswerPage({
  params,
}: {
  params: Promise<{ id: string; token: string }>;
}) {
  const { id, token } = await params;
  const eventId = Number(id);

  if (!token || isNaN(eventId)) {
    return (
      <ErrorPage message="このページにアクセスするには有効なURLが必要です。" />
    );
  }

  const surveyToken = await findSurveyTokenByToken(token);

  if (!surveyToken || surveyToken.survey.event.id !== eventId) {
    return (
      <ErrorPage message="このページにアクセスするには有効なURLが必要です。" />
    );
  }

  if (surveyToken.survey.event.deletedAt) {
    return <ErrorPage message="このイベントは終了しました。" />;
  }

  if (surveyToken.customer.deletedAt) {
    return <ErrorPage message="このページにアクセスできません。" />;
  }

  // 回答済みチェック
  const alreadyResponded = await findExistingResponses(
    surveyToken.survey.id,
    surveyToken.customer.id
  );
  if (alreadyResponded) {
    return <CompletedPage />;
  }

  const data = serializeSurveyForAnswerPage(surveyToken);

  return <SurveyAnswerForm data={data} />;
}
