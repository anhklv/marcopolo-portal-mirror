"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PageHeader } from "@/components/ui/page-header";
import { DataItem } from "@/components/ui/data-item";
import { SectionHeading } from "@/components/ui/section-heading";
import { Stack } from "@/components/ui/stack";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Mail,
  Edit,
  MoreVertical,
  Pause,
  Play,
  Search,
  ChevronDown,
  Trash2,
} from "lucide-react";
import {
  RSVP_STATUS_CONFIG,
  RSVP_STATUSES,
  EVENT_STATUS_CONFIG,
  AFTER_PARTY_STATUS_CONFIG,
} from "@/lib/constants/event";
import { getCommunityBadgeVariant } from "@/lib/constants/community";
import { formatEventDate, formatDateTime, getEventDisplayStatus } from "@/lib/utils/event";
import {
  toAttendeeRows,
  filterAttendees,
  computeEventSummary,
} from "@/lib/helpers/event-detail";
import { deleteEventAction, togglePauseEventAction } from "@/lib/actions/event.actions";
import type { RsvpStatus, AfterPartyStatus } from "@/lib/generated/prisma";
import type { SerializedEventDetail } from "@/lib/types/serialized";

// ============================================================
// 型定義
// ============================================================

interface EventDetailProps {
  event: SerializedEventDetail;
}

// ============================================================
// コンポーネント
// ============================================================

