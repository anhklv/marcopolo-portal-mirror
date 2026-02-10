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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Mail, Check } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FormField } from "@/components/ui/form-field";
import { ActionButton } from "@/components/ui/action-button";
import { customers, events, rsvps, getEventStatus, getSurveyByEventId, surveyTokens } from "@/lib/data/mock";
import React from "react";
import { cn, getSurveyRequestEmailTemplate } from "@/lib/utils";
import { SectionHeading } from "@/components/ui/section-heading";
import { USER_ROLE_CONFIG } from "@/lib/constants/customer";

type Step = "select" | "customize" | "confirm";

export default function EventSurveyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const eventData = events.find((e) => e.id === id);
  const eventStatus = eventData ? getEventStatus(eventData) : null;
  const event = eventData ? { ...eventData } : null;
  
  const [step, setStep] = useState<Step>("select");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [emailTitle, setEmailTitle] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const survey = getSurveyByEventId(id);

  // このイベントの参加者のみを取得（通常参加とオンライン参加の両方）
  const attendees = useMemo(() => {
    if (!event) return [];
    const eventRsvps = rsvps.filter((r) => r.eventId === id && (r.status === "attending" || r.status === "online"));
    return eventRsvps.map((rsvp) => {
      const customer = customers.find((c) => c.id === rsvp.customerId);
      return customer ? { ...customer, rsvpStatus: rsvp.status, attendanceType: rsvp.attendanceType } : null;
    }).filter((a): a is NonNullable<typeof a> => a !== null);
  }, [event, id]);

  // デフォルトのメールタイトルと本文を設定
  useEffect(() => {
    if (!event) return;

    const template = getSurveyRequestEmailTemplate({
      title: event.title,
    });
    setEmailTitle(template.title);
    setEmailBody(template.body);
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
    setStep("confirm");
  };

  const handleTestSend = () => {
    toast.success("テストメールを送信しました");
  };

  const handleSend = () => {
    // アンケートが存在する場合はトークンを生成、存在しない場合は固定の質問のみのアンケートとして送信
    if (survey) {
      // 各送信先にトークンを生成
      selectedCustomers.forEach((customerId) => {
        const token = `survey-${customerId}-${survey.id}-${Date.now()}`;
        surveyTokens.push({
          surveyId: survey.id,
          customerId,
          token,
          sentAt: new Date().toISOString(),
        });
      });
    } else {
      // アンケートが存在しない場合でも、固定の質問のみのアンケートとして送信可能
      // トークンは生成しない（固定質問のみのアンケート回答ページで処理）
      // 実際の実装では、固定質問のみのアンケート用のトークンを生成する必要がある
    }

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

  // メール本文にアンケートURLを挿入したプレビュー
  const previewBody = useMemo(() => {
    const surveyUrl = selectedCustomers.length > 0
      ? `http://localhost:3000/events/${id}/survey/demo-token`
      : "{SURVEY_URL}";
    return emailBody.replace(/{SURVEY_URL}/g, surveyUrl);
  }, [emailBody, id, selectedCustomers.length]);

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
  if (eventStatus !== "closed") {
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

  // ベンチャー監査役の会のイベントのみアンケート送信可能
  const eventType = (event as any).eventType || "ベンチャー監査役の会";
  if (eventType !== "ベンチャー監査役の会") {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">アンケートメールはベンチャー監査役の会のイベントのみ送信できます。</p>
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
        <PageHeader
          backHref={`/admin/events/${id}`}
          title="アンケートメール送信"
          description="アンケートメールを送信する参加者を選択してください。"
        />
        
        <StepIndicator />

        <div className="space-y-4">
          <div className="space-y-2">
            <SectionHeading>送信先を選択</SectionHeading>
            <p className="text-sm text-muted-foreground">
              このイベントの参加者のみが表示されます。
            </p>
          </div>

          <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
              <div>
                <span className="font-medium">{selectedCustomers.length}名</span> 選択中 / 全{attendees.length}名
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllCustomers}
              >
                {selectedCustomers.length === attendees.length ? "すべて解除" : "すべて選択"}
              </Button>
            </div>

          <div className="rounded-lg bg-card">
            <Table className="[&_th]:py-4 [&_td]:py-4">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">選択</TableHead>
                  <TableHead>氏名</TableHead>
                  <TableHead>会社名</TableHead>
                  <TableHead>会員区分</TableHead>
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
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-1 flex-wrap items-center">
                          {(() => {
                            const badges: React.ReactElement[] = [];

                            // 非会員の判定（communitiesが空配列）
                            if (attendee.communities.length === 0) {
                              badges.push(
                                <Badge key="non-member" variant="non-member">
                                  非会員
                                </Badge>
                              );
                            } else if (attendee.memberCategory === "member") {
                              const hasAudit = attendee.communities.includes("ベンチャー監査役の会");
                              const hasNaikan = attendee.communities.includes("ないかんMeetup");
                              const hasAi = attendee.communities.includes("AI部会");

                              // ベンチャー監査役の会のバッジ
                              if (hasAudit) {
                                const auditType = attendee.auditMemberType === "regular" ? "正会員" : "オンライン会員";
                                badges.push(
                                  <Badge key="audit-member" variant="audit">
                                    ベンチャー監査役の会({auditType})
                                  </Badge>
                                );
                              }
                              // ないかんMeetupのバッジ
                              if (hasNaikan) {
                                badges.push(
                                  <Badge key="naikan-member" variant="naikan">
                                    ないかんMeetup(会員)
                                  </Badge>
                                );
                              }
                              // AI部会のバッジ
                              if (hasAi) {
                                badges.push(
                                  <Badge key="ai-member" variant="ai">
                                    AI部会(会員)
                                  </Badge>
                                );
                              }

                              // プレミアム会員バッジ
                              if (attendee.auditMemberPremium) {
                                badges.push(
                                  <Badge key="premium" variant={USER_ROLE_CONFIG.premium.variant as any}>
                                    {USER_ROLE_CONFIG.premium.label}
                                  </Badge>
                                );
                              }
                            } else if (attendee.memberCategory === "sponsor") {
                              if (attendee.communities.includes("ベンチャー監査役の会")) {
                                badges.push(
                                  <Badge key="sponsor-audit" variant="audit">
                                    ベンチャー監査役の会(スポンサー)
                                  </Badge>
                                );
                              }
                              if (attendee.communities.includes("ないかんMeetup")) {
                                badges.push(
                                  <Badge key="sponsor-naikan" variant="naikan">
                                    ないかんMeetup(スポンサー)
                                  </Badge>
                                );
                              }
                              if (attendee.communities.includes("AI部会")) {
                                badges.push(
                                  <Badge key="sponsor-ai" variant="ai">
                                    AI部会(スポンサー)
                                  </Badge>
                                );
                              }
                            } else if (attendee.memberCategory === "observer") {
                              if (attendee.communities.includes("ベンチャー監査役の会")) {
                                badges.push(
                                  <Badge key="observer-audit" variant="audit">
                                    ベンチャー監査役の会(オブザーバー)
                                  </Badge>
                                );
                              }
                              if (attendee.communities.includes("ないかんMeetup")) {
                                badges.push(
                                  <Badge key="observer-naikan" variant="naikan">
                                    ないかんMeetup(オブザーバー)
                                  </Badge>
                                );
                              }
                              if (attendee.communities.includes("AI部会")) {
                                badges.push(
                                  <Badge key="observer-ai" variant="ai">
                                    AI部会(オブザーバー)
                                  </Badge>
                                );
                              }
                            }

                            return badges.length > 0 ? badges : null;
                          })()}
                        </div>
                        {attendee.rsvpStatus === "online" && (
                          <Badge variant="online">
                            オンライン参加
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <ActionButton variant="outline" asChild>
              <Link href={`/admin/events/${id}`}>キャンセル</Link>
            </ActionButton>
            <ActionButton onClick={handleSelectNext}>
              次へ
            </ActionButton>
          </div>
        </div>
      </div>
    );
  }

  // ステップ2: タイトルとメール文面をカスタマイズ
  if (step === "customize") {
    return (
      <div className="max-w-4xl space-y-6">
        <PageHeader
          backAction={() => setStep("select")}
          title="アンケートメール送信"
          description="アンケートメールのタイトルと本文を編集できます。"
        />
        
        <StepIndicator />

        <div className="space-y-6">
          <div className="space-y-2">
            <SectionHeading>メール文作成</SectionHeading>
            <p className="text-sm text-muted-foreground">
              送信するメールのタイトルと本文を編集してください。
            </p>
          </div>

          <FormField label="メールタイトル">
            <Input
              value={emailTitle}
              onChange={(e) => setEmailTitle(e.target.value)}
              placeholder="メールタイトルを入力"
            />
          </FormField>

          <FormField
            label="メール本文"
            description={`本文内に {SURVEY_URL} を記述すると、アンケート回答URLに自動的に置き換えられます。`}
          >
            <Textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="メール本文を入力"
              rows={30}
              className="min-h-[480px]"
            />
          </FormField>

          <div className="flex justify-center gap-4 pt-4">
            <ActionButton variant="outline" onClick={() => setStep("select")}>
              戻る
            </ActionButton>
            <ActionButton onClick={handleCustomizeNext}>
              次へ
            </ActionButton>
          </div>
        </div>
      </div>
    );
  }

  // ステップ3: 確認画面
  if (step === "confirm") {
    return (
      <div className="max-w-4xl space-y-6">
        <PageHeader
          backAction={() => setStep("customize")}
          title="アンケートメール送信"
          description="送信内容を確認して、テスト送信または送信を実行してください。"
        />
        
        <StepIndicator />

        <div className="space-y-6">
          <div className="space-y-4">
            <SectionHeading>送信先</SectionHeading>
            <p className="text-sm text-muted-foreground">
              {selectedCustomers.length}名に送信します
            </p>
            <div className="space-y-2 text-sm">
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

          <div className="space-y-4">
            <SectionHeading>メール内容</SectionHeading>
            <p className="text-sm text-muted-foreground">
              送信するメールのタイトルと本文です
            </p>
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

          <div className="flex justify-center gap-4 pt-4">
            <ActionButton variant="outline" onClick={() => setStep("customize")}>
              戻る
            </ActionButton>
            <ActionButton variant="outline" onClick={handleTestSend}>
              <Mail className="h-4 w-4" />
              テスト送信
            </ActionButton>
            <ActionButton onClick={handleSend}>
              <Send className="h-4 w-4" />
              送信
            </ActionButton>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
