"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { PageHeader } from "@/components/ui/page-header";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { usePagination } from "@/hooks/use-pagination";
import { useArrayToggle } from "@/hooks/use-array-toggle";
import { formatEventDate, getEventDisplayStatus } from "@/lib/utils/event";
import {
  EVENT_STATUS_CONFIG,
  type EventDisplayStatus,
} from "@/lib/constants/event";
import { Plus, MoreVertical, Edit, Mail, Search, ChevronDown } from "lucide-react";
import type { SerializedEvent, CommunityOption } from "@/lib/types/serialized";

// ============================================================
// 型定義
// ============================================================

interface EventListProps {
  initialEvents: SerializedEvent[];
  communities: CommunityOption[];
  isSuper: boolean;
}

// イベント種別のバッジvariantを取得
function getEventTypeVariant(eventTypeName: string): "audit" | "naikan" | "ai" | "outline" {
  switch (eventTypeName) {
    case "ベンチャー監査役の会":
      return "audit";
    case "ないかんMeetup":
      return "naikan";
    case "AI部会":
      return "ai";
    default:
      return "outline";
  }
}

// ステータス表示ラベル
function getStatusLabel(status: EventDisplayStatus): string {
  return EVENT_STATUS_CONFIG[status].label;
}


// ============================================================
// コンポーネント
// ============================================================

export function EventList({
  initialEvents,
  communities,
  isSuper,
}: EventListProps) {
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statuses, toggleStatus] = useArrayToggle<EventDisplayStatus>();
  const [statusSearch, setStatusSearch] = useState("");
  const [eventTypes, toggleEventType] = useArrayToggle<string>();
  const [eventTypeSearch, setEventTypeSearch] = useState("");

  const filteredEvents = useMemo(() => {
    const enriched = initialEvents.map((event) => {
      const displayStatus = getEventDisplayStatus({
        date: event.date,
        responseDeadline: event.responseDeadline,
        isPaused: event.isPaused,
      });
      const actualAttendeesCount = event.rsvps.filter(
        (r) => r.status === "attending" || r.status === "online"
      ).length;
      return {
        ...event,
        displayStatus,
        actualAttendeesCount,
      };
    });

    const filtered = enriched.filter((event) => {
      const matchesKeyword =
        searchKeyword === "" ||
        event.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (event.location ?? "").toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (event.description ?? "").toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (event.note ?? "").toLowerCase().includes(searchKeyword.toLowerCase());

      const matchesStatus =
        statuses.length === 0 || statuses.includes(event.displayStatus);

      const matchesEventType =
        eventTypes.length === 0 ||
        eventTypes.includes(event.community.name);

      return matchesKeyword && matchesStatus && matchesEventType;
    });

    const sorted = [...filtered].sort((a, b) => {
      const aIsClosed = a.displayStatus === "closed";
      const bIsClosed = b.displayStatus === "closed";

      if (aIsClosed !== bIsClosed) {
        return aIsClosed ? 1 : -1;
      }

      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      if (aIsClosed) {
        return dateB - dateA;
      }
      return dateA - dateB;
    });

    return sorted;
  }, [initialEvents, searchKeyword, statuses, eventTypes]);

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems: paginatedEvents,
    getPageNumbers,
    itemsPerPage,
  } = usePagination(filteredEvents);

  // イベント種別フィルタに表示するコミュニティ（その他はsuperのみ）
  const filterableCommunities = useMemo(
    () =>
      communities.filter((c) => isSuper || c.code !== "other"),
    [communities, isSuper]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="イベント管理"
          description="イベントの作成、編集、案内管理を行います。"
        />
        <Button asChild>
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
            placeholder="イベント名、場所、概要で検索..."
            className="pl-9 h-9 text-sm"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-between h-9">
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
          <PopoverContent className="w-[280px] p-0 bg-card" align="start">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="イベント種別を検索"
                  value={eventTypeSearch}
                  onChange={(e) => setEventTypeSearch(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
            <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
              {filterableCommunities
                .filter((c) =>
                  c.name.toLowerCase().includes(eventTypeSearch.toLowerCase())
                )
                .map((community) => (
                  <CheckboxItem
                    key={community.id}
                    id={`event-type-${community.code}`}
                    label={community.name}
                    checked={eventTypes.includes(community.name)}
                    onCheckedChange={(checked) =>
                      toggleEventType(community.name, !!checked)
                    }
                    labelClassName="text-sm"
                  />
                ))}
            </div>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-between h-9">
              <span className="text-sm">
                {statuses.length === 0
                  ? "ステータス"
                  : statuses.length === 1
                    ? getStatusLabel(statuses[0])
                    : `${statuses.length}件選択`}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0 bg-card" align="start">
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
              {(["receiving", "paused", "waiting", "closed"] as const)
                .filter((s) =>
                  getStatusLabel(s)
                    .toLowerCase()
                    .includes(statusSearch.toLowerCase())
                )
                .map((status) => (
                  <CheckboxItem
                    key={status}
                    id={`status-${status}`}
                    label={getStatusLabel(status)}
                    checked={statuses.includes(status)}
                    onCheckedChange={(checked) =>
                      toggleStatus(status, !!checked)
                    }
                    labelClassName="text-sm"
                  />
                ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {filteredEvents.length}
            </span>
            件
            {filteredEvents.length > itemsPerPage && (
              <span className="ml-2">
                （{(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredEvents.length
                )}
                件目を表示）
              </span>
            )}
          </div>
        </div>
        <div className="rounded-lg bg-card">
          <Table className="[&_th]:py-3 [&_td]:py-3">
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
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    検索条件に一致するイベントが見つかりませんでした。
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEvents.map((event) => (
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
                      <Badge
                        variant={getEventTypeVariant(event.community.name)}
                      >
                        {event.community.name}
                      </Badge>
                    </TableCell>
                    <TableCell>{event.title}</TableCell>
                    <TableCell>{formatEventDate(event.date)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          EVENT_STATUS_CONFIG[event.displayStatus]
                            .variant as "default" | "outline" | "secondary" | "destructive-outline"
                        }
                      >
                        {EVENT_STATUS_CONFIG[event.displayStatus].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{event.actualAttendeesCount}名</TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
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
                          {event.displayStatus === "receiving" && (
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

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        getPageNumbers={getPageNumbers}
      />
    </div>
  );
}
