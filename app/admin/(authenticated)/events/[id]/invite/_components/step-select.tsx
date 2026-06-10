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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerBadges } from "@/components/ui/customer-badges";
import { Search, Users, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ActionButton } from "@/components/ui/action-button";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import { SectionHeading } from "@/components/ui/section-heading";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { usePagination } from "@/hooks/use-pagination";
import type { SerializedEventForInvite } from "@/lib/types/serialized";
import type { CommunityOption } from "@/lib/types/serialized";
import { getFilterDisplayText } from "@/lib/helpers/filter-display";
import { StepIndicator } from "./step-indicator";
import type { useInviteForm } from "./use-invite-form";

interface StepSelectProps {
  event: SerializedEventForInvite;
  communities: CommunityOption[];
  currentUserRole: "super" | "community_admin";
  form: ReturnType<typeof useInviteForm>;
}

export function StepSelect({ event, communities, currentUserRole, form }: StepSelectProps) {
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems: paginatedCustomers,
    getPageNumbers,
    itemsPerPage,
  } = usePagination(form.filteredCustomers);

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        backHref={`/admin/events/${event.id}`}
        title={event.title}
        description="案内メールを送信する顧客を選択してください。"
      />

      <StepIndicator currentStep={form.step} />

      <div className="space-y-4">
        <div className="space-y-2">
          <SectionHeading>案内者を選択</SectionHeading>
          <p className="text-sm text-muted-foreground">
            未案内・未回答の顧客を選択して案内メールを送信します。未回答の顧客には新しいURLで再送されます。
            <br />
            ※送信時に自動で個別ID付きURLが生成されます。
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="名前、会社名、メールアドレスで検索..."
              className="pl-9 h-9 text-sm"
              value={form.searchKeyword}
              onChange={(e) => form.setSearchKeyword(e.target.value)}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-between h-9 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{getFilterDisplayText(communities, form.selectedCommunityIds, form.includeNonMemberFilter)}</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0 bg-card" align="start">
              <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">コミュニティ</Label>
                  <div className="space-y-2">
                    {communities.map((community) => (
                      <CheckboxItem
                        key={community.id}
                        id={`org-${community.code}`}
                        label={community.name}
                        checked={form.selectedCommunityIds.includes(community.id)}
                        onCheckedChange={(c) => form.toggleCommunityId(community.id, c)}
                        labelClassName="text-sm"
                      />
                    ))}
                    {currentUserRole === "super" && (
                      <CheckboxItem
                        id="org-nonmember"
                        label="非会員"
                        checked={form.includeNonMemberFilter}
                        onCheckedChange={form.setIncludeNonMemberFilter}
                        labelClassName="text-sm"
                      />
                    )}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between h-9 text-sm">
                <span>
                  {form.inviteStatuses.length === 0
                    ? "案内状況"
                    : form.inviteStatuses.length === 1
                      ? form.inviteStatuses[0]
                      : `${form.inviteStatuses.length}件選択`}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0 bg-card" align="start">
              <div className="p-4 space-y-2">
                {["未案内", "未回答"].map((status) => (
                    <CheckboxItem
                      key={status}
                      id={`status-${status}`}
                      label={status}
                      checked={form.inviteStatuses.includes(status)}
                      onCheckedChange={(c) => form.toggleInviteStatus(status, c)}
                      labelClassName="text-sm"
                    />
                  ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center h-9">
            <CheckboxItem
              id="include-former-members"
              label="元会員を含む"
              checked={form.includeFormerMembers}
              onCheckedChange={form.setIncludeFormerMembers}
              labelClassName="text-sm"
            />
          </div>
        </div>

        <div className="flex justify-start">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{form.selectedCustomerIds.length}</span>名選択中
            {" / "}
            <span className="font-semibold text-foreground">{form.filteredCustomers.length}</span>名
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-end">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{form.filteredCustomers.length}</span>件
              {form.filteredCustomers.length > itemsPerPage && (
                <span className="ml-2">
                  （{(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, form.filteredCustomers.length)}件目を表示）
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
                      form.filteredCustomers.length === 0
                        ? false
                        : form.selectedCustomerIds.length === form.filteredCustomers.length
                          ? true
                          : form.selectedCustomerIds.length > 0
                            ? "indeterminate"
                            : false
                    }
                    disabled={form.filteredCustomers.length === 0}
                    onCheckedChange={() => form.toggleAllCustomers()}
                  />
                </TableHead>
                <TableHead>氏名</TableHead>
                <TableHead>会社名</TableHead>
                <TableHead>会員区分</TableHead>
                <TableHead>案内状況</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {form.filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    検索条件に一致する顧客が見つかりませんでした。
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Checkbox
                        checked={form.selectedCustomerIds.includes(customer.id)}
                        onCheckedChange={() => form.toggleCustomer(customer.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/customers/${customer.id}?from=event`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {customer.lastName} {customer.firstName}
                      </Link>
                    </TableCell>
                    <TableCell>{customer.company}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap items-center">
                        <CustomerBadges customerCommunities={customer.customerCommunities} memberCategory={customer.memberCategory} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.rsvpStatus === "pending" ? "default" : "outline"}>
                        {customer.rsvpStatus === "pending" ? "未回答" : "未案内"}
                      </Badge>
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
