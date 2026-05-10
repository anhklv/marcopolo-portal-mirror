"use client";

import { use, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Stack } from "@/components/ui/stack";
import { SurveyAnswerForm } from "../[token]/_components/survey-answer-form";
import type { SerializedSurveyAnswerPageData } from "@/lib/types/serialized";
import { COMMUNITY_CODE } from "@/lib/constants/community";

function loadPreviewData(
  eventId: number
): SerializedSurveyAnswerPageData | null {
  if (typeof window === "undefined") return null;

  try {
    const json = sessionStorage.getItem(`survey-preview-${eventId}`);
    if (!json) return null;

    const questions = JSON.parse(json) as {
      clientId: string;
      title: string;
      sortOrder: number;
    }[];

    return {
      event: {
        id: eventId,
        title: "プレビュー",
        date: new Date().toISOString(),
        hasAfterParty: true,
        community: {
          code: COMMUNITY_CODE.VENTURE_AUDITOR,
          name: "ベンチャー監査役の会",
        },
      },
      survey: {
        id: 0,
        questions: questions.map((q, i) => ({
          id: -(i + 1),
          title: q.title,
          sortOrder: q.sortOrder,
        })),
      },
      customer: {
        id: 0,
        lastName: "プレビュー",
        firstName: "ユーザー",
        isMemberOfVentureAuditor: false,
      },
      surveyToken: {
        id: 0,
        token: "preview",
      },
    };
  } catch {
    return null;
  }
}

export default function SurveyPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const eventId = Number(id);

  const [data] = useState<SerializedSurveyAnswerPageData | null>(() =>
    loadPreviewData(eventId)
  );

  if (!data) {
    return (
      <div className="min-h-screen bg-muted py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-lg border bg-card p-6 shadow-sm text-center">
            <Stack gap="md">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                プレビューエラー
              </h1>
              <p className="text-sm text-muted-foreground">
                プレビューデータが見つかりません。アンケート作成画面からプレビューしてください。
              </p>
            </Stack>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* プレビューバナー */}
      <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-2 text-center text-sm font-medium text-yellow-800">
        プレビューモード — 送信はされません
      </div>
      <SurveyAnswerForm data={data} isPreview />
    </>
  );
}
