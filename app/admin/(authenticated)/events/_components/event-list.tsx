"use client";

import { useMemo } from "react";
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
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { usePagination } from "@/hooks/use-pagination";
import { useEventListFilters } from "@/hooks/use-event-list-filters";
import { formatEventDate } from "@/lib/utils/event";
import { filterAndSortEvents } from "@/lib/helpers/event-filter";
import {
  EVENT_STATUS_CONFIG,
  type EventDisplayStatus,
} from "@/lib/constants/event";
import { Plus, MoreVertical, Edit, Mail, Search, ChevronDown } from "lucide-react";
import { COMMUNITY_CODE, getCommunityBadgeVariant } from "@/lib/constants/community";
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
function getEventTypeVariant(communityCode: string): BadgeVariant {
  return getCommunityBadgeVariant(communityCode, "outline");
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

  const {
    filters,
    keywordInput,
    setKeywordInput,
    applyKeywordSearch,
    setPage,
    toggleStatus,
    toggleEventTypeCode,
  } = useEventListFilters();

  const {
    keyword: searchKeyword,
    statuses,
    eventTypeCodes: eventTypes,
    page,
  } = filters;

  const filteredEvents = useMemo(
    () =>
      filterAndSortEvents(initialEvents, {
        keyword: searchKeyword,
        statuses,
        eventTypeCodes: eventTypes,
      }),
    [initialEvents, searchKeyword, statuses, eventTypes]
  );

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems: paginatedEvents,
    getPageNumbers,
    itemsPerPage,
  } = usePagination(filteredEvents, {
    page,
    onPageChange: setPage,
  });

  // イベント種別フィルタに表示するコミュニティ（その他はsuperのみ）
  const filterableCommunities = useMemo(
    () =>
      communities.filter((c) => isSuper || c.code !== COMMUNITY_CODE.OTHER),
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
            value={keywordInput}
            onChange={(e) => {
              const value = e.target.value;
              setKeywordInput(value);
              if (value === "") {
                applyKeywordSearch("");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                applyKeywordSearch(e.currentTarget.value);
              }
            }}
            {...{
              onSearch: (e: React.FormEvent<HTMLInputElement>) => {
                applyKeywordSearch(e.currentTarget.value);
              },
            }}
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-between h-9">
              <span className="text-sm">
                {eventTypes.length === 0
                  ? "イベント種別"
                  : eventTypes.length === 1
                    ? communities.find((c) => c.code === eventTypes[0])?.name ?? eventTypes[0]
                    : `${eventTypes.length}件選択`}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0 bg-card" align="start">
            <div className="p-4 space-y-2">
              {filterableCommunities.map((community) => (
                  <CheckboxItem
                    key={community.id}
                    id={`event-type-${community.code}`}
                    label={community.name}
                    checked={eventTypes.includes(community.code)}
                    onCheckedChange={(checked) =>
                      toggleEventTypeCode(community.code, !!checked)
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
            <div className="p-4 space-y-2">
              {(["receiving", "paused", "waiting", "closed"] as const).map((status) => (
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
                        variant={getEventTypeVariant(event.community.code)}
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
                    <TableCell>{event.attendeesCount}名</TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
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
