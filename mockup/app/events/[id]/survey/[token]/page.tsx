"use client";

import { useState, useEffect, use } from "react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { events, customers, getSurveyByToken, surveyResponses, hasResponded } from "@/lib/data/mock";
import { RATINGS, FUTURE_PARTICIPATION_OPTIONS, MEMBERSHIP_OPTIONS } from "@/lib/constants/survey";
import { formatEventDate } from "@/lib/utils";

type Rating = "よかった" | "まぁよかった" | "あまりよくなかった" | "よくなかった";
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
  const [answers, setAnswers] = useState<Record<string, { rating: Rating | ""; reason: string }>>({});
  const [fixedAnswers, setFixedAnswers] = useState<{
    afterParty?: { rating: Rating | ""; reason: string };
    futureParticipation?: { rating: FutureParticipation | ""; reason: string };
    membership?: { rating: Membership | ""; reason: string };
    comments?: string;
  }>({});

  // トークンからアンケート情報を取得
  useEffect(() => {
    // モック用：demo-tokenの場合はダミーデータを使用
    if (token === "demo-token") {
      const demoCustomer = customers[0];
      const demoSurvey = {
        id: "SUR001",
        eventId: id,
        questions: [
          { id: "q1", title: "セッションの感想", order: 1 },
        ],
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
        futureParticipation: demoCustomer.memberTypes.length === 0 ? { rating: "", reason: "" } : undefined,
        membership: demoCustomer.memberTypes.length === 0 ? { rating: "", reason: "" } : undefined,
        comments: "",
      });
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
          futureParticipation: customerData.memberTypes.length === 0 ? { rating: "", reason: "" } : undefined,
          membership: customerData.memberTypes.length === 0 ? { rating: "", reason: "" } : undefined,
          comments: "",
        });
      }
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

    // 「今後の参加について」は必須（ラジオボタンのみ、非会員のみ）
    if (customer.memberTypes.length === 0 && !fixedAnswers.futureParticipation?.rating) {
      toast.error("今後の参加について回答してください");
      return;
    }

    // 懇親会とベンチャー監査役協会への入会については任意（バリデーションなし）

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

  if (!surveyData || !customer) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">アンケートが見つかりませんでした。</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">回答ありがとうございました</h2>
              <p className="text-muted-foreground">
                アンケートへのご回答を受け付けました。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
          <CardDescription>
            開催日時: {formatEventDate(event.date)}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>アンケート</CardTitle>
          <CardDescription>
            ご回答をお願いいたします。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {surveyData.survey.questions
            .sort((a: any, b: any) => a.order - b.order)
            .map((question: any, index: number) => (
              <div key={question.id} className="space-y-4">
                <div>
                  <Label className="text-base font-medium">
                    {question.title} <span className="text-red-500">*</span>
                  </Label>
                </div>

                <RadioGroup
                  value={answers[question.id]?.rating || ""}
                  onValueChange={(value) => updateAnswer(question.id, "rating", value)}
                >
                  <div className="flex flex-wrap gap-4">
                    {RATINGS.map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <RadioGroupItem value={rating} id={`${question.id}-${rating}`} />
                        <Label htmlFor={`${question.id}-${rating}`} className="cursor-pointer">
                          {rating}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                <div className="space-y-2">
                  <Label htmlFor={`reason-${question.id}`}>
                    上記を選んだ理由を、具体的に教えて下さい。
                  </Label>
                  <Textarea
                    id={`reason-${question.id}`}
                    value={answers[question.id]?.reason || ""}
                    onChange={(e) => updateAnswer(question.id, "reason", e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            ))}

          {/* 固定設問: 懇親会 */}
          {event?.hasAfterParty && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label className="text-base font-medium">懇親会</Label>
              </div>

              <RadioGroup
                value={fixedAnswers.afterParty?.rating || ""}
                onValueChange={(value) => updateFixedAnswer("afterParty", "rating", value)}
              >
                <div className="flex flex-wrap gap-4">
                  {RATINGS.map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <RadioGroupItem value={rating} id={`after-party-${rating}`} />
                      <Label htmlFor={`after-party-${rating}`} className="cursor-pointer">
                        {rating}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <Label htmlFor="after-party-reason">
                  上記を選んだ理由を、具体的に教えて下さい。
                </Label>
                <Textarea
                  id="after-party-reason"
                  value={fixedAnswers.afterParty?.reason || ""}
                  onChange={(e) => updateFixedAnswer("afterParty", "reason", e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* 固定設問: 今後の参加について（非会員のみ） */}
          {customer.memberTypes.length === 0 && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label className="text-base font-medium">今後の参加について <span className="text-red-500">*</span></Label>
              </div>

              <RadioGroup
                value={fixedAnswers.futureParticipation?.rating || ""}
                onValueChange={(value) => updateFixedAnswer("futureParticipation", "rating", value)}
              >
                <div className="flex flex-wrap gap-4">
                  {FUTURE_PARTICIPATION_OPTIONS.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`future-participation-${option}`} />
                      <Label htmlFor={`future-participation-${option}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <Label htmlFor="future-participation-reason">
                  上記を選んだ理由を、具体的に教えて下さい。
                </Label>
                <Textarea
                  id="future-participation-reason"
                  value={fixedAnswers.futureParticipation?.reason || ""}
                  onChange={(e) => updateFixedAnswer("futureParticipation", "reason", e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* 固定設問: ベンチャー監査役協会への入会について */}
          {customer.memberTypes.length === 0 && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label className="text-base font-medium">ベンチャー監査役協会への入会について</Label>
              </div>

              <RadioGroup
                value={fixedAnswers.membership?.rating || ""}
                onValueChange={(value) => updateFixedAnswer("membership", "rating", value)}
              >
                <div className="flex flex-wrap gap-4">
                  {MEMBERSHIP_OPTIONS.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`membership-${option}`} />
                      <Label htmlFor={`membership-${option}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <Label htmlFor="membership-reason">
                  上記を選んだ理由を、具体的に教えて下さい。
                </Label>
                <Textarea
                  id="membership-reason"
                  value={fixedAnswers.membership?.reason || ""}
                  onChange={(e) => updateFixedAnswer("membership", "reason", e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* 固定設問: ご意見・ご提案・感想等 */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="comments">
                さいごに、ご意見・ご提案・感想等があればお聞かせください。
              </Label>
              <Textarea
                id="comments"
                value={fixedAnswers.comments || ""}
                onChange={(e) => updateComments(e.target.value)}
                rows={6}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={handleSubmit} className="cursor-pointer">
          回答する
        </Button>
      </div>
    </div>
  );
}

