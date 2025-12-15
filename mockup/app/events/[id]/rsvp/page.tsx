"use client";

import { useState, useEffect, use } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { events, customers, getCustomerByToken, getRSVPByEmail, rsvps } from "@/lib/data/mock";

export default function RSVPPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const event = events.find((e) => id === e.id);

  if (!event) {
    notFound();
  }
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [customer, setCustomer] = useState<typeof customers[0] | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"attend" | "decline" | null>(null);
  const [comment, setComment] = useState("");

  // トークンから顧客情報を取得（モック用：demo-tokenでも動作）
  useEffect(() => {
    if (token) {
      // モック用：demo-tokenの場合はダミーデータを使用
      if (token === "demo-token") {
        const demoCustomer = customers[0]; // 最初の顧客をダミーとして使用
        setCustomer(demoCustomer);
        return;
      }
      
      const customerData = getCustomerByToken(id, token);
      if (customerData) {
        setCustomer(customerData);
        
        // 既存の回答があれば読み込む
        const rsvp = rsvps.find((r) => r.eventId === id && r.customerId === customerData.id);
        if (rsvp && rsvp.status !== "未回答") {
          setStatus(rsvp.status === "参加" ? "attend" : "decline");
        }
      }
    }
  }, [token, id]);

  const handleEmailSubmit = () => {
    if (!email) {
      toast.error("メールアドレスを入力してください");
      return;
    }
    
    const rsvp = getRSVPByEmail(id, email);
    if (!rsvp) {
      toast.error("このメールアドレスはこのイベントに招待されていません");
      return;
    }
    
    const customerData = customers.find((c) => c.id === rsvp.customerId);
    if (customerData) {
      setCustomer(customerData);
      setEmailVerified(true);
      
      // 既存の回答があれば読み込む
      if (rsvp.status !== "未回答") {
        setStatus(rsvp.status === "参加" ? "attend" : "decline");
      }
    }
  };

  const handleSubmit = () => {
    if (!customer) {
      toast.error("認証エラーが発生しました");
      return;
    }
    
    if (!status) {
      toast.error("参加・不参加を選択してください");
      return;
    }
    
    // 回答期限チェック
    if (event.responseDeadline) {
      const deadline = new Date(event.responseDeadline);
      const now = new Date();
      if (now > deadline) {
        toast.error("回答期限を過ぎています");
        return;
      }
    }
    
    setSubmitted(true);
    toast.success("回答を受け付けました");
  };

  // 回答期限チェック
  const isDeadlinePassed = event.responseDeadline 
    ? new Date() > new Date(event.responseDeadline)
    : false;

  // トークンがない場合はメールアドレス入力画面
  if (!token && !emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{event.title}</CardTitle>
            <CardDescription className="mt-2 space-y-1 text-base">
              <p>日時: {event.date}</p>
              <p>場所: {event.location}</p>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium mb-2">メールアドレスを入力してください</p>
              <p className="text-xs text-muted-foreground mb-4">
                このイベントに招待されたメールアドレスを入力してください。
              </p>
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleEmailSubmit();
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button className="w-full cursor-pointer" size="lg" variant="outline" onClick={handleEmailSubmit}>
              確認する
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // トークンがあるが顧客情報が取得できない場合
  if (token && !customer && token !== "demo-token") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>アクセスエラー</CardTitle>
            <CardDescription>
              このページにアクセスするには有効な招待URLが必要です。
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>回答を受け付けました</CardTitle>
            <CardDescription>
              ご回答ありがとうございます。
              {status === "attend" && (
                <>
                  <br />
                  当日お会いできるのを楽しみにしています。
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center flex-col gap-2">
            <p className="text-sm text-muted-foreground">この画面を閉じてください</p>
            {!isDeadlinePassed && (
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false);
                }}
              >
                回答を変更する
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 回答フォーム表示
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{event.title}</CardTitle>
          <CardDescription className="mt-2 space-y-1 text-base">
            <p>日時: {event.date}</p>
            <p>場所: {event.location}</p>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium">{customer?.name} 様</p>
          </div>

          {isDeadlinePassed && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">回答期限を過ぎています</p>
                <p className="text-xs mt-1">回答期限: {event.responseDeadline}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Label className="text-base">出欠を選択してください</Label>
            <RadioGroup 
              value={status || undefined}
              onValueChange={(v) => setStatus(v as any)} 
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="attend" id="attend" className="peer sr-only" />
                <Label
                  htmlFor="attend"
                  className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer text-center h-full transition-colors ${
                    status === "attend"
                      ? "border-green-500 bg-green-50 text-green-900"
                      : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <span className="text-xl mb-2">🙆‍♂️</span>
                  <span className="font-semibold">参加する</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="decline" id="decline" className="peer sr-only" />
                <Label
                  htmlFor="decline"
                  className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer text-center h-full transition-colors ${
                    status === "decline"
                      ? "border-red-500 bg-red-50 text-red-900"
                      : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <span className="text-xl mb-2">🙅‍♀️</span>
                  <span className="font-semibold">参加しない</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">メッセージ・連絡事項 (任意)</Label>
            <Textarea 
              id="comment" 
              placeholder="アレルギーや遅刻の連絡など..." 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            className="w-full cursor-pointer" 
            size="lg"
            variant="outline"
            onClick={handleSubmit}
            disabled={isDeadlinePassed}
          >
            {isDeadlinePassed ? "回答期限を過ぎています" : "回答を送信する"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
