"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, Send, Mail, Check } from "lucide-react";
import { customers, events, rsvps, getEventStatus } from "@/lib/data/mock";
import type { Customer } from "@/lib/types";
import React from "react";
import { cn, getRemindEmailTemplate, formatEventDate } from "@/lib/utils";

type Step = "select" | "customize" | "confirm";

export default function EventRemindPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const eventData = events.find((e) => e.id === id);
  
  if (!eventData) {
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

  const eventStatus = getEventStatus(eventData);
  const event = eventData;

  // このイベントのRSVPデータを取得
  const eventRsvps = rsvps.filter((r) => r.eventId === id);
  
  // 未回答者のみを取得
  const noResponseAttendees = useMemo(() => {
    const noResponseRsvps = eventRsvps.filter((r) => r.status === "未回答");
    return noResponseRsvps.map((rsvp) => {
      const customer = customers.find((c) => c.id === rsvp.customerId);
      return customer ? { ...customer, rsvpStatus: rsvp.status } : null;
    }).filter((a): a is NonNullable<typeof a> => a !== null);
  }, [eventRsvps]);

  const [step, setStep] = useState<Step>("select");
  const [emailTitle, setEmailTitle] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // デフォルトのメールタイトルと本文を設定
  useEffect(() => {
    if (event) {
      const template = getRemindEmailTemplate({
        title: event.title,
        description: event.description,
        date: event.date,
        timetable: (event as any).timetable,
        location: event.location,
        note: (event as any).note,
      });
      setEmailTitle(template.title);
      setEmailBody(template.body);
    }
  }, [event]);

  // 未回答者がいない場合
  if (noResponseAttendees.length === 0) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">未回答者がいません。</p>
          <Button variant="outline" asChild className="mt-4">
            <Link href={`/admin/events/${id}`}>イベント詳細に戻る</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleSelectNext = () => {
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
    toast.success(`未回答者${noResponseAttendees.length}名にリマインドメールを送信しました`);
    router.push(`/admin/events/${id}`);
  };

  // ステップインジケーターコンポーネント
  const StepIndicator = () => {
    const steps = [
      { key: "select", label: "送信先確認", number: 1 },
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

  // ステップ1: 送信先確認（固定、変更不可）
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
            <h1 className="text-2xl font-bold tracking-tight">未回答者への再送</h1>
            <p className="text-sm text-muted-foreground">
              未回答者へのリマインドメールを送信します。
            </p>
          </div>
        </div>
        
        <StepIndicator />

        <Card>
          <CardHeader>
            <CardTitle>送信先確認</CardTitle>
            <CardDescription>
              未回答者{noResponseAttendees.length}名にリマインドメールを送信します。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
              <div>
                <span className="font-medium">{noResponseAttendees.length}名</span> 送信予定
              </div>
            </div>

            <div className="rounded-md border">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium" style={{ fontSize: '14px' }}>氏名</th>
                      <th className="px-4 py-3 text-left text-sm font-medium" style={{ fontSize: '14px' }}>会社名</th>
                      <th className="px-4 py-3 text-left text-sm font-medium" style={{ fontSize: '14px' }}>会員区分</th>
                      <th className="px-4 py-3 text-left text-sm font-medium" style={{ fontSize: '14px' }}>メールアドレス</th>
                    </tr>
                  </thead>
                  <tbody>
                    {noResponseAttendees.map((attendee) => (
                      <tr key={attendee.id} className="border-t">
                        <td className="px-4 py-3" style={{ fontSize: '14px' }}>{attendee.name}</td>
                        <td className="px-4 py-3" style={{ fontSize: '14px' }}>{attendee.company}</td>
                        <td className="px-4 py-3" style={{ fontSize: '14px' }}>
                          <div className="flex gap-1 flex-wrap items-center">
                            {(() => {
                              const badges: React.ReactElement[] = [];
                              
                              // 非会員の判定（communitiesが空配列）
                              if (attendee.communities.length === 0) {
                                badges.push(
                                  <Badge key="non-member" variant="secondary">
                                    非会員
                                  </Badge>
                                );
                              } else if (attendee.memberCategory === "member") {
                                const hasAudit = attendee.communities.includes("ベンチャー監査役の会");
                                const hasNaikan = attendee.communities.includes("ないかんMeetup");
                                
                                if (hasNaikan && !hasAudit) {
                                  badges.push(
                                    <Badge key="naikan-member" variant="default">
                                      ないかんMeetup(会員)
                                    </Badge>
                                  );
                                } else if (hasAudit && !hasNaikan) {
                                  const auditType = attendee.auditMemberType === "regular" ? "正会員" : "オンライン会員";
                                  badges.push(
                                    <Badge key="audit-member" variant="default">
                                      ベンチャー監査役の会({auditType})
                                    </Badge>
                                  );
                                } else if (hasAudit && hasNaikan) {
                                  const auditType = attendee.auditMemberType === "regular" ? "正会員" : "オンライン会員";
                                  badges.push(
                                    <Badge key="audit-member" variant="default">
                                      ベンチャー監査役の会({auditType})
                                    </Badge>
                                  );
                                  badges.push(
                                    <Badge key="naikan-member" variant="default">
                                      ないかんMeetup(会員)
                                    </Badge>
                                  );
                                }
                                
                                if (attendee.auditMemberPremium) {
                                  badges.push(
                                    <Badge key="premium" variant="premium">
                                      プレミアム
                                    </Badge>
                                  );
                                }
                              } else if (attendee.memberCategory === "sponsor") {
                                if (attendee.communities.includes("ないかんMeetup")) {
                                  badges.push(
                                    <Badge key="sponsor-naikan" variant="default">
                                      ないかんMeetup(スポンサー)
                                    </Badge>
                                  );
                                }
                                if (attendee.communities.includes("ベンチャー監査役の会")) {
                                  badges.push(
                                    <Badge key="sponsor-audit" variant="default">
                                      ベンチャー監査役の会(スポンサー)
                                    </Badge>
                                  );
                                }
                              } else if (attendee.memberCategory === "observer") {
                                if (attendee.communities.includes("ないかんMeetup")) {
                                  badges.push(
                                    <Badge key="observer-naikan" variant="default">
                                      ないかんMeetup(オブザーバー)
                                    </Badge>
                                  );
                                }
                                if (attendee.communities.includes("ベンチャー監査役の会")) {
                                  badges.push(
                                    <Badge key="observer-audit" variant="default">
                                      ベンチャー監査役の会(オブザーバー)
                                    </Badge>
                                  );
                                }
                              }
                              
                              return badges.length > 0 ? badges : null;
                            })()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground" style={{ fontSize: '14px' }}>{attendee.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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
            <h1 className="text-2xl font-bold tracking-tight">未回答者への再送</h1>
            <p className="text-sm text-muted-foreground">
              リマインドメールのタイトルと本文を編集できます。
            </p>
          </div>
        </div>
        
        <StepIndicator />

        <Card>
          <CardHeader>
            <CardTitle>メール文作成</CardTitle>
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
                rows={30}
                style={{ minHeight: '480px' }}
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

  // ステップ3: 確認画面
  if (step === "confirm") {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setStep("customize")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">未回答者への再送</h1>
            <p className="text-sm text-muted-foreground">
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
            <Card>
              <CardHeader>
                <CardTitle>送信先</CardTitle>
                <CardDescription>
                  {noResponseAttendees.length}名に送信します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                  {noResponseAttendees.map((attendee) => (
                    <div key={attendee.id}>
                      {attendee.name} ({attendee.email})
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>メール内容</CardTitle>
                <CardDescription>
                  送信するメールのタイトルと本文です
                </CardDescription>
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