export function EventDetail({ event }: EventDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const tab = searchParams.get("tab") || "attendees";
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<RsvpStatus[]>([]);
  const [statusSearch, setStatusSearch] = useState("");
  const [localIsPaused, setLocalIsPaused] = useState(event.isPaused);

  // 参加者データ
  const allRows = useMemo(() => toAttendeeRows(event.rsvps), [event.rsvps]);
  const filteredRows = useMemo(
    () => filterAttendees(allRows, searchKeyword, selectedStatuses),
    [allRows, searchKeyword, selectedStatuses]
  );
  const summary = useMemo(() => computeEventSummary(allRows), [allRows]);

  // イベントステータス（localIsPausedを反映）
  const eventStatus = getEventDisplayStatus({
    date: event.date,
    responseDeadline: event.responseDeadline,
    isPaused: localIsPaused,
  });
  const statusConfig = EVENT_STATUS_CONFIG[eventStatus];
  const isReceiving = eventStatus === "receiving";

  const handleStatusChange = (status: RsvpStatus, checked: boolean) => {
    if (checked) {
      setSelectedStatuses([...selectedStatuses, status]);
    } else {
      setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
    }
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteEventAction(event.id);
        if (result && !result.success) {
          toast.error(result.error);
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
          return;
        }
        toast.error("削除に失敗しました");
      }
    });
  };

  const handleTogglePause = () => {
    startTransition(async () => {
      try {
        const result = await togglePauseEventAction(event.id);
        if (result.success) {
          setLocalIsPaused(result.isPaused);
          toast.success(
            result.isPaused
              ? "イベント受付を一時停止しました"
              : "イベント受付を再開しました"
          );
          router.refresh();
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("ステータスの変更に失敗しました");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <PageHeader backHref="/admin/events" title={event.title} />
          <Badge variant={getCommunityBadgeVariant(event.community.code)}>
            {event.community.name}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card">
            <DropdownMenuItem asChild className="bg-card hover:bg-accent">
              <Link
                href={`/admin/events/${event.id}/edit`}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                編集
              </Link>
            </DropdownMenuItem>
            {isReceiving && (
              <DropdownMenuItem asChild className="bg-card hover:bg-accent">
                <Link
                  href={`/admin/events/${event.id}/invite`}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  案内
                </Link>
              </DropdownMenuItem>
            )}
            {(isReceiving || eventStatus === "paused") && (
              <DropdownMenuItem
                className="bg-card hover:bg-accent"
                onClick={handleTogglePause}
                disabled={isPending}
              >
                <div className="flex items-center gap-2">
                  {localIsPaused ? (
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
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 2カラムレイアウト */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* 左カラム: タブ */}
        <div className="md:col-span-5 space-y-6">
          <Tabs value={tab} onValueChange={(value) => {
            const newUrl = value === "attendees"
              ? `/admin/events/${event.id}`
              : `/admin/events/${event.id}?tab=${value}`;
            router.push(newUrl);
          }}>
            <TabsList
              variant="line"
              className="w-full justify-start gap-0 border-b border-border px-0"
            >
              <TabsTrigger
                value="attendees"
                className="px-4 py-2.5 text-sm font-medium"
              >
                参加状況
              </TabsTrigger>
              <TabsTrigger
                value="detail"
                className="px-4 py-2.5 text-sm font-medium"
              >
                詳細
              </TabsTrigger>
            </TabsList>

            {/* 参加状況タブ */}
            <TabsContent value="attendees" className="space-y-4">
              <Card className="border-0">
                <CardContent className="space-y-4 pt-6">
                  {/* 検索・フィルタ */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="氏名、会社名で検索..."
                        className="pl-9 h-9 text-sm"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                      />
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[200px] justify-between h-9"
                        >
                          <span className="text-sm">
                            {selectedStatuses.length === 0
                              ? "受付ステータス"
                              : selectedStatuses.length === 1
                                ? RSVP_STATUS_CONFIG[selectedStatuses[0]].label
                                : `${selectedStatuses.length}件選択`}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[280px] p-0 bg-card"
                        align="start"
                      >
                        <div className="p-3 border-b">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="ステータスを検索"
                              value={statusSearch}
                              onChange={(e) => setStatusSearch(e.target.value)}
                              className="pl-8 h-9 text-sm"
                            />
                          </div>
                        </div>
                        <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
                          {RSVP_STATUSES.filter((status) =>
                            status.label
                              .toLowerCase()
                              .includes(statusSearch.toLowerCase())
                          ).map((status) => (
                            <CheckboxItem
                              key={status.value}
                              id={`rsvp-status-${status.value}`}
                              label={status.label}
                              checked={selectedStatuses.includes(status.value)}
                              onCheckedChange={(checked) =>
                                handleStatusChange(status.value, checked)
                              }
                            />
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* 参加者テーブル */}
                  <div className="rounded-lg bg-card">
                    <Table className="[&_th]:py-4 [&_td]:py-4">
                      <TableHeader>
                        <TableRow>
                          <TableHead>氏名</TableHead>
                          <TableHead>会社名</TableHead>
                          <TableHead>ステータス</TableHead>
                          {event.hasAfterParty && (
                            <TableHead>懇親会</TableHead>
                          )}
                          <TableHead>回答日時</TableHead>
                          <TableHead>メッセージ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRows.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={event.hasAfterParty ? 6 : 5}
                              className="text-center text-muted-foreground"
                            >
                              {allRows.length === 0
                                ? "参加者がいません。"
                                : "検索条件に一致する参加者が見つかりませんでした。"}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredRows.map((row) => {
                            const statusConf =
                              RSVP_STATUS_CONFIG[
                                row.status as RsvpStatus
                              ];
                            return (
                              <TableRow key={row.rsvpId}>
                                <TableCell>
                                  <Link
                                    href={`/admin/customers/${row.customerId}`}
                                    className="hover:underline"
                                  >
                                    {row.lastName} {row.firstName}
                                  </Link>
                                </TableCell>
                                <TableCell>{row.company ?? "-"}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      statusConf?.variant ?? "outline"
                                    }
                                  >
                                    {statusConf?.label ?? row.status}
                                  </Badge>
                                </TableCell>
                                {event.hasAfterParty && (
                                  <TableCell>
                                    {row.afterPartyStatus ? (
                                      <Badge variant="outline">
                                        {AFTER_PARTY_STATUS_CONFIG[
                                          row.afterPartyStatus as AfterPartyStatus
                                        ]?.label ?? row.afterPartyStatus}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        -
                                      </span>
                                    )}
                                  </TableCell>
                                )}
                                <TableCell>
                                  {row.respondedAt
                                    ? formatDateTime(row.respondedAt)
                                    : "-"}
                                </TableCell>
                                <TableCell className="whitespace-normal max-w-md">
                                  {row.comment ? (
                                    <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                                      {row.comment}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      -
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 詳細タブ */}
            <TabsContent value="detail" className="space-y-4">
              <Card className="border-0">
                <CardContent>
                  <Stack gap="lg">
                    <SectionHeading>イベント情報</SectionHeading>
                    <div className="grid grid-cols-2 gap-6">
                      <DataItem label="イベント種別">
                        <Badge
                          variant={getCommunityBadgeVariant(
                            event.community.code
                          )}
                        >
                          {event.community.name}
                        </Badge>
                      </DataItem>
                      <DataItem label="開催日時">
                        {formatEventDate(event.date)}
                      </DataItem>
                      {event.location && (
                        <DataItem label="場所">
                          <span className="whitespace-pre-wrap">
                            {event.location}
                          </span>
                        </DataItem>
                      )}
                      {event.responseDeadline && (
                        <DataItem label="回答期限">
                          {formatEventDate(event.responseDeadline)}
                        </DataItem>
                      )}
                      <DataItem label="オンライン参加">
                        {event.allowsOnline ? "可能" : "不可"}
                      </DataItem>
                      <DataItem label="懇親会">
                        {event.hasAfterParty ? "あり" : "なし"}
                      </DataItem>
                    </div>
                    {event.description && (
                      <>
                        <SectionHeading>イベント概要</SectionHeading>
                        <div className="text-base whitespace-pre-wrap">
                          {event.description}
                        </div>
                      </>
                    )}
                    {event.timetable && (
                      <>
                        <SectionHeading>タイムテーブル</SectionHeading>
                        <div className="text-base whitespace-pre-wrap">
                          {event.timetable}
                        </div>
                      </>
                    )}
                    {event.note && (
                      <>
                        <SectionHeading>備考</SectionHeading>
                        <div className="text-base whitespace-pre-wrap">
                          {event.note}
                        </div>
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* 削除ボタン */}
              <div className="flex justify-end pt-4 border-t">
                <Dialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-destructive text-destructive bg-white hover:bg-white hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      削除
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card">
                    <DialogHeader>
                      <DialogTitle>イベントを削除</DialogTitle>
                      <DialogDescription>
                        このイベントを削除してもよろしいですか？この操作は取り消せません。
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDeleteDialogOpen(false)}
                      >
                        キャンセル
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isPending}
                      >
                        {isPending ? "削除中..." : "削除"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* 右カラム: 集計サマリ */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>集計サマリ</CardTitle>
                <Badge variant={statusConfig.variant}>
                  {statusConfig.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg col-span-2">
                  <div className="text-2xl font-bold text-green-600">
                    {summary.onsiteCount}
                  </div>
                  <div className="text-xs text-green-800">現地参加</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {summary.onlineCount}
                  </div>
                  <div className="text-xs text-blue-800">オンライン参加</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {summary.afterPartyCount}
                  </div>
                  <div className="text-xs text-purple-800">懇親会参加</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {summary.absentCount}
                  </div>
                  <div className="text-xs text-red-800">不参加</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {summary.pendingCount}
                  </div>
                  <div className="text-xs text-gray-800">未回答</div>
                </div>
              </div>
              {event.responseDeadline && (
                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    回答受付期限
                  </div>
                  <div className="text-sm font-medium">
                    {formatEventDate(event.responseDeadline)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
