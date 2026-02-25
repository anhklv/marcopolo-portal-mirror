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
import { PageHeader } from "@/components/ui/page-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Mail,
  Edit,
  MoreVertical,
  Pause,
  Play,
  Send,
  FileText,
} from "lucide-react";
import {
  EVENT_STATUS_CONFIG,
} from "@/lib/constants/event";
import { getCommunityBadgeVariant } from "@/lib/constants/community";
import { formatEventDate, getEventDisplayStatus } from "@/lib/utils/event";
import {
  toAttendeeRows,
  computeEventSummary,
} from "@/lib/helpers/event-detail";
import { togglePauseEventAction } from "@/lib/actions/event.actions";
import type { RsvpStatus } from "@/lib/generated/prisma";
import type { SerializedEventDetail } from "@/lib/types/serialized";
import { TabAttendees } from "./tab-attendees";
import { TabDetail } from "./tab-detail";

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
  const [localIsPaused, setLocalIsPaused] = useState(event.isPaused);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<RsvpStatus[]>([]);

  // 参加者データ
  const allRows = useMemo(() => toAttendeeRows(event.rsvps), [event.rsvps]);
  const summary = useMemo(() => computeEventSummary(allRows), [allRows]);

  // イベントステータス（localIsPausedを反映）
  const eventStatus = getEventDisplayStatus({
    date: event.date,
    responseDeadline: event.responseDeadline,
    isPaused: localIsPaused,
  });
  const statusConfig = EVENT_STATUS_CONFIG[eventStatus];
  const isReceiving = eventStatus === "receiving";

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
            {isReceiving && summary.pendingCount > 0 && (
              <DropdownMenuItem asChild className="bg-card hover:bg-accent">
                <Link
                  href={`/admin/events/${event.id}/remind`}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  未回答者に再送 ({summary.pendingCount}名)
                </Link>
              </DropdownMenuItem>
            )}
            {event.community.hasSurvey && (
              <DropdownMenuItem asChild className="bg-card hover:bg-accent">
                <Link
                  href={`/admin/events/${event.id}/survey/create`}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  アンケート管理
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
              <TabAttendees
                event={event}
                allRows={allRows}
                searchKeyword={searchKeyword}
                onSearchKeywordChange={setSearchKeyword}
                selectedStatuses={selectedStatuses}
                onSelectedStatusesChange={setSelectedStatuses}
              />
            </TabsContent>

            {/* 詳細タブ */}
            <TabsContent value="detail" className="space-y-4">
              <TabDetail event={event} />
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
