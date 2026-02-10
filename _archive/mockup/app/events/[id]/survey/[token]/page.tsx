"use client";

import { useState, useEffect, use } from "react";
import { notFound } from "next/navigation";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { events, customers, getSurveyByToken, surveyResponses, hasResponded } from "@/lib/data/mock";
import { RATINGS, FUTURE_PARTICIPATION_OPTIONS, MEMBERSHIP_OPTIONS } from "@/lib/constants/survey";
import { formatEventDate } from "@/lib/utils";
import { Stack } from "@/components/ui/stack";
import { FormField } from "@/components/ui/form-field";
import { ActionButton } from "@/components/ui/action-button";
import type { SurveyQuestion } from "@/lib/types";

type Rating = "よかった" | "まぁよかった" | "あまりよくなかった" | "よくなかった";

const getRatingBoxClass = (selected: boolean) =>
  selected
    ? "border-blue-500 bg-blue-50 text-blue-900"
    : "border-muted bg-muted/50 hover:bg-accent hover:text-accent-foreground";
type FutureParticipation = "ぜひ参加したい" | "参加を検討したい" | "参加しない";
type Membership = "入会をしたい" | "入会を検討したい" | "関心がない";

export default function SurveyAnswerPage({
  params,
}: {
  params: Promise<{ id: string; token: string }>;
}) {
  const { id, token } = use(params);
  const event = events.find((e) => id === e.id);

  if (!event) {
    notFound();
  }

  const [surveyData, setSurveyData] = useState<{ survey: any; customerId: string } | null>(null);
  const [customer, setCustomer] = useState<typeof customers[0] | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [answers, setAnswers] = useState<Record<string, { rating: Rating | ""; reason: string }>>({});
  const [fixedAnswers, setFixedAnswers] = useState<{
    afterParty?: { rating: Rating | ""; reason: string };
    futureParticipation?: { rating: FutureParticipation | ""; reason: string };
    membership?: { rating: Membership | ""; reason: string };
    comments?: string;
  }>({});

  // トークンからアンケート情報を取得
  useEffect(() => {
    // モック用：demo-tokenの場合はダミーデータを使用（会員向け）
    if (token === "demo-token") {
      const demoCustomer = customers[0];
      // ベンチャー監査役の会のイベントの場合は2つの設問を設定
      const questions = event?.eventType === "ベンチャー監査役の会"
        ? [
            { id: "q1", title: "第1部　ベンチャー企業における常勤監査役の役割", order: 1 },
            { id: "q2", title: "第2部　監査役座談会", order: 2 },
          ]
        : [
            { id: "q1", title: "セッションの感想", order: 1 },
          ];
      const demoSurvey = {
        id: "SUR001",
        eventId: id,
        questions,
        createdAt: new Date().toISOString(),
      };
      setSurveyData({ survey: demoSurvey, customerId: demoCustomer.id });
      setCustomer(demoCustomer);
      // 初期化
      const initialAnswers: Record<string, { rating: Rating | ""; reason: string }> = {};
      demoSurvey.questions.forEach((q) => {
        initialAnswers[q.id] = { rating: "", reason: "" };
      });
      setAnswers(initialAnswers);
      // 固定設問の初期化
      setFixedAnswers({
        afterParty: event?.hasAfterParty ? { rating: "", reason: "" } : undefined,
        futureParticipation: { rating: "", reason: "" }, // 全員必須
        membership: event?.eventType === "ベンチャー監査役の会" && !demoCustomer.communities.includes("ベンチャー監査役の会") ? { rating: "", reason: "" } : undefined,
        comments: "",
      });
      setDataLoaded(true);
      return;
    }

    // モック用：demo-token-nonmemberの場合は非会員のダミーデータを使用
    if (token === "demo-token-nonmember") {
      const demoCustomer = customers.find(c => c.communities.length === 0) || customers[2]; // C003（非会員）
      // セッションストレージからプレビュー用の設問を取得
      const previewQuestionsJson = sessionStorage.getItem(`survey-preview-${id}`);
      let questions: SurveyQuestion[];
      if (previewQuestionsJson) {
        // プレビュー用の設問がある場合はそれを使用
        try {
          questions = JSON.parse(previewQuestionsJson) as SurveyQuestion[];
        } catch (e) {
          // JSON解析に失敗した場合はデフォルトの設問を使用
          questions = event?.eventType === "ベンチャー監査役の会"
            ? [
                { id: "q1", title: "第1部　ベンチャー企業における常勤監査役の役割", order: 1 },
                { id: "q2", title: "第2部　監査役座談会", order: 2 },
              ]
            : [
                { id: "q1", title: "セッションの感想", order: 1 },
              ];
        }
      } else {
        // プレビュー用の設問がない場合はデフォルトの設問を使用
        questions = event?.eventType === "ベンチャー監査役の会"
          ? [
              { id: "q1", title: "第1部　ベンチャー企業における常勤監査役の役割", order: 1 },
              { id: "q2", title: "第2部　監査役座談会", order: 2 },
            ]
          : [
              { id: "q1", title: "セッションの感想", order: 1 },
            ];
      }
      const demoSurvey = {
        id: "SUR001",
        eventId: id,
        questions,
        createdAt: new Date().toISOString(),
      };
      setSurveyData({ survey: demoSurvey, customerId: demoCustomer.id });
      setCustomer(demoCustomer);
      // 初期化
      const initialAnswers: Record<string, { rating: Rating | ""; reason: string }> = {};
      demoSurvey.questions.forEach((q) => {
        initialAnswers[q.id] = { rating: "", reason: "" };
      });
      setAnswers(initialAnswers);
      // 固定設問の初期化
      setFixedAnswers({
        afterParty: event?.hasAfterParty ? { rating: "", reason: "" } : undefined,
        futureParticipation: { rating: "", reason: "" }, // 全員必須
        membership: event?.eventType === "ベンチャー監査役の会" && !demoCustomer.communities.includes("ベンチャー監査役の会") ? { rating: "", reason: "" } : undefined,
        comments: "",
      });
      setDataLoaded(true);
      return;
    }

    const data = getSurveyByToken(token);
    if (data) {
      setSurveyData(data);
      const customerData = customers.find((c) => c.id === data.customerId);
      if (customerData) {
        setCustomer(customerData);
      }

      // 既に回答済みかチェック
      if (hasResponded(data.survey.id, data.customerId)) {
        setSubmitted(true);
        setDataLoaded(true);
        return;
      }

      // 初期化
      const initialAnswers: Record<string, { rating: Rating | ""; reason: string }> = {};
      data.survey.questions.forEach((q) => {
        initialAnswers[q.id] = { rating: "", reason: "" };
      });
      setAnswers(initialAnswers);
      // 固定設問の初期化
      if (customerData) {
        setFixedAnswers({
          afterParty: event?.hasAfterParty ? { rating: "", reason: "" } : undefined,
          futureParticipation: { rating: "", reason: "" }, // 全員必須
          membership: event?.eventType === "ベンチャー監査役の会" && !customerData.communities.includes("ベンチャー監査役の会") ? { rating: "", reason: "" } : undefined,
          comments: "",
        });
      }
      setDataLoaded(true);
    } else {
      setDataLoaded(true);
    }
  }, [token, id]);

  const handleSubmit = () => {
    if (!surveyData || !customer) {
      toast.error("エラーが発生しました");
      return;
    }

    // 管理者が作成した設問は必須（ラジオボタンのみ）
    const allAnswered = surveyData.survey.questions.every((q: any) => {
      const answer = answers[q.id];
      return answer && answer.rating;
    });

    if (!allAnswered) {
      toast.error("すべての設問に回答してください");
      return;
    }

    // 「今後の参加について」は必須（全員）
    if (!fixedAnswers.futureParticipation?.rating) {
      toast.error("今後の参加について回答してください");
      return;
    }

    // 懇親会とベンチャー監査役の会への入会については任意（バリデーションなし）

    // 回答を保存
    surveyData.survey.questions.forEach((q: any) => {
      const answer = answers[q.id];
      surveyResponses.push({
        surveyId: surveyData.survey.id,
        questionId: q.id,
        customerId: customer.id,
        token,
        rating: answer.rating as Rating,
        reason: answer.reason,
        respondedAt: new Date().toISOString(),
      });
    });

    // 固定設問の回答も保存（ここではモックなので、実際の実装では別のテーブルに保存）
    // TODO: 固定設問の回答を保存する処理を追加

    setSubmitted(true);
    toast.success("アンケートにご回答いただき、ありがとうございました");
  };

  const updateAnswer = (questionId: string, field: "rating" | "reason", value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }));
  };

  const updateFixedAnswer = (
    type: "afterParty" | "futureParticipation" | "membership",
    field: "rating" | "reason",
    value: string
  ) => {
    setFixedAnswers((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      } as any,
    }));
  };

  const updateComments = (value: string) => {
    setFixedAnswers((prev) => ({
      ...prev,
      comments: value,
    }));
  };

  if (!dataLoaded) {
    return null;
  }

  if (!surveyData || !customer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm text-center">
          <p className="text-muted-foreground">アンケートが見つかりませんでした。</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm text-center">
          <Stack gap="md">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold tracking-tight">回答ありがとうございました</h1>
            <p className="text-sm text-muted-foreground">
              アンケートへのご回答を受け付けました。
            </p>
          </Stack>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Stack gap="lg">
          {/* イベント情報 */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              開催日時: {formatEventDate(event.date)}
            </p>
          </div>

          {/* アンケートフォーム */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <Stack gap="xl">
              <div>
                <h2 className="text-lg font-semibold">アンケート</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  ご回答をお願いいたします。
                </p>
              </div>

              {surveyData.survey.questions
                .sort((a: any, b: any) => a.order - b.order)
                .map((question: any) => (
                  <Stack key={question.id} gap="md">
                    <Label className="text-base font-medium">
                      {question.title} <span className="text-destructive">*</span>
                    </Label>

                    <RadioGroup
                      value={answers[question.id]?.rating || ""}
                      onValueChange={(value) => updateAnswer(question.id, "rating", value)}
                      className="grid grid-cols-4 gap-4"
                    >
                      {RATINGS.map((rating) => (
                        <div key={rating}>
                          <RadioGroupItem value={rating} id={`question-${question.id}-${rating}`} className="peer sr-only" />
                          <Label
                            htmlFor={`question-${question.id}-${rating}`}
                            className={`flex flex-col items-center justify-center rounded-md border-2 px-4 py-6 cursor-pointer text-center transition-colors ${getRatingBoxClass(answers[question.id]?.rating === rating)}`}
                          >
                            <span className="font-semibold">{rating}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    <FormField label="上記を選んだ理由を、具体的に教えて下さい。">
                      <Textarea
                        id={`reason-${question.id}`}
                        value={answers[question.id]?.reason || ""}
                        onChange={(e) => updateAnswer(question.id, "reason", e.target.value)}
                        rows={4}
                      />
                    </FormField>
                  </Stack>
                ))}

              {/* 固定設問: 懇親会 */}
              {event?.hasAfterParty && (
                <Stack gap="md">
                  <Label className="text-base font-medium">懇親会</Label>

                  <RadioGroup
                    value={fixedAnswers.afterParty?.rating || ""}
                    onValueChange={(value) => updateFixedAnswer("afterParty", "rating", value)}
                    className="grid grid-cols-4 gap-4"
                  >
                    {RATINGS.map((rating) => (
                      <div key={rating}>
                        <RadioGroupItem value={rating} id={`after-party-${rating}`} className="peer sr-only" />
                        <Label
                          htmlFor={`after-party-${rating}`}
                          className={`flex flex-col items-center justify-center rounded-md border-2 px-4 py-6 cursor-pointer text-center transition-colors ${getRatingBoxClass(fixedAnswers.afterParty?.rating === rating)}`}
                        >
                          <span className="font-semibold">{rating}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <FormField label="上記を選んだ理由を、具体的に教えて下さい。">
                    <Textarea
                      id="after-party-reason"
                      value={fixedAnswers.afterParty?.reason || ""}
                      onChange={(e) => updateFixedAnswer("afterParty", "reason", e.target.value)}
                      rows={4}
                    />
                  </FormField>
                </Stack>
              )}

              {/* 固定設問: 今後の参加について（全員必須） */}
              <Stack gap="md">
                <Label className="text-base font-medium">
                  今後の参加について <span className="text-destructive">*</span>
                </Label>

                <RadioGroup
                  value={fixedAnswers.futureParticipation?.rating || ""}
                  onValueChange={(value) => updateFixedAnswer("futureParticipation", "rating", value)}
                  className="grid grid-cols-3 gap-4"
                >
                  {FUTURE_PARTICIPATION_OPTIONS.map((option) => (
                    <div key={option}>
                      <RadioGroupItem value={option} id={`future-participation-${option}`} className="peer sr-only" />
                      <Label
                        htmlFor={`future-participation-${option}`}
                        className={`flex flex-col items-center justify-center rounded-md border-2 px-4 py-6 cursor-pointer text-center transition-colors ${getRatingBoxClass(fixedAnswers.futureParticipation?.rating === option)}`}
                      >
                        <span className="font-semibold">{option}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <FormField label="上記を選んだ理由を、具体的に教えて下さい。">
                  <Textarea
                    id="future-participation-reason"
                    value={fixedAnswers.futureParticipation?.reason || ""}
                    onChange={(e) => updateFixedAnswer("futureParticipation", "reason", e.target.value)}
                    rows={4}
                  />
                </FormField>
              </Stack>

              {/* 固定設問: ベンチャー監査役の会への入会について（ベンチャー監査役の会のイベントで、ベンチャー監査役の会に未所属の場合のみ） */}
              {event?.eventType === "ベンチャー監査役の会" && !customer.communities.includes("ベンチャー監査役の会") && (
                <Stack gap="md">
                  <Label className="text-base font-medium">ベンチャー監査役の会への入会について</Label>

                  <RadioGroup
                    value={fixedAnswers.membership?.rating || ""}
                    onValueChange={(value) => updateFixedAnswer("membership", "rating", value)}
                    className="grid grid-cols-3 gap-4"
                  >
                    {MEMBERSHIP_OPTIONS.map((option) => (
                      <div key={option}>
                        <RadioGroupItem value={option} id={`membership-${option}`} className="peer sr-only" />
                        <Label
                          htmlFor={`membership-${option}`}
                          className={`flex flex-col items-center justify-center rounded-md border-2 px-4 py-6 cursor-pointer text-center transition-colors ${getRatingBoxClass(fixedAnswers.membership?.rating === option)}`}
                        >
                          <span className="font-semibold">{option}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <FormField label="上記を選んだ理由を、具体的に教えて下さい。">
                    <Textarea
                      id="membership-reason"
                      value={fixedAnswers.membership?.reason || ""}
                      onChange={(e) => updateFixedAnswer("membership", "reason", e.target.value)}
                      rows={4}
                    />
                  </FormField>
                </Stack>
              )}

              {/* 固定設問: ご意見・ご提案・感想等 */}
              <div className="border-t pt-6">
                <FormField label="さいごに、ご意見・ご提案・感想等があればお聞かせください。">
                  <Textarea
                    id="comments"
                    value={fixedAnswers.comments || ""}
                    onChange={(e) => updateComments(e.target.value)}
                    rows={6}
                  />
                </FormField>
              </div>

              <div className="flex justify-center pt-4">
                <ActionButton onClick={handleSubmit}>
                  送信
                </ActionButton>
              </div>
            </Stack>
          </div>
        </Stack>
      </div>
    </div>
  );
}

