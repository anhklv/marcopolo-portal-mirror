"use client";

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerBadges } from "@/components/ui/customer-badges";
import { PageHeader } from "@/components/ui/page-header";
import { ActionButton } from "@/components/ui/action-button";
import { SectionHeading } from "@/components/ui/section-heading";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { usePagination } from "@/hooks/use-pagination";
import { StepIndicator } from "@/app/admin/(authenticated)/events/[id]/invite/_components/step-indicator";
import { SURVEY_STEPS } from "@/lib/constants/survey";
import type { SerializedEventForSurvey } from "@/lib/types/serialized";
import type { useSurveySendForm } from "./use-survey-send-form";

interface StepSelectProps {
  event: SerializedEventForSurvey;
  form: ReturnType<typeof useSurveySendForm>;
}

export function StepSelect({ event, form }: StepSelectProps) {
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems: paginatedAttendees,
    getPageNumbers,
    itemsPerPage,
  } = usePagination(form.attendees);

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        backHref={`/admin/events/${event.id}`}
        title={event.title}
        description="アンケートメールを送信する参加者を選択してください。"
      />

      <StepIndicator currentStep={form.step} steps={SURVEY_STEPS} />

      <div className="space-y-4">
        <div className="space-y-2">
          <SectionHeading>送信先を選択</SectionHeading>
          <p className="text-sm text-muted-foreground">
            参加者（出席・オンライン）が表示されています。送信先を選択してアンケートメールを送信します。
          </p>
        </div>

        <div className="flex justify-start">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{form.selectedAttendeeIds.length}</span>名選択中
            {" / "}
            <span className="font-semibold text-foreground">{form.attendees.length}</span>名
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-end">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{form.attendees.length}</span>件
              {form.attendees.length > itemsPerPage && (
                <span className="ml-2">
                  （{(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, form.attendees.length)}件目を表示）
                </span>
              )}
            </div>
          </div>
        <div className="rounded-lg bg-card">
          <Table className="[&_th]:py-4 [&_td]:py-4">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    aria-label="すべて選択"
                    checked={
                      form.attendees.length === 0
                        ? false
                        : form.selectedAttendeeIds.length ===
                            form.attendees.length
                          ? true
                          : form.selectedAttendeeIds.length > 0
                            ? "indeterminate"
                            : false
                    }
                    disabled={form.attendees.length === 0}
                    onCheckedChange={() => form.toggleAllAttendees()}
                  />
                </TableHead>
                <TableHead>氏名</TableHead>
                <TableHead>会社名</TableHead>
                <TableHead>会員区分</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {form.attendees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    参加者がいません。
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAttendees.map((attendee) => (
                  <TableRow key={attendee.id}>
                    <TableCell>
                      <Checkbox
                        checked={form.selectedAttendeeIds.includes(attendee.id)}
                        onCheckedChange={() => form.toggleAttendee(attendee.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/customers/${attendee.id}?from=event`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {attendee.lastName} {attendee.firstName}
                      </Link>
                    </TableCell>
                    <TableCell>{attendee.company}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap items-center">
                        <CustomerBadges
                          customerCommunities={attendee.customerCommunities}
                          memberCategory={attendee.memberCategory}
                        />
                      </div>
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

        <div className="flex justify-center gap-4 pt-4">
          <ActionButton variant="outline" asChild>
            <Link href={`/admin/events/${event.id}`}>キャンセル</Link>
          </ActionButton>
          <ActionButton onClick={form.handleSelectNext}>次へ</ActionButton>
        </div>
      </div>
    </div>
  );
}
