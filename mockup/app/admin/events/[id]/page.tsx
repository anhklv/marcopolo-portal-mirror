"use client";

import { useState, use, useMemo } from "react";
import Link from "next/link";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Mail, UserCheck, Edit, MoreVertical, Pause, Play, FileText, Search, ChevronDown, Send } from "lucide-react";
import { events, customers, rsvps, getEventStatus } from "@/lib/data/mock";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const eventData = events.find((e) => e.id === id) || events[0];
  const event = { ...eventData, status: getEventStatus(eventData) }; // ステータスを自動判定

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [statusSearch, setStatusSearch] = useState("");
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  // このイベントのRSVPデータを取得
  const eventRsvps = rsvps.filter((r) => r.eventId === id);
  
  // 参加者リストを作成（RSVPデータと顧客データを結合）
  const allAttendees = eventRsvps.map((rsvp) => {
    const customer = customers.find((c) => c.id === rsvp.customerId);
    if (!customer) return null;
    const { status: _, ...customerWithoutStatus } = customer;
    return {
      ...customerWithoutStatus,
      rsvpStatus: rsvp.status || "未回答",
      respondedAt: rsvp.respondedAt || "-",
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
        selectedStatuses.includes(attendee.rsvpStatus);

      return matchesKeyword && matchesStatus;
    });
  }, [allAttendees, searchKeyword, selectedStatuses]);

  // 集計サマリを計算（フィルタ前の全データから）
  const attendCount = allAttendees.filter((a) => a.rsvpStatus === "参加").length;
  const declineCount = allAttendees.filter((a) => a.rsvpStatus === "不参加").length;
  const noResponseCount = allAttendees.filter((a) => a.rsvpStatus === "未回答").length;

  // 未回答者リスト
  const noResponseAttendees = allAttendees.filter((a) => a.rsvpStatus === "未回答");

  // 未回答者への再送処理
  const handleSendReminder = async () => {
    if (noResponseAttendees.length === 0) {
      toast.error("未回答者がいません");
      return;
    }

    setIsSendingReminder(true);
    
    try {
      // モック: 実際の実装ではAPIを呼び出す
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success(`未回答者${noResponseAttendees.length}名にリマインドメールを送信しました`);
      setIsReminderDialogOpen(false);
    } catch (error) {
      toast.error("メール送信に失敗しました");
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setSelectedStatuses([...selectedStatuses, status]);
    } else {
      setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
    }
  };

  const handleSearch = () => {
    // 検索処理は useMemo で自動的に実行される
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
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
              <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
              <Badge variant={
                event.status === "open" 
                  ? "default" 
                  : event.status === "closed" 
                  ? "outline" 
                  : "secondary"
              }>
                {event.status === "open"
                  ? event.isPaused
                    ? "受付中(一時停止)"
                    : "受付中"
                  : event.status === "waiting"
                  ? "開催待ち"
                  : "終了"}
              </Badge>
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
            {event.status === "open" && (
              <DropdownMenuItem asChild className="bg-white hover:bg-gray-100 cursor-pointer">
                <Link href={`/admin/events/${id}/invite`} className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  招待
                </Link>
              </DropdownMenuItem>
            )}
            {event.status === "open" && noResponseAttendees.length > 0 && (
              <DropdownMenuItem
                className="bg-white hover:bg-gray-100 cursor-pointer"
                onClick={() => setIsReminderDialogOpen(true)}
              >
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  未回答者に再送 ({noResponseAttendees.length}名)
                </div>
              </DropdownMenuItem>
            )}
            {event.status === "closed" && (
              <DropdownMenuItem asChild className="bg-white hover:bg-gray-100 cursor-pointer">
                <Link href={`/admin/events/${id}/survey`} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  アンケート送信
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="bg-white hover:bg-gray-100 cursor-pointer">
              <div className="flex items-center gap-2">
                {event.isPaused ? (
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
            <Tabs defaultValue="attendees">
                <TabsList>
                    <TabsTrigger value="attendees" className="cursor-pointer">参加状況</TabsTrigger>
                    <TabsTrigger value="detail" className="cursor-pointer">詳細</TabsTrigger>
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
                                        onKeyDown={handleKeyDown}
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
                                            {[
                                                { value: "参加", label: "参加" },
                                                { value: "不参加", label: "不参加" },
                                                { value: "未回答", label: "未回答" },
                                            ]
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
                                                        <Badge
                                                            variant={
                                                                status.value === "参加"
                                                                    ? "default"
                                                                    : status.value === "不参加"
                                                                    ? "destructive"
                                                                    : "secondary"
                                                            }
                                                            className={cn(
                                                                status.value === "未回答" && "bg-gray-100 text-gray-600 hover:bg-gray-200",
                                                                status.value === "不参加" && "text-foreground",
                                                                "cursor-pointer"
                                                            )}
                                                        >
                                                            {status.label}
                                                        </Badge>
                                                    </div>
                                                ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                <Button variant="outline" onClick={handleSearch} className="h-10 cursor-pointer">
                                    <Search className="h-4 w-4" />
                                    検索
                                </Button>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>氏名</TableHead>
                                        <TableHead>会社名</TableHead>
                                        <TableHead>ステータス</TableHead>
                                        <TableHead>回答日時</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendees.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                検索条件に一致する参加者が見つかりませんでした。
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        attendees.map((attendee) => (
                                            <TableRow key={attendee.id}>
                                                <TableCell>{attendee.name}</TableCell>
                                                <TableCell>{attendee.company}</TableCell>
                                                <TableCell>
                                                    <Badge 
                                                        variant={
                                                            attendee.rsvpStatus === "参加" ? "default" : 
                                                            attendee.rsvpStatus === "不参加" ? "destructive" : "secondary"
                                                        }
                                                        className={cn(
                                                            attendee.rsvpStatus === "未回答" && "bg-gray-100 text-gray-600 hover:bg-gray-200",
                                                            attendee.rsvpStatus === "不参加" && "text-foreground"
                                                        )}
                                                    >
                                                        {attendee.rsvpStatus}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{attendee.respondedAt === "-" ? "-" : attendee.respondedAt}</TableCell>
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
                                    <Label className="text-sm font-medium text-muted-foreground">開催日時</Label>
                                    <div className="mt-1 text-base">{event.date}</div>
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
                                        <div className="mt-1 text-base">{event.responseDeadline}</div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>

        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>集計サマリ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{attendCount}</div>
                            <div className="text-xs text-green-800">参加</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{declineCount}</div>
                            <div className="text-xs text-red-800">不参加</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg col-span-2">
                            <div className="text-2xl font-bold text-gray-600">{noResponseCount}</div>
                            <div className="text-xs text-gray-800">未回答</div>
                        </div>
                    </div>
                    {event.responseDeadline && (
                        <div className="pt-4 border-t">
                            <div className="text-sm text-muted-foreground">回答受付期限</div>
                            <div className="text-sm font-medium">{event.responseDeadline}</div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="text-sm">
              <Link
                href={`/events/${id}/rsvp?token=demo-token`}
                target="_blank"
                className="text-muted-foreground hover:text-foreground underline"
              >
                参加回答フォーム (サンプル)
              </Link>
            </div>

        </div>
      </div>

      {/* 未回答者への再送確認ダイアログ */}
      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>未回答者への再送</DialogTitle>
            <DialogDescription>
              未回答者{noResponseAttendees.length}名にリマインドメールを送信しますか？
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="text-sm text-muted-foreground mb-2">送信対象:</div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {noResponseAttendees.map((attendee) => (
                <div key={attendee.id} className="text-sm">
                  {attendee.name} ({attendee.email})
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReminderDialogOpen(false)}
              disabled={isSendingReminder}
            >
              キャンセル
            </Button>
            <Button
              variant="outline"
              onClick={handleSendReminder}
              disabled={isSendingReminder}
              className="cursor-pointer"
            >
              {isSendingReminder ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  送信中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  送信
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
