"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { CheckboxItem } from "@/components/ui/checkbox-item";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { usePagination } from "@/hooks/use-pagination";
import { Search, ChevronDown } from "lucide-react";
import {
  RSVP_STATUS_CONFIG,
  RSVP_STATUSES,
  AFTER_PARTY_STATUS_CONFIG,
} from "@/lib/constants/event";
import { formatDateTime } from "@/lib/utils/event";
import { filterAttendees } from "@/lib/helpers/event-detail";
import type { AttendeeRow } from "@/lib/helpers/event-detail";
import { exportEventAttendeesCsvAction } from "@/lib/actions/event-attendees-export.actions";
import { downloadUtf8CsvFile } from "@/lib/utils/csv-download";
import type { RsvpStatus, AfterPartyStatus } from "@/lib/generated/prisma";
import type { SerializedEventDetail } from "@/lib/types/serialized";

interface TabAttendeesProps {
  event: SerializedEventDetail;
  allRows: AttendeeRow[];
  searchKeyword: string;
  onSearchKeywordChange: (value: string) => void;
  selectedStatuses: RsvpStatus[];
  onSelectedStatusesChange: (statuses: RsvpStatus[]) => void;
}

export function TabAttendees({
  event,
  allRows,
  searchKeyword,
  onSearchKeywordChange,
  selectedStatuses,
  onSelectedStatusesChange,
}: TabAttendeesProps) {
  const [isCsvPending, startCsvTransition] = useTransition();

  const filteredRows = useMemo(
    () => filterAttendees(allRows, searchKeyword, selectedStatuses),
    [allRows, searchKeyword, selectedStatuses]
  );

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems: paginatedRows,
    getPageNumbers,
    itemsPerPage,
  } = usePagination(filteredRows);

  const handleDownloadCsv = () => {
    startCsvTransition(async () => {
      try {
        const result = await exportEventAttendeesCsvAction({
          eventId: event.id,
          keyword: searchKeyword,
          statuses: selectedStatuses,
        });
        if ("csv" in result) {
          downloadUtf8CsvFile(
            result.csv,
            `event_attendees_${event.id}_${new Date().toISOString().split("T")[0]}.csv`
          );
          toast.success("CSVファイルをダウンロードしました");
        } else {
          toast.error(result.error ?? "CSVダウンロードに失敗しました");
        }
      } catch {
        toast.error("CSVダウンロードに失敗しました");
      }
    });
  };

  const handleStatusChange = (status: RsvpStatus, checked: boolean) => {
    if (checked) {
      onSelectedStatusesChange([...selectedStatuses, status]);
    } else {
      onSelectedStatusesChange(selectedStatuses.filter((s) => s !== status));
    }
  };

  return (
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
              onChange={(e) => onSearchKeywordChange(e.target.value)}
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
              <div className="p-4 space-y-2">
                {RSVP_STATUSES.map((status) => (
                  <CheckboxItem
                    key={status.value}
                    id={`rsvp-status-${status.value}`}
                    label={status.label}
                    checked={selectedStatuses.includes(status.value)}
                    onCheckedChange={(checked) =>
                      handleStatusChange(status.value, checked)
                    }
                    labelClassName="text-sm"
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* 参加者テーブル */}
        <div className="space-y-2">
          <div className="flex justify-end">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filteredRows.length}</span>件
              {filteredRows.length > itemsPerPage && (
                <span className="ml-2">
                  （{(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredRows.length)}件目を表示）
                </span>
              )}
            </div>
          </div>
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
                paginatedRows.map((row) => {
                  const statusConf =
                    RSVP_STATUS_CONFIG[
                      row.status as RsvpStatus
                    ];
                  return (
                    <TableRow key={row.rsvpId}>
                      <TableCell>
                        <Link
                          href={`/admin/customers/${row.customerId}?from=event`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {row.lastName} {row.firstName}
                        </Link>
                      </TableCell>
                      <TableCell>{row.company}</TableCell>
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
                          ) : null}
                        </TableCell>
                      )}
                      <TableCell>
                        {row.respondedAt
                          ? formatDateTime(row.respondedAt)
                          : null}
                      </TableCell>
                      <TableCell className="whitespace-normal max-w-md">
                        {row.comment ? (
                          <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                            {row.comment}
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })
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

        <div className="flex justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadCsv}
            disabled={isCsvPending}
          >
            <Download className="h-4 w-4" />
            {isCsvPending ? "ダウンロード中..." : "CSVダウンロード"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
