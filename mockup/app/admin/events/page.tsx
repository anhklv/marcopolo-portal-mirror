"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { events, getEventStatus, rsvps, customers } from "@/lib/data/mock";
import { formatEventDate } from "@/lib/utils";
import { Plus, MoreVertical, Edit, Mail, Search, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/contexts/auth.context";
import type { CommunityScope } from "@/lib/types";

export default function EventsPage() {
  const router = useRouter();
  const { currentAdmin } = useAuth();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [statusSearch, setStatusSearch] = useState("");
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [eventTypeSearch, setEventTypeSearch] = useState("");


  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setStatuses([...statuses, status]);
    } else {
      setStatuses(statuses.filter((s) => s !== status));
    }
  };

  const handleEventTypeChange = (eventType: string, checked: boolean) => {
    if (checked) {
      setEventTypes([...eventTypes, eventType]);
    } else {
      setEventTypes(eventTypes.filter((t) => t !== eventType));
    }
  };

  const filteredEvents = useMemo(() => {
    let enriched = events.map((event) => {
      // 実際の参加者数を計算（イベント詳細画面と同じロジック）
      // 顧客が存在するRSVPのみをカウント
      const eventRsvps = rsvps.filter((r) => r.eventId === event.id);
      const allAttendees = eventRsvps.map((rsvp) => {
        const customer = customers.find((c) => c.id === rsvp.customerId);
        return customer ? { ...rsvp, customer } : null;
      }).filter((a): a is NonNullable<typeof a> => a !== null);

      const actualAttendeesCount = allAttendees.filter(
        (a) => a.status === "参加" || a.status === "オンライン参加"
      ).length;

      return {
        ...event,
        status: getEventStatus(event),
        isPaused: event.isPaused ?? false,
        actualAttendeesCount,
      };
    });

    // 管理者権限に応じてフィルタリング
    if (currentAdmin?.role === "community_admin" && currentAdmin.communityScopes) {
      enriched = enriched.filter((e) =>
        currentAdmin.communityScopes!.includes(e.eventType as CommunityScope)
      );
    }

    const filtered = enriched.filter((event) => {
      // フリーワード検索（イベント名、場所、概要、備考）
      const matchesKeyword =
        searchKeyword === "" ||
        event.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        event.location.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        event.description.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (event as any).note?.toLowerCase().includes(searchKeyword.toLowerCase());

      // ステータスフィルタ（チェックがない場合はすべて表示）
      const matchesStatus =
        statuses.length === 0 || statuses.includes(event.status);

      // イベント種別フィルタ（チェックがない場合はすべて表示）
      const matchesEventType =
        eventTypes.length === 0 || eventTypes.includes(event.eventType);

      return matchesKeyword && matchesStatus && matchesEventType;
    });

    // ステータスが終了以外で開催日時が近い順、ステータスが終了で開催日時が近い順にソート
    const sorted = [...filtered].sort((a, b) => {
      // まず、終了していないイベント（open, waiting）を先に、終了したイベント（closed）を後に
      const aIsClosed = a.status === "closed";
      const bIsClosed = b.status === "closed";
      
      if (aIsClosed !== bIsClosed) {
        return aIsClosed ? 1 : -1; // 終了していないイベントを先に
      }
      
      // 開催日時で比較（YYYY-MM-DD HH:MM形式をDateオブジェクトに変換）
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      if (aIsClosed) {
        // 終了したイベントは開催日時が近い順（最近終了した順、降順）
        return dateB - dateA;
      } else {
        // 終了していないイベントは開催日時が近い順（未来のイベントが先、昇順）
        return dateA - dateB;
      }
    });

    return sorted;
  }, [currentAdmin, searchKeyword, statuses, eventTypes]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">イベント管理</h1>
          <p className="text-muted-foreground">
            イベントの作成、編集、案内管理を行います。
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/events/new">
            <Plus className="h-4 w-4" />
            イベント作成
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="イベント名、場所、概要、備考で検索..."
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
                {eventTypes.length === 0
                  ? "イベント種別"
                  : eventTypes.length === 1
                  ? eventTypes[0]
                  : `${eventTypes.length}件選択`}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0 bg-white" align="start">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="イベント種別を検索"
                  value={eventTypeSearch}
                  onChange={(e) => setEventTypeSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <div className="p-2 max-h-[300px] overflow-y-auto">
              {[
                // 特権管理者またはベンチャー監査役の会の権限がある場合のみ表示
                ...(currentAdmin?.role === "super" || 
                  (currentAdmin?.role === "community_admin" && 
                   currentAdmin.communityScopes?.includes("ベンチャー監査役の会"))
                  ? [{ value: "ベンチャー監査役の会", label: "ベンチャー監査役の会" }]
                  : []),
                // 特権管理者またはないかんMeetupの権限がある場合のみ表示
                ...(currentAdmin?.role === "super" || 
                  (currentAdmin?.role === "community_admin" && 
                   currentAdmin.communityScopes?.includes("ないかんMeetup"))
                  ? [{ value: "ないかんMeetup", label: "ないかんMeetup" }]
                  : []),
                // 特権管理者またはAI部会の権限がある場合のみ表示
                ...(currentAdmin?.role === "super" || 
                  (currentAdmin?.role === "community_admin" && 
                   currentAdmin.communityScopes?.includes("AI部会"))
                  ? [{ value: "AI部会", label: "AI部会" }]
                  : []),
                // その他は特権管理者のみ表示
                ...(currentAdmin?.role === "super"
                  ? [{ value: "その他", label: "その他" }]
                  : []),
              ]
                .filter((eventType) =>
                  eventType.label
                    .toLowerCase()
                    .includes(eventTypeSearch.toLowerCase())
                )
                .map((eventType) => (
                  <div
                    key={eventType.value}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      handleEventTypeChange(
                        eventType.value,
                        !eventTypes.includes(eventType.value)
                      )
                    }
                  >
                    <Checkbox
                      checked={eventTypes.includes(eventType.value)}
                      onCheckedChange={(checked) =>
                        handleEventTypeChange(eventType.value, checked === true)
                      }
                    />
                    <span className="text-sm cursor-pointer">{eventType.label}</span>
                  </div>
                ))}
            </div>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[200px] justify-between h-10"
            >
              <span className="text-sm">
                {statuses.length === 0
                  ? "ステータス"
                  : statuses.length === 1
                  ? statuses[0] === "open"
                    ? "受付中"
                    : statuses[0] === "waiting"
                    ? "受付終了"
                    : "終了"
                  : `${statuses.length}件選択`}
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
                { value: "open", label: "受付中" },
                { value: "waiting", label: "受付終了" },
                { value: "closed", label: "終了" },
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
                        !statuses.includes(status.value)
                      )
                    }
                  >
                    <Checkbox
                      checked={statuses.includes(status.value)}
                      onCheckedChange={(checked) =>
                        handleStatusChange(status.value, checked === true)
                      }
                    />
                    <Badge
                      variant={
                        status.value === "open"
                          ? "default"
                          : status.value === "waiting"
                          ? "secondary"
                          : "outline"
                      }
                      className="cursor-pointer"
                    >
                      {status.label}
                    </Badge>
                  </div>
                ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex justify-end">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredEvents.length}</span>件
        </div>
      </div>
      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>イベント種別</TableHead>
              <TableHead>イベント名</TableHead>
              <TableHead>開催日時</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>参加予定数</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  検索条件に一致するイベントが見つかりませんでした。
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => (
              <TableRow
                key={event.id}
                className="cursor-pointer hover:bg-gray-50"
                tabIndex={0}
                onClick={() => {
                  router.push(`/admin/events/${event.id}`);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/admin/events/${event.id}`);
                  }
                }}
              >
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {event.eventType}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell>{formatEventDate(event.date)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      event.status === "open"
                        ? "default"
                        : event.status === "waiting"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {event.status === "open"
                      ? event.isPaused
                        ? "受付中(一時停止)"
                        : "受付中"
                      : event.status === "waiting"
                      ? "受付終了"
                      : "終了"}
                  </Badge>
                </TableCell>
                <TableCell>{event.actualAttendeesCount}名</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="cursor-pointer">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white">
                      <DropdownMenuItem asChild className="bg-white hover:bg-gray-100 cursor-pointer">
                        <Link href={`/admin/events/${event.id}/edit`} className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          編集
                        </Link>
                      </DropdownMenuItem>
                      {event.status === "open" && (
                        <DropdownMenuItem asChild className="bg-white hover:bg-gray-100 cursor-pointer">
                          <Link href={`/admin/events/${event.id}/invite`} className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            案内
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
