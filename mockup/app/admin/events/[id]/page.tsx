"use client";

import { useState, useMemo, use } from "react";
import Link from "next/link";
import { notFound, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { ArrowLeft, Mail, Edit, MoreVertical, Pause, Play, FileText, Search, ChevronDown, Send } from "lucide-react";
import { events, customers, rsvps, getEventStatus, getSurveyByEventId, getSurveyResponses, getFixedSurveyResponses } from "@/lib/data/mock";
import { RSVP_STATUSES } from "@/lib/constants/event";
import { cn, formatEventDate, formatDateTime } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") || "attendees"; // デフォルトは "attendees"
  const eventData = events.find((e) => e.id === id);

  if (!eventData) {
    notFound();
  }

  const eventStatus = getEventStatus(eventData);
  const [isPaused, setIsPaused] = useState(eventData.isPaused ?? false);
  const event = eventData;
  const survey = getSurveyByEventId(id);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [statusSearch, setStatusSearch] = useState("");

  // このイベントのRSVPデータを取得
  const eventRsvps = rsvps.filter((r) => r.eventId === id);
  
  // 参加者リストを作成（RSVPデータと顧客データを結合）
  const allAttendees = eventRsvps.map((rsvp) => {
    const customer = customers.find((c) => c.id === rsvp.customerId);
    if (!customer) return null;
    return {
      ...customer,
      rsvpStatus: rsvp.status || "未回答",
      attendanceType: rsvp.attendanceType,
      afterPartyStatus: rsvp.afterPartyStatus,
      respondedAt: rsvp.respondedAt || "-",
      comment: rsvp.comment || "",
    };
  }).filter((a): a is NonNullable<typeof a> => a !== null);

  // 検索とフィルタで絞り込んだ参加者リスト
  const attendees = useMemo(() => {
    return allAttendees.filter((attendee) => {
      // フリーワード検索（氏名、会社名）
      const matchesKeyword =
        searchKeyword === "" ||
        attendee.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        attendee.company?.toLowerCase().includes(searchKeyword.toLowerCase());

      // ステータスフィルタ（チェックがない場合はすべて表示）
      const matchesStatus =
        selectedStatuses.length === 0 ||
        selectedStatuses.some((selectedStatus) => {
          if (selectedStatus === "現地参加") {
            return attendee.rsvpStatus === "参加" && attendee.attendanceType !== "オンライン参加";
          } else if (selectedStatus === "オンライン参加") {
            return attendee.rsvpStatus === "オンライン参加" || (attendee.rsvpStatus === "参加" && attendee.attendanceType === "オンライン参加");
          } else {
            return attendee.rsvpStatus === selectedStatus;
          }
        });

      return matchesKeyword && matchesStatus;
    });
  }, [allAttendees, searchKeyword, selectedStatuses]);

  // 集計サマリを計算（フィルタ前の全データから）
  const onsiteCount = allAttendees.filter((a) => 
    a.rsvpStatus === "参加" && (a.attendanceType === "通常参加" || !a.attendanceType || a.attendanceType === undefined)
  ).length;
  const onlineCount = allAttendees.filter((a) => 
    a.rsvpStatus === "オンライン参加" || (a.rsvpStatus === "参加" && a.attendanceType === "オンライン参加")
  ).length;
  const declineCount = allAttendees.filter((a) => a.rsvpStatus === "不参加").length;
  const afterPartyCount = allAttendees.filter((a) => a.afterPartyStatus === "参加").length;
  const noResponseCount = allAttendees.filter((a) => a.rsvpStatus === "未回答").length;

  // 未回答者リスト
  const noResponseAttendees = allAttendees.filter((a) => a.rsvpStatus === "未回答");

  // アンケート結果のデータ（ベンチャー監査役の会の場合のみ）
  const surveyResults = useMemo(() => {
    if (!survey || ((event as any).eventType || "ベンチャー監査役の会") !== "ベンチャー監査役の会") {
      return null;
    }
    const responses = getSurveyResponses(survey.id);
    const fixedResponses = getFixedSurveyResponses(survey.id);
    const respondedCustomerIds = new Set(responses.map((r) => r.customerId));
    const respondedCustomers = Array.from(respondedCustomerIds).map((customerId) => {
      const customer = customers.find((c) => c.id === customerId);
      const customerResponses = responses.filter((r) => r.customerId === customerId);
      const customerFixedResponse = fixedResponses.find((fr) => fr.customerId === customerId);
      const respondedAt = customerResponses[0]?.respondedAt || customerFixedResponse?.respondedAt;
      return { customer, responses: customerResponses, fixedResponse: customerFixedResponse, respondedAt };
    }).filter((item) => item.customer !== undefined);

    // 集計データ
    const summary = survey.questions.map((question: any) => {
      const questionResponses = responses.filter((r) => r.questionId === question.id);
      const ratingCounts = {
        よかった: questionResponses.filter((r) => r.rating === "よかった").length,
        まぁよかった: questionResponses.filter((r) => r.rating === "まぁよかった").length,
        あまりよくなかった: questionResponses.filter((r) => r.rating === "あまりよくなかった").length,
        よくなかった: questionResponses.filter((r) => r.rating === "よくなかった").length,
      };
      return { question, ratingCounts, total: questionResponses.length };
    });

    return { responses, fixedResponses, respondedCustomers, summary };
  }, [survey, event]);

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setSelectedStatuses([...selectedStatuses, status]);
    } else {
      setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                {(event as any).eventType || "ベンチャー監査役の会"}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="cursor-pointer">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white">
            <DropdownMenuItem asChild className="bg-white hover:bg-gray-100 cursor-pointer">
              <Link href={`/admin/events/${id}/edit`} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                編集
              </Link>
            </DropdownMenuItem>
            {eventStatus === "open" && (
              <DropdownMenuItem asChild className="bg-white hover:bg-gray-100 cursor-pointer">
                <Link href={`/admin/events/${id}/invite`} className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  案内
                </Link>
              </DropdownMenuItem>
            )}
            {eventStatus === "open" && noResponseAttendees.length > 0 && (
              <DropdownMenuItem asChild className="bg-white hover:bg-gray-100 cursor-pointer">
                <Link href={`/admin/events/${id}/remind`} className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  未回答者に再送 ({noResponseAttendees.length}名)
                </Link>
              </DropdownMenuItem>
            )}
            {((event as any).eventType || "ベンチャー監査役の会") === "ベンチャー監査役の会" && (
              <DropdownMenuItem asChild className="bg-white hover:bg-gray-100 cursor-pointer">
                <Link href={`/admin/events/${id}/survey/create`} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  アンケート管理
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="bg-white hover:bg-gray-100 cursor-pointer"
              onClick={() =>
                setIsPaused((prev) => {
                  const next = !prev;
                  toast.success(next ? "イベント受付を一時停止しました" : "イベント受付を再開しました");
                  return next;
                })
              }
            >
              <div className="flex items-center gap-2">
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4" />
                    再開
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" />
                    一時停止
                  </>
                )}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-5 space-y-6">
            <Tabs value={tab} onValueChange={(value) => {
              // タブ変更時にURLを更新
              const newUrl = value === "attendees" 
                ? `/admin/events/${id}` 
                : `/admin/events/${id}?tab=${value}`;
              router.push(newUrl);
            }}>
                <TabsList>
                    <TabsTrigger value="attendees" className="cursor-pointer">参加状況</TabsTrigger>
                    <TabsTrigger value="detail" className="cursor-pointer">詳細</TabsTrigger>
                    {((event as any).eventType || "ベンチャー監査役の会") === "ベンチャー監査役の会" && (
                      <TabsTrigger value="survey" className="cursor-pointer">アンケート結果</TabsTrigger>
                    )}
                </TabsList>
                
                <TabsContent value="attendees" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>参加者リスト</CardTitle>
                            <CardDescription>現在の回答状況です。</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="氏名、会社名で検索..."
                                        className="pl-9 h-10"
                                        value={searchKeyword}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                    />
                                </div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-[200px] justify-between h-10"
                                        >
                                            <span className="text-sm">
                                                {selectedStatuses.length === 0
                                                    ? "受付ステータス"
                                                    : selectedStatuses.length === 1
                                                    ? selectedStatuses[0]
                                                    : `${selectedStatuses.length}件選択`}
                                            </span>
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[280px] p-0 bg-white" align="start">
                                        <div className="p-3 border-b">
                                            <div className="relative">
                                                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    placeholder="ステータスを検索"
                                                    value={statusSearch}
                                                    onChange={(e) => setStatusSearch(e.target.value)}
                                                    className="pl-8 h-9"
                                                />
                                            </div>
                                        </div>
                                        <div className="p-2 max-h-[300px] overflow-y-auto">
                                            {RSVP_STATUSES
                                                .filter((status) =>
                                                    status.label
                                                        .toLowerCase()
                                                        .includes(statusSearch.toLowerCase())
                                                )
                                                .map((status) => (
                                                    <div
                                                        key={status.value}
                                                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                                                        onClick={() =>
                                                            handleStatusChange(
                                                                status.value,
                                                                !selectedStatuses.includes(status.value)
                                                            )
                                                        }
                                                    >
                                                        <Checkbox
                                                            checked={selectedStatuses.includes(status.value)}
                                                            onCheckedChange={(checked) =>
                                                                handleStatusChange(status.value, checked === true)
                                                            }
                                                        />
                                                        <span className="text-sm cursor-pointer">{status.label}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>氏名</TableHead>
                                        <TableHead>会社名</TableHead>
                                        <TableHead>ステータス</TableHead>
                                        <TableHead>回答日時</TableHead>
                                        <TableHead>メッセージ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendees.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                検索条件に一致する参加者が見つかりませんでした。
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        attendees.map((attendee) => (
                                            <TableRow key={attendee.id}>
                                                <TableCell>{attendee.name}</TableCell>
                                                <TableCell>{attendee.company}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <Badge 
                                                            variant={
                                                                attendee.rsvpStatus === "参加" || attendee.rsvpStatus === "オンライン参加" ? "default" : 
                                                                attendee.rsvpStatus === "不参加" ? "destructive" : "secondary"
                                                            }
                                                            className={cn(
                                                                attendee.rsvpStatus === "未回答" && "bg-gray-100 text-gray-600 hover:bg-gray-200",
                                                                attendee.rsvpStatus === "不参加" && "text-foreground",
                                                                (attendee.rsvpStatus === "オンライン参加" || attendee.attendanceType === "オンライン参加") && "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                                            )}
                                                        >
                                                            {attendee.rsvpStatus === "オンライン参加" 
                                                                ? "オンライン参加"
                                                                : attendee.rsvpStatus === "参加" && attendee.attendanceType === "オンライン参加"
                                                                ? "オンライン参加"
                                                                : attendee.rsvpStatus}
                                                        </Badge>
                                                        {attendee.rsvpStatus === "参加" && attendee.attendanceType === "通常参加" && attendee.afterPartyStatus && (
                                                            <Badge variant="outline" className="text-xs">
                                                                懇親会: {attendee.afterPartyStatus}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{attendee.respondedAt === "-" ? "-" : formatDateTime(attendee.respondedAt)}</TableCell>
                                                <TableCell className="max-w-xs">
                                                    {attendee.comment ? (
                                                        <div className="text-sm text-muted-foreground truncate" title={attendee.comment}>
                                                            {attendee.comment}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="detail" className="space-y-4">
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">イベント種別</Label>
                                    <div className="mt-1 text-base">{(event as any).eventType || "ベンチャー監査役の会"}</div>
                                </div>
                                
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">開催日時</Label>
                                    <div className="mt-1 text-base">{formatEventDate(event.date)}</div>
                                </div>
                                
                                {event.location && (
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">場所</Label>
                                        <div className="mt-1 text-base whitespace-pre-wrap">{event.location}</div>
                                    </div>
                                )}
                                
                                {event.description && (
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">イベント概要</Label>
                                        <div className="mt-1 text-base whitespace-pre-wrap">{event.description}</div>
                                    </div>
                                )}
                                
                                {event.responseDeadline && (
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">回答期限</Label>
                                        <div className="mt-1 text-base">{formatEventDate(event.responseDeadline)}</div>
                                    </div>
                                )}
                                
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">オンライン参加</Label>
                                    <div className="mt-1 text-base">
                                        {event.allowsOnline ? "可能" : "不可"}
                                    </div>
                                </div>
                                
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">懇親会</Label>
                                    <div className="mt-1 text-base">
                                        {event.hasAfterParty ? "あり" : "なし"}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {((event as any).eventType || "ベンチャー監査役の会") === "ベンチャー監査役の会" && (
                  <TabsContent value="survey" className="space-y-4">
                    {survey && surveyResults && surveyResults.respondedCustomers.length > 0 ? (
                      <>
                        <Card>
                          <CardHeader>
                            <CardTitle>集計</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {surveyResults.summary.map((item) => (
                              <div key={item.question.id} className="space-y-2">
                                <div className="font-medium">
                                  {item.question.title}
                                </div>
                                <div className="grid grid-cols-4 gap-4 text-sm">
                                  <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{item.ratingCounts.よかった}</div>
                                    <div className="text-xs text-green-800">よかった</div>
                                  </div>
                                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">{item.ratingCounts.まぁよかった}</div>
                                    <div className="text-xs text-blue-800">まぁよかった</div>
                                  </div>
                                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                    <div className="text-2xl font-bold text-yellow-600">{item.ratingCounts.あまりよくなかった}</div>
                                    <div className="text-xs text-yellow-800">あまりよくなかった</div>
                                  </div>
                                  <div className="text-center p-3 bg-red-50 rounded-lg">
                                    <div className="text-2xl font-bold text-red-600">{item.ratingCounts.よくなかった}</div>
                                    <div className="text-xs text-red-800">よくなかった</div>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* 固定設問: 懇親会 */}
                            {event.hasAfterParty && (
                              <div className="space-y-2 pt-4 border-t">
                                <div className="font-medium">懇親会</div>
                                {(() => {
                                  const afterPartyResponses = surveyResults.fixedResponses.filter((fr) => fr.afterParty);
                                  const ratingCounts = {
                                    よかった: afterPartyResponses.filter((fr) => fr.afterParty?.rating === "よかった").length,
                                    まぁよかった: afterPartyResponses.filter((fr) => fr.afterParty?.rating === "まぁよかった").length,
                                    あまりよくなかった: afterPartyResponses.filter((fr) => fr.afterParty?.rating === "あまりよくなかった").length,
                                    よくなかった: afterPartyResponses.filter((fr) => fr.afterParty?.rating === "よくなかった").length,
                                  };
                                  return (
                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                      <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{ratingCounts.よかった}</div>
                                        <div className="text-xs text-green-800">よかった</div>
                                      </div>
                                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">{ratingCounts.まぁよかった}</div>
                                        <div className="text-xs text-blue-800">まぁよかった</div>
                                      </div>
                                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                        <div className="text-2xl font-bold text-yellow-600">{ratingCounts.あまりよくなかった}</div>
                                        <div className="text-xs text-yellow-800">あまりよくなかった</div>
                                      </div>
                                      <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <div className="text-2xl font-bold text-red-600">{ratingCounts.よくなかった}</div>
                                        <div className="text-xs text-red-800">よくなかった</div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {/* 固定設問: 今後の参加について（非会員のみ） */}
                            {surveyResults.respondedCustomers.some((item) => item.customer!.communities.length === 0) && (
                              <div className="space-y-2 pt-4 border-t">
                                <div className="font-medium">今後の参加について</div>
                                {(() => {
                                  const futureResponses = surveyResults.fixedResponses.filter((fr) => {
                                    const customer = customers.find((c) => c.id === fr.customerId);
                                    return customer && customer.communities.length === 0 && fr.futureParticipation;
                                  });
                                  const ratingCounts = {
                                    ぜひ参加したい: futureResponses.filter((fr) => fr.futureParticipation?.rating === "ぜひ参加したい").length,
                                    参加を検討したい: futureResponses.filter((fr) => fr.futureParticipation?.rating === "参加を検討したい").length,
                                    参加しない: futureResponses.filter((fr) => fr.futureParticipation?.rating === "参加しない").length,
                                  };
                                  return (
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                      <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{ratingCounts.ぜひ参加したい}</div>
                                        <div className="text-xs text-green-800">ぜひ参加したい</div>
                                      </div>
                                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">{ratingCounts.参加を検討したい}</div>
                                        <div className="text-xs text-blue-800">参加を検討したい</div>
                                      </div>
                                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                        <div className="text-2xl font-bold text-yellow-600">{ratingCounts.参加しない}</div>
                                        <div className="text-xs text-yellow-800">参加しない</div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {/* 固定設問: ベンチャー監査役の会への入会について */}
                            {surveyResults.respondedCustomers.some((item) => item.customer!.communities.length === 0) && (
                              <div className="space-y-2 pt-4 border-t">
                                <div className="font-medium">ベンチャー監査役の会への入会について</div>
                                {(() => {
                                  const membershipResponses = surveyResults.fixedResponses.filter((fr) => {
                                    const customer = customers.find((c) => c.id === fr.customerId);
                                    return customer && customer.communities.length === 0 && fr.membership;
                                  });
                                  const ratingCounts = {
                                    入会をしたい: membershipResponses.filter((fr) => fr.membership?.rating === "入会をしたい").length,
                                    入会を検討したい: membershipResponses.filter((fr) => fr.membership?.rating === "入会を検討したい").length,
                                    関心がない: membershipResponses.filter((fr) => fr.membership?.rating === "関心がない").length,
                                  };
                                  return (
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                      <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{ratingCounts.入会をしたい}</div>
                                        <div className="text-xs text-green-800">入会をしたい</div>
                                      </div>
                                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">{ratingCounts.入会を検討したい}</div>
                                        <div className="text-xs text-blue-800">入会を検討したい</div>
                                      </div>
                                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                        <div className="text-2xl font-bold text-yellow-600">{ratingCounts.関心がない}</div>
                                        <div className="text-xs text-yellow-800">関心がない</div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>回答一覧</CardTitle>
                            <CardDescription>
                              回答者: {surveyResults.respondedCustomers.length}名
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="sticky left-0 z-10 bg-white">回答者</TableHead>
                                    <TableHead>会社名</TableHead>
                                    {survey?.questions
                                      .sort((a: any, b: any) => a.order - b.order)
                                      .map((q: any) => (
                                        <TableHead key={q.id}>{q.title}</TableHead>
                                      ))}
                                    {event.hasAfterParty && <TableHead>懇親会</TableHead>}
                                    {surveyResults.respondedCustomers.some((item) => item.customer!.communities.length === 0) && (
                                      <>
                                        <TableHead>今後の参加について</TableHead>
                                        <TableHead>ベンチャー監査役の会への入会について</TableHead>
                                      </>
                                    )}
                                    <TableHead>ご意見・ご提案・感想等</TableHead>
                                    <TableHead>回答日時</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {surveyResults.respondedCustomers.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={(survey?.questions.length || 0) + (event.hasAfterParty ? 1 : 0) + (surveyResults.respondedCustomers.some((item) => item.customer!.communities.length === 0) ? 2 : 0) + 4} className="text-center text-muted-foreground">
                                        まだ回答がありません
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    surveyResults.respondedCustomers.map((item) => (
                                      <TableRow key={item.customer!.id}>
                                        <TableCell className="sticky left-0 z-10 bg-white font-medium">{item.customer!.name}</TableCell>
                                        <TableCell>{item.customer!.company}</TableCell>
                                        {survey?.questions
                                          .sort((a: any, b: any) => a.order - b.order)
                                          .map((q: any) => {
                                            const response = item.responses.find((r) => r.questionId === q.id);
                                            return (
                                              <TableCell key={q.id}>
                                                {response ? (
                                                  <div className="space-y-1">
                                                    <Badge
                                                      variant={
                                                        response.rating === "よかった"
                                                          ? "default"
                                                          : response.rating === "まぁよかった"
                                                          ? "secondary"
                                                          : response.rating === "あまりよくなかった"
                                                          ? "outline"
                                                          : "destructive"
                                                      }
                                                    >
                                                      {response.rating}
                                                    </Badge>
                                                    {response.reason && (
                                                      <div className="text-xs text-muted-foreground max-w-xs truncate">
                                                        {response.reason}
                                                      </div>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <span className="text-muted-foreground">-</span>
                                                )}
                                              </TableCell>
                                            );
                                          })}
                                        {event.hasAfterParty && (
                                          <TableCell>
                                            {item.fixedResponse?.afterParty ? (
                                              <div className="space-y-1">
                                                <Badge
                                                  variant={
                                                    item.fixedResponse.afterParty.rating === "よかった"
                                                      ? "default"
                                                      : item.fixedResponse.afterParty.rating === "まぁよかった"
                                                      ? "secondary"
                                                      : item.fixedResponse.afterParty.rating === "あまりよくなかった"
                                                      ? "outline"
                                                      : "destructive"
                                                  }
                                                >
                                                  {item.fixedResponse.afterParty.rating}
                                                </Badge>
                                                {item.fixedResponse.afterParty.reason && (
                                                  <div className="text-xs text-muted-foreground max-w-xs truncate">
                                                    {item.fixedResponse.afterParty.reason}
                                                  </div>
                                                )}
                                              </div>
                                            ) : (
                                              <span className="text-muted-foreground">-</span>
                                            )}
                                          </TableCell>
                                        )}
                                        {surveyResults.respondedCustomers.some((i) => i.customer!.communities.length === 0) && (
                                          <>
                                            <TableCell>
                                              {item.customer!.communities.length === 0 && item.fixedResponse?.futureParticipation ? (
                                                <div className="space-y-1">
                                                  <Badge variant="secondary">
                                                    {item.fixedResponse.futureParticipation.rating}
                                                  </Badge>
                                                  {item.fixedResponse.futureParticipation.reason && (
                                                    <div className="text-xs text-muted-foreground max-w-xs truncate">
                                                      {item.fixedResponse.futureParticipation.reason}
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                <span className="text-muted-foreground">-</span>
                                              )}
                                            </TableCell>
                                            <TableCell>
                                              {item.customer!.communities.length === 0 && item.fixedResponse?.membership ? (
                                                <div className="space-y-1">
                                                  <Badge variant="secondary">
                                                    {item.fixedResponse.membership.rating}
                                                  </Badge>
                                                  {item.fixedResponse.membership.reason && (
                                                    <div className="text-xs text-muted-foreground max-w-xs truncate">
                                                      {item.fixedResponse.membership.reason}
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                <span className="text-muted-foreground">-</span>
                                              )}
                                            </TableCell>
                                          </>
                                        )}
                                        <TableCell>
                                          {item.fixedResponse?.comments ? (
                                            <div className="text-xs text-muted-foreground max-w-xs truncate">
                                              {item.fixedResponse.comments}
                                            </div>
                                          ) : (
                                            <span className="text-muted-foreground">-</span>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                          {item.respondedAt ? formatDateTime(item.respondedAt) : "-"}
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center space-y-4">
                            <p className="text-muted-foreground">
                              アンケート結果が存在しません。
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <Link href={`/admin/events/${id}/survey/create`} className="text-primary hover:underline">
                                アンケート管理画面
                              </Link>
                              からアンケート管理及び送付を行ってください。
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                )}
            </Tabs>
        </div>

        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>集計サマリ</CardTitle>
                        <Badge
                            variant={
                                eventStatus === "open"
                                    ? "default"
                                    : eventStatus === "closed"
                                    ? "outline"
                                    : "secondary"
                            }
                        >
                            {eventStatus === "open"
                                ? isPaused
                                    ? "受付中(一時停止)"
                                    : "受付中"
                                : eventStatus === "waiting"
                                ? "受付終了"
                                : "終了"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{onsiteCount}</div>
                            <div className="text-xs text-green-800">現地参加</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{declineCount}</div>
                            <div className="text-xs text-red-800">不参加</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{onlineCount}</div>
                            <div className="text-xs text-blue-800">オンライン参加</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{afterPartyCount}</div>
                            <div className="text-xs text-purple-800">懇親会参加</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg col-span-2">
                            <div className="text-2xl font-bold text-gray-600">{noResponseCount}</div>
                            <div className="text-xs text-gray-800">未回答</div>
                        </div>
                    </div>
                    {event.responseDeadline && (
                        <div className="pt-4 border-t">
                            <div className="text-sm text-muted-foreground">回答受付期限</div>
                            <div className="text-sm font-medium">{formatEventDate(event.responseDeadline)}</div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="text-sm space-y-2">
              <div>
                <Link
                  href={`/events/${id}/rsvp?token=demo-token`}
                  target="_blank"
                  className="text-muted-foreground hover:text-foreground underline"
                >
                  参加回答フォーム (サンプル)
                </Link>
              </div>
              {event.eventType === "ベンチャー監査役の会" && (
                <>
                  <div>
                    <Link
                      href={`/events/${id}/survey/demo-token`}
                      target="_blank"
                      className="text-muted-foreground hover:text-foreground underline"
                    >
                      アンケート回答フォーム (会員向けサンプル)
                    </Link>
                  </div>
                  <div>
                    <Link
                      href={`/events/${id}/survey/demo-token-nonmember`}
                      target="_blank"
                      className="text-muted-foreground hover:text-foreground underline"
                    >
                      アンケート回答フォーム (非会員向けサンプル)
                    </Link>
                  </div>
                </>
              )}
            </div>

        </div>
      </div>

    </div>
  );
}
