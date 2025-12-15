"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
import { events } from "@/lib/data/mock";
import { Plus, MoreVertical, Edit, Mail, Pause, Search, ChevronDown } from "lucide-react";

export default function EventsPage() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [statusSearch, setStatusSearch] = useState("");

  const handleSearch = () => {
    // 検索処理は useMemo で自動的に実行される
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setStatuses([...statuses, status]);
    } else {
      setStatuses(statuses.filter((s) => s !== status));
    }
  };

  const filteredEvents = useMemo(() => {
    const filtered = events.filter((event) => {
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

      return matchesKeyword && matchesStatus;
    });

    return filtered;
  }, [searchKeyword, statuses]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">イベント管理</h1>
          <p className="text-muted-foreground">
            イベントの作成、編集、招待管理を行います。
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
                {statuses.length === 0
                  ? "ステータス"
                  : statuses.length === 1
                  ? statuses[0] === "planning"
                    ? "企画中"
                    : statuses[0] === "open"
                    ? "受付中"
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
                { value: "planning", label: "企画中" },
                { value: "open", label: "受付中" },
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
                          : status.value === "planning"
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

        <Button variant="outline" onClick={handleSearch} className="h-10 cursor-pointer">
          <Search className="h-4 w-4" />
          検索
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>イベント名</TableHead>
              <TableHead>開催日時</TableHead>
              <TableHead>場所</TableHead>
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
                onClick={() => {
                  window.location.href = `/admin/events/${event.id}`;
                }}
              >
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell>{event.date}</TableCell>
                <TableCell>{event.location}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      event.status === "open"
                        ? "default"
                        : event.status === "planning"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {event.status === "open"
                      ? "受付中"
                      : event.status === "planning"
                      ? "企画中"
                      : "終了"}
                  </Badge>
                </TableCell>
                <TableCell>{event.attendeesCount}名</TableCell>
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
                      <DropdownMenuItem asChild className="bg-white hover:bg-gray-100 cursor-pointer">
                        <Link href={`/admin/events/${event.id}/invite`} className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          招待
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="bg-white hover:bg-gray-100 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Pause className="h-4 w-4" />
                          一時停止
                        </div>
                      </DropdownMenuItem>
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
