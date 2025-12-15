"use client";

import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import { ArrowLeft, Send, Mail, Check } from "lucide-react";
import { customers } from "@/lib/data/mock";
import { cn, formatEventDate } from "@/lib/utils";

type Step = "form" | "success" | "select" | "customize" | "confirm";

export default function NewEventPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  
  // フォームデータ
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [overview, setOverview] = useState("");
  const [timetable, setTimetable] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [responseDeadline, setResponseDeadline] = useState("");
  
  // 案内メール送信データ
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [emailTitle, setEmailTitle] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // デフォルトのメールタイトルと本文を設定
  const getDefaultEmailTitle = () => {
    return title ? `【${title}】ご案内` : "【イベント】ご案内";
  };

  const getDefaultEmailBody = () => {
    return `この度は、${title || "イベント"}にご案内いたします。

【イベント詳細】
${overview ? `概要: ${overview}\n` : ""}${date ? `開催日時: ${formatEventDate(date)}\n` : ""}${location ? `場所: ${location}\n` : ""}${timetable ? `タイムテーブル:\n${timetable}\n` : ""}

ご参加の可否について、以下のURLよりご回答をお願いいたします。
{RSVP_URL}

${note ? `【備考】\n${note}\n` : ""}
よろしくお願いいたします。`;
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !date) {
      toast.error("イベント名と開催日時は必須です");
      return;
    }
    
    // イベントを保存（モック: 実際はAPI呼び出し）
    // イベントIDを生成（モック: 実際はサーバーから返される）
    const eventId = `E${String(Date.now()).slice(-6)}`;
    setCreatedEventId(eventId);
    
    // 成功メッセージを表示
    toast.success("イベントを作成しました");
    
    // デフォルトのメールタイトルと本文を設定
    setEmailTitle(getDefaultEmailTitle());
    setEmailBody(getDefaultEmailBody());
    
    // 成功画面へ
    setStep("success");
  };

  const handleStartInvite = () => {
    // 案内フローを開始
    setStep("select");
  };

  const handleSkipInvite = () => {
    // イベント詳細ページへ遷移
    if (createdEventId) {
      router.push(`/admin/events/${createdEventId}`);
    } else {
      router.push("/admin/events");
    }
  };

  const handleSelectNext = () => {
    if (selectedCustomers.length === 0) {
      toast.error("案内する顧客を選択してください");
      return;
    }
    setStep("customize");
  };

  const handleCustomizeNext = () => {
    if (!emailTitle || !emailBody) {
      toast.error("メールタイトルと本文を入力してください");
      return;
    }
    setStep("confirm");
  };

  const handleTestSend = () => {
    toast.success("テストメールを送信しました");
  };

  const handleSend = () => {
    toast.success(`${selectedCustomers.length}名に案内メールを送信しました`);
    // イベント詳細ページへ遷移
    if (createdEventId) {
      router.push(`/admin/events/${createdEventId}`);
    } else {
      router.push("/admin/events");
    }
  };

  const toggleCustomer = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  // ステップインジケーターコンポーネント
  const StepIndicator = () => {
    const steps = [
      { key: "select", label: "案内者を選択", number: 1 },
      { key: "customize", label: "メール文作成", number: 2 },
      { key: "confirm", label: "確認", number: 3 },
      { key: "send", label: "送信", number: 4 },
    ];

    const getStepStatus = (stepKey: string) => {
      const currentIndex = steps.findIndex((s) => s.key === step);
      const stepIndex = steps.findIndex((s) => s.key === stepKey);
      
      if (stepIndex < currentIndex) return "completed";
      if (stepIndex === currentIndex) return "current";
      return "upcoming";
    };

    return (
      <div className="flex items-center justify-between w-full mb-6">
        {steps.map((stepItem, index) => {
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

  // ステップ1: フォーム入力
  if (step === "form") {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">イベント作成</h1>
            <p className="text-muted-foreground">
              新しいイベントを作成します。
            </p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-8 rounded-lg border p-8 shadow-sm">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">イベント名 <span className="text-red-500">*</span></Label>
              <Input 
                id="title" 
                placeholder="例: 第10回 監査役交流会" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required 
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">開催日時 <span className="text-red-500">*</span></Label>
              <Input 
                id="date" 
                type="datetime-local" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required 
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="overview">イベント概要</Label>
              <Textarea 
                id="overview" 
                placeholder="イベントの概要を入力してください" 
                rows={5}
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="timetable">タイムテーブル</Label>
              <Textarea 
                id="timetable" 
                placeholder="タイムテーブルを入力してください" 
                rows={5}
                value={timetable}
                onChange={(e) => setTimetable(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">場所</Label>
              <Textarea 
                id="location" 
                placeholder="例: 東京都港区六本木 1-1-1 会議室A" 
                rows={3}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">備考</Label>
              <Textarea 
                id="note" 
                placeholder="備考を入力してください" 
                rows={5}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="responseDeadline">回答期限</Label>
              <Input
                id="responseDeadline"
                type="datetime-local"
                value={responseDeadline}
                onChange={(e) => setResponseDeadline(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                回答期限を設定しない場合、イベント開催日まで回答を受け付けます。
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/admin/events">キャンセル</Link>
            </Button>
            <Button type="submit" variant="outline" className="cursor-pointer">作成する</Button>
          </div>
        </form>
      </div>
    );
  }

  // ステップ2: イベント作成成功
  if (step === "success") {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">イベントを作成しました</h1>
            <p className="text-muted-foreground">
              イベント情報を保存しました。次に案内メールを送信しますか？
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>次のステップ</CardTitle>
            <CardDescription>
              作成したイベントに案内メールを送信するか、後で送信することができます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">作成したイベント:</div>
              <div className="text-lg font-medium">{title}</div>
              <div className="text-sm text-muted-foreground">{date}</div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={handleSkipInvite} className="cursor-pointer">
                後で送信する
              </Button>
              <Button variant="outline" onClick={handleStartInvite} className="cursor-pointer">
                <Mail className="h-4 w-4" />
                案内メールを送信する
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ステップ3: 案内する人を選ぶ
  if (step === "select") {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setStep("success")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">案内メール送信</h1>
            <p className="text-muted-foreground">
              案内メールを送信する顧客を選択してください。
            </p>
          </div>
        </div>
        
        <StepIndicator />

        <Card>
          <CardHeader>
            <CardTitle>案内メール送信</CardTitle>
            <CardDescription>
              未案内の顧客を選択して案内メールを送信します。
              <br/>
              ※送信時に自動で個別ID付きURLが生成されます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
              <div>
                <span className="font-medium">{selectedCustomers.length}名</span> 選択中
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">選択</TableHead>
                  <TableHead>氏名</TableHead>
                  <TableHead>会社名</TableHead>
                  <TableHead>会員区分</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedCustomers.includes(customer.id)}
                        onCheckedChange={() => toggleCustomer(customer.id)}
                      />
                    </TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.company}</TableCell>
                    <TableCell>{customer.type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => setStep("success")}>
                戻る
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

  // ステップ4: タイトルとメール文面をカスタマイズ
  if (step === "customize") {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setStep("select")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">案内メール送信</h1>
            <p className="text-muted-foreground">
              案内メールのタイトルと本文を編集できます。
            </p>
          </div>
        </div>
        
        <StepIndicator />

        <Card>
          <CardHeader>
            <CardTitle>メール内容</CardTitle>
            <CardDescription>
              送信するメールのタイトルと本文を編集してください。
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
                rows={15}
              />
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

  // ステップ5: 確認画面
  if (step === "confirm") {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setStep("customize")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">案内メール送信</h1>
            <p className="text-muted-foreground">
              送信内容を確認して、テスト送信または送信を実行してください。
            </p>
          </div>
        </div>
        
        <StepIndicator />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>イベント情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><span className="font-medium">イベント名:</span> {title}</div>
              <div><span className="font-medium">開催日時:</span> {date ? formatEventDate(date) : ""}</div>
              {location && <div><span className="font-medium">場所:</span> {location}</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>送信先 ({selectedCustomers.length}名)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedCustomers.map((customerId) => {
                  const customer = customers.find((c) => c.id === customerId);
                  return customer ? (
                    <div key={customerId} className="text-sm">
                      {customer.name} ({customer.email})
                    </div>
                  ) : null;
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>メール内容</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-medium mb-2">タイトル:</div>
                <div className="text-sm bg-muted p-3 rounded">{emailTitle}</div>
              </div>
              <div>
                <div className="font-medium mb-2">本文:</div>
                <div className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">{emailBody}</div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
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
        </div>
      </div>
    );
  }

  return null;
}

