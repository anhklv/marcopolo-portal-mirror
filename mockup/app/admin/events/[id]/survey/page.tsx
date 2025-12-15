"use client";

import { useState, use, useEffect, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Send, Mail, Check, FileText } from "lucide-react";
import { customers, events, rsvps, getEventStatus } from "@/lib/data/mock";
import { cn } from "@/lib/utils";

type Step = "select" | "customize" | "confirm";

export default function EventSurveyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const eventData = events.find((e) => e.id === id);
  const event = eventData ? { ...eventData, status: getEventStatus(eventData) } : null;
  
  const [step, setStep] = useState<Step>("select");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [emailTitle, setEmailTitle] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [formUrl, setFormUrl] = useState("");

  // このイベントの参加者のみを取得
  const attendees = useMemo(() => {
    if (!event) return [];
    const eventRsvps = rsvps.filter((r) => r.eventId === id && r.status === "参加");
    return eventRsvps.map((rsvp) => {
      const customer = customers.find((c) => c.id === rsvp.customerId);
      return customer ? { ...customer, rsvpStatus: rsvp.status } : null;
    }).filter((a): a is NonNullable<typeof a> => a !== null);
  }, [event, id]);

  // デフォルトのメールタイトルと本文を設定
  useEffect(() => {
    if (!event) return;
    
    const defaultTitle = `【${event.title}】アンケートのお願い`;
    const defaultBody = `この度は、${event.title}にご参加いただき、誠にありがとうございました。

【イベント詳細】
${event.description ? `概要: ${event.description}\n` : ""}${event.date ? `開催日時: ${event.date}\n` : ""}${event.location ? `場所: ${event.location}\n` : ""}

今後のイベント改善のため、アンケートへのご協力をお願いいたします。
以下のURLよりご回答をお願いいたします。

{FORM_URL}

ご多忙の中恐縮ですが、よろしくお願いいたします。`;
    
    setEmailTitle(defaultTitle);
    setEmailBody(defaultBody);
  }, [event?.id, event?.title, event?.description, event?.date, event?.location]);

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

  const handleSelectNext = () => {
    if (selectedCustomers.length === 0) {
      toast.error("送信する参加者を選択してください");
      return;
    }
    setStep("customize");
  };

  const handleCustomizeNext = () => {
    if (!emailTitle || !emailBody) {
      toast.error("メールタイトルと本文を入力してください");
      return;
    }
    if (!formUrl) {
      toast.error("GoogleフォームのURLを入力してください");
      return;
    }
    setStep("confirm");
  };

  const handleTestSend = () => {
    toast.success("テストメールを送信しました");
  };

  const handleSend = () => {
    toast.success(`${selectedCustomers.length}名にアンケートメールを送信しました`);
    router.push(`/admin/events/${id}`);
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

  // メール本文にGoogleフォームURLを挿入したプレビュー
  const previewBody = useMemo(() => {
    return emailBody.replace(/{FORM_URL}/g, formUrl || "{FORM_URL}");
  }, [emailBody, formUrl]);

  // ステップインジケーターコンポーネント
  const StepIndicator = () => {
    const steps = [
      { key: "select", label: "送信先を選択", number: 1 },
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

  // 終了していないイベントの場合はエラー表示
  if (event.status !== "closed") {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">アンケートメールは終了したイベントのみ送信できます。</p>
          <Button variant="outline" asChild className="mt-4">
            <Link href={`/admin/events/${id}`}>イベント詳細に戻る</Link>
          </Button>
        </div>
      </div>
    );
  }

  // 参加者がいない場合
  if (attendees.length === 0) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">このイベントには参加者がいません。</p>
          <Button variant="outline" asChild className="mt-4">
            <Link href={`/admin/events/${id}`}>イベント詳細に戻る</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ステップ1: 送信先を選ぶ
  if (step === "select") {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/events/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">アンケートメール送信</h1>
            <p className="text-muted-foreground">
              アンケートメールを送信する参加者を選択してください。
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
                  <TableHead>会員区分</TableHead>
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
                    <TableCell>
                      <Badge
                        variant={
                          attendee.type === "非会員" ? "secondary" : "default"
                        }
                      >
                        {attendee.type === "監査役協会会員" ? "監査役協会" :
                         attendee.type === "ないかんMeetup会員" ? "ないかんMeetup" :
                         attendee.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{attendee.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" asChild>
                <Link href={`/admin/events/${id}`}>キャンセル</Link>
              </Button>
              <Button variant="outline" onClick={handleSelectNext} className="cursor-pointer">
                次へ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ステップ2: タイトルとメール文面をカスタマイズ
  if (step === "customize") {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setStep("select")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">アンケートメール送信</h1>
            <p className="text-muted-foreground">
              アンケートメールのタイトルと本文を編集できます。
            </p>
          </div>
        </div>
        
        <StepIndicator />

        <Card>
          <CardHeader>
            <CardTitle>メール文作成</CardTitle>
            <CardDescription>
              送信するメールのタイトルと本文を編集してください。本文内の {`{FORM_URL}`} はGoogleフォームのURLに自動的に置き換えられます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="formUrl">GoogleフォームURL <span className="text-destructive">*</span></Label>
              <Input 
                id="formUrl" 
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://docs.google.com/forms/..."
                type="url"
              />
              <p className="text-sm text-muted-foreground">
                アンケート用のGoogleフォームのURLを入力してください。
              </p>
            </div>

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
                本文内に {`{FORM_URL}`} を記述すると、GoogleフォームのURLに自動的に置き換えられます。
              </p>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => setStep("select")}>
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
            <h1 className="text-3xl font-bold tracking-tight">アンケートメール送信</h1>
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
                  <div><span className="font-medium">開催日時:</span> {event.date}</div>
                  {event.location && <div><span className="font-medium">場所:</span> {event.location}</div>}
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
                <div className="font-medium mb-2">GoogleフォームURL</div>
                <div className="text-sm bg-muted p-3 rounded break-all">
                  {formUrl || "未入力"}
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

