"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Send, Mail, Check, Plus, Trash2 } from "lucide-react";
import { customers, events, rsvps, surveys, surveyTokens, SurveyQuestion, getSurveyByEventId } from "@/lib/data/mock";
import { cn, formatEventDate } from "@/lib/utils";

type Step = "create" | "customize" | "confirm";

export default function SurveyCreatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const event = events.find((e) => e.id === id);
  const existingSurvey = getSurveyByEventId(id);
  
  const [step, setStep] = useState<Step>("create");
  const [questions, setQuestions] = useState<SurveyQuestion[]>(
    existingSurvey?.questions || [
      { id: `q-${Date.now()}`, title: "セッションの感想", order: 1 },
    ]
  );
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [emailTitle, setEmailTitle] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // このイベントの参加者のみを取得（通常参加とオンライン参加の両方）
  const attendees = useMemo(() => {
    if (!event) return [];
    const eventRsvps = rsvps.filter((r) => r.eventId === id && (r.status === "参加" || r.status === "オンライン参加"));
    return eventRsvps.map((rsvp) => {
      const customer = customers.find((c) => c.id === rsvp.customerId);
      return customer ? { ...customer, rsvpStatus: rsvp.status, attendanceType: rsvp.attendanceType } : null;
    }).filter((a): a is NonNullable<typeof a> => a !== null);
  }, [event, id]);

  // デフォルトのメールタイトルと本文を設定
  useEffect(() => {
    if (!event) return;

    setEmailTitle(`${event.title} アンケートのお願い`);
    setEmailBody(`この度は、${event.title}にご参加いただき、ありがとうございました。

以下のURLよりアンケートにご回答いただけますと幸いです。
{SURVEY_URL}

ご協力のほど、よろしくお願いいたします。`);
  }, [event?.id, event?.title]);

  // 参加者を全選択（イベントIDが変更されたときのみ）
  useEffect(() => {
    if (!event) return;
    
    const ids = attendees.map((a) => a.id);
    if (ids.length > 0) {
      setSelectedCustomers(ids);
    } else {
      setSelectedCustomers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

  const handleCreateNext = () => {
    if (questions.length === 0) {
      toast.error("設問を1つ以上追加してください");
      return;
    }
    if (questions.some((q) => !q.title.trim())) {
      toast.error("すべての設問にタイトルを入力してください");
      return;
    }
    setStep("customize");
  };

  const handleCustomizeNext = () => {
    if (!emailTitle || !emailBody) {
      toast.error("メールタイトルと本文を入力してください");
      return;
    }
    if (selectedCustomers.length === 0) {
      toast.error("送信する参加者を選択してください");
      return;
    }
    setStep("confirm");
  };

  const handleTestSend = () => {
    toast.success("テストメールを送信しました");
  };

  const handleSend = () => {
    if (existingSurvey) {
      // 既存のアンケートを更新
      const surveyIndex = surveys.findIndex((s) => s.id === existingSurvey.id);
      if (surveyIndex !== -1) {
        surveys[surveyIndex] = {
          ...existingSurvey,
          questions: questions.map((q, index) => ({ ...q, order: index + 1 })),
        };
      }
      toast.success("アンケートを更新しました");
    } else {
      // 新規アンケートを作成
      const surveyId = `SUR${String(Date.now()).slice(-6)}`;
      const newSurvey = {
        id: surveyId,
        eventId: id,
        questions: questions.map((q, index) => ({ ...q, order: index + 1 })),
        createdAt: new Date().toISOString(),
      };
      surveys.push(newSurvey);

      // 各送信先にトークンを生成
      selectedCustomers.forEach((customerId) => {
        const token = `survey-${customerId}-${surveyId}-${Date.now()}`;
        surveyTokens.push({
          surveyId,
          customerId,
          token,
          sentAt: new Date().toISOString(),
        });
      });

      toast.success(`${selectedCustomers.length}名にアンケート回答依頼メールを送信しました`);
    }
    router.push(`/admin/events/${id}`);
  };

  const addQuestion = () => {
    const newQuestion: SurveyQuestion = {
      id: `q-${Date.now()}-${Math.random()}`,
      title: "セッションの感想",
      order: questions.length + 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionId: string) => {
    if (questions.length === 1) {
      toast.error("設問は1つ以上必要です");
      return;
    }
    setQuestions(questions.filter((q) => q.id !== questionId).map((q, index) => ({ ...q, order: index + 1 })));
  };

  const updateQuestionTitle = (questionId: string, title: string) => {
    setQuestions(questions.map((q) => (q.id === questionId ? { ...q, title } : q)));
  };

  const toggleCustomer = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleAllCustomers = () => {
    if (selectedCustomers.length === attendees.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(attendees.map((a) => a.id));
    }
  };

  // メール本文にアンケートURLを挿入したプレビュー
  const previewBody = useMemo(() => {
    return emailBody.replace(/{SURVEY_URL}/g, selectedCustomers.length > 0 ? `http://localhost:3000/events/${id}/survey/demo-token` : "{SURVEY_URL}");
  }, [emailBody, id, selectedCustomers.length]);

  // ステップインジケーターコンポーネント
  const StepIndicator = () => {
    const steps = [
      { key: "create", label: "アンケート作成", number: 1 },
      { key: "customize", label: "メール文作成", number: 2 },
      { key: "confirm", label: "確認", number: 3 },
      { key: "send", label: "送信", number: 4 },
    ];

    const getStepStatus = (stepKey: string) => {
      const currentIndex = steps.findIndex((s) => s.key === step);
      const stepIndex = steps.findIndex((s) => s.key === stepKey);
      
      if (stepKey === "send") {
        return step === "confirm" ? "current" : "upcoming";
      }
      
      if (stepIndex <= currentIndex) return "completed";
      return "upcoming";
    };

    return (
      <div className="flex items-center justify-between w-full mb-6">
        {steps.map((stepItem) => {
          const status = getStepStatus(stepItem.key);
          
          return (
            <div key={stepItem.key} className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors mb-2",
                  status === "completed" && "bg-primary text-primary-foreground border-primary",
                  status === "current" && "bg-primary text-primary-foreground border-primary",
                  status === "upcoming" && "bg-background text-muted-foreground border-muted"
                )}
              >
                {status === "completed" ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{stepItem.number}</span>
                )}
              </div>
              <div
                className={cn(
                  "text-sm font-medium text-center",
                  status === "current" && "text-foreground",
                  status === "completed" && "text-muted-foreground",
                  status === "upcoming" && "text-muted-foreground"
                )}
              >
                {stepItem.label}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!event) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">イベントが見つかりませんでした。</p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/admin/events">イベント一覧に戻る</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ステップ1: アンケート作成
  if (step === "create") {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/events/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {existingSurvey ? "アンケート編集" : "アンケート作成"}
            </h1>
            <p className="text-muted-foreground">
              {existingSurvey ? "アンケートの設問を編集します。" : "アンケートの設問を作成します。"}
            </p>
          </div>
        </div>
        
        <StepIndicator />

        <Card>
          <CardHeader>
            <CardTitle>アンケート設問</CardTitle>
            <CardDescription>
              設問を追加してアンケートを作成します。各設問には評価と理由を入力してもらいます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`question-${question.id}`}>
                    設問 {index + 1}
                  </Label>
                  <Input
                    id={`question-${question.id}`}
                    value={question.title}
                    onChange={(e) => updateQuestionTitle(question.id, e.target.value)}
                    placeholder="設問タイトルを入力"
                  />
                </div>
                {questions.length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeQuestion(question.id)}
                    className="mt-8 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addQuestion}
              className="w-full cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              設問を追加
            </Button>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" asChild>
                <Link href={`/admin/events/${id}`}>キャンセル</Link>
              </Button>
              <Button variant="outline" onClick={handleCreateNext} className="cursor-pointer">
                次へ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ステップ2: メール文作成
  if (step === "customize") {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setStep("create")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {existingSurvey ? "アンケート編集" : "アンケート作成"}
            </h1>
            <p className="text-muted-foreground">
              回答依頼メールのタイトルと本文を編集できます。
            </p>
          </div>
        </div>
        
        <StepIndicator />

        <Card>
          <CardHeader>
            <CardTitle>送信先を選択</CardTitle>
            <CardDescription>
              このイベントの参加者のみが表示されます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
              <div>
                <span className="font-medium">{selectedCustomers.length}名</span> 選択中 / 全{attendees.length}名
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllCustomers}
                className="cursor-pointer"
              >
                {selectedCustomers.length === attendees.length ? "すべて解除" : "すべて選択"}
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">選択</TableHead>
                  <TableHead>氏名</TableHead>
                  <TableHead>会社名</TableHead>
                  <TableHead>メールアドレス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendees.map((attendee) => (
                  <TableRow key={attendee.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedCustomers.includes(attendee.id)}
                        onCheckedChange={() => toggleCustomer(attendee.id)}
                      />
                    </TableCell>
                    <TableCell>{attendee.name}</TableCell>
                    <TableCell>{attendee.company}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{attendee.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>メール文作成</CardTitle>
            <CardDescription>
              送信するメールのタイトルと本文を編集してください。本文内の {`{SURVEY_URL}`} はアンケート回答URLに自動的に置き換えられます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="emailTitle">メールタイトル</Label>
              <Input 
                id="emailTitle" 
                value={emailTitle}
                onChange={(e) => setEmailTitle(e.target.value)}
                placeholder="メールタイトルを入力"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="emailBody">メール本文</Label>
              <Textarea 
                id="emailBody" 
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="メール本文を入力"
                rows={20}
                style={{ minHeight: '400px' }}
              />
              <p className="text-sm text-muted-foreground">
                本文内に {`{SURVEY_URL}`} を記述すると、アンケート回答URLに自動的に置き換えられます。
              </p>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => setStep("create")}>
                戻る
              </Button>
              <Button variant="outline" onClick={handleCustomizeNext} className="cursor-pointer">
                次へ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ステップ3: 確認画面
  if (step === "confirm") {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setStep("customize")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {existingSurvey ? "アンケート編集" : "アンケート作成"}
            </h1>
            <p className="text-muted-foreground">
              送信内容を確認して、テスト送信または送信を実行してください。
            </p>
          </div>
        </div>
        
        <StepIndicator />

        <Card>
          <CardHeader>
            <CardTitle>確認</CardTitle>
            <CardDescription>
              送信内容を確認して、テスト送信または送信を実行してください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="font-medium mb-2">イベント情報</div>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">イベント名:</span> {event.title}</div>
                  <div><span className="font-medium">開催日時:</span> {formatEventDate(event.date)}</div>
                </div>
              </div>

              <div>
                <div className="font-medium mb-2">アンケート設問 ({questions.length}件)</div>
                <div className="space-y-2 text-sm">
                  {questions.map((q, index) => (
                    <div key={q.id}>
                      {index + 1}. {q.title}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-medium mb-2">送信先 ({selectedCustomers.length}名)</div>
                <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                  {selectedCustomers.map((customerId) => {
                    const customer = customers.find((c) => c.id === customerId);
                    return customer ? (
                      <div key={customerId}>
                        {customer.name} ({customer.email})
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div>
                <div className="font-medium mb-2">メール内容</div>
                <div className="space-y-4">
                  <div>
                    <div className="font-medium mb-2">タイトル:</div>
                    <div className="text-sm bg-muted p-3 rounded">{emailTitle}</div>
                  </div>
                  <div>
                    <div className="font-medium mb-2">本文:</div>
                    <div className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">{previewBody}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => setStep("customize")}>
                戻る
              </Button>
              <Button variant="outline" onClick={handleTestSend} className="cursor-pointer">
                <Mail className="h-4 w-4" />
                テスト送信
              </Button>
              <Button variant="outline" onClick={handleSend} className="cursor-pointer">
                <Send className="h-4 w-4" />
                送信
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

