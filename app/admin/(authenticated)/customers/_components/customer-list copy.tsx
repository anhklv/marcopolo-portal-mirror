"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { CustomerBadges } from "@/components/ui/customer-badges";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Search, Users, ChevronDown, Download, Plus } from "lucide-react";
import { COMMUNITY_CODE } from "@/lib/constants/community";
import type { SerializedCustomer, CommunityOption } from "@/lib/types/serialized";
import type { MemberCategory } from "@/lib/generated/prisma";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { usePagination } from "@/hooks/use-pagination";
import { useCustomerListFilters } from "@/hooks/use-customer-list-filters";
import { exportCustomersAction } from "@/lib/actions/customer.actions";
import { downloadUtf8CsvFile } from "@/lib/utils/csv-download";
import { filterCustomers } from "@/lib/helpers/customer-filter";
import { getFilterDisplayText } from "@/lib/helpers/filter-display";

// ============================================================
// 型定義
// ============================================================

interface CustomerListProps {
  initialCustomers: SerializedCustomer[];
  communities: CommunityOption[];
  isSuper: boolean;
  scopedCommunityIds: number[];
}

// ============================================================
// コンポーネント
// ============================================================

export function CustomerList({
  initialCustomers,
  communities,
  isSuper,
  scopedCommunityIds,
}: CustomerListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    filters,
    keywordInput,
    setKeywordInput,
    applyKeywordSearch,
    setPage,
    toggleCommunityId,
    setMemberCategories,
    toggleMemberCategory,
    setAuditMemberTypes,
    toggleAuditMemberType,
    setPremiumOnly,
    setIncludeFormerMembers,
    setIncludeNonMemberFilter,
  } = useCustomerListFilters();

  const {
    keyword: searchKeyword,
    communityIds: selectedCommunityIds,
    memberCategories,
    auditMemberTypes,
    premiumOnly,
    includeFormerMembers,
    includeNonMemberFilter,
    page,
  } = filters;

  // ベンチャー監査役の会（定数判定用）
  const ventureAuditorCommunity = communities.find((c) => c.code === COMMUNITY_CODE.VENTURE_AUDITOR);

  // コミュニティ選択操作（依存フィルタのリセット処理含む）
  const handleCommunityChange = (communityId: number, checked: boolean) => {
    toggleCommunityId(communityId, checked);

    const nextSelectedIds = checked
      ? [...selectedCommunityIds, communityId]
      : selectedCommunityIds.filter((id) => id !== communityId);

    if (nextSelectedIds.length === 0) {
      setMemberCategories([]);
    }

    if (ventureAuditorCommunity) {
      const isAuditIncluded = nextSelectedIds.includes(ventureAuditorCommunity.id);
      if (!isAuditIncluded) {
        setAuditMemberTypes([]);
        setPremiumOnly(false);
      }
    }
  };

  // フィルタリング
  const filteredCustomers = useMemo(
    () =>
      filterCustomers(initialCustomers, {
        keyword: searchKeyword,
        communityIds: selectedCommunityIds,
        memberCategories,
        auditMemberTypes,
        premiumOnly,
        includeFormerMembers,
        includeNonMemberFilter,
      }),
    [
      initialCustomers,
      searchKeyword,
      selectedCommunityIds,
      memberCategories,
      auditMemberTypes,
      premiumOnly,
      includeFormerMembers,
      includeNonMemberFilter,
    ]
  );

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems: paginatedCustomers,
    getPageNumbers,
    itemsPerPage,
  } = usePagination(filteredCustomers, {
    page,
    onPageChange: setPage,
  });

  const handleMemberCategoryChange = (category: MemberCategory, checked: boolean) => {
    toggleMemberCategory(category, checked);
    if (!checked && category === "member") {
      setAuditMemberTypes([]);
      setPremiumOnly(false);
    }
  };

  const isAuditSelected = ventureAuditorCommunity
    ? selectedCommunityIds.includes(ventureAuditorCommunity.id)
    : false;
  const anyCommunitySelected = selectedCommunityIds.length > 0;

  const handleDownloadCSV = () => {
    startTransition(async () => {
      try {
        const result = await exportCustomersAction({
          keyword: searchKeyword,
          communityIds: selectedCommunityIds.length > 0 ? selectedCommunityIds : undefined,
          memberCategories: memberCategories.length > 0 ? memberCategories : undefined,
          auditMemberTypes: auditMemberTypes.length > 0 ? auditMemberTypes : undefined,
          premiumOnly,
          includeFormerMembers,
          includeNonMember: includeNonMemberFilter,
        });

        if ("csv" in result) {
          downloadUtf8CsvFile(
            result.csv,
            `customers_${new Date().toISOString().split("T")[0]}.csv`
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="顧客管理"
          description="会員・非会員を含むすべての顧客情報を管理します。"
        />
        <Button asChild>
          <Link href="/admin/customers/new">
            <Plus className="h-4 w-4" />
            新規登録
          </Link>
        </Button>
      </div>

      {/* フィルタ */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="名前、会社名、メールアドレスで検索..."
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
            // type=search の × ボタン（React 型定義に未収載）
            {...{
              onSearch: (e: React.FormEvent<HTMLInputElement>) => {
                applyKeywordSearch(e.currentTarget.value);
              },
            }}
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[280px] justify-between h-9">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate">{getFilterDisplayText(communities, selectedCommunityIds, includeNonMemberFilter)}</span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0 bg-card" align="start">
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {/* コミュニティ */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">コミュニティ</Label>
                <div className="space-y-2">
                  {communities
                    .filter((c) => isSuper || scopedCommunityIds.includes(c.id))
                    .map((c) => (
                      <CheckboxItem
                        key={c.id}
                        id={`community-${c.id}`}
                        label={c.name}
                        checked={selectedCommunityIds.includes(c.id)}
                        onCheckedChange={(checked) => handleCommunityChange(c.id, checked)}
                        labelClassName="text-sm"
                      />
                    ))}
                  {isSuper && (
                    <CheckboxItem
                      id="non-member"
                      label="非会員"
                      checked={includeNonMemberFilter}
                      onCheckedChange={setIncludeNonMemberFilter}
                      labelClassName="text-sm"
                    />
                  )}
                </div>
              </div>

              {anyCommunitySelected && (
                <div className="space-y-2 border-t pt-4">
                  <Label className="text-sm font-semibold">会員区分</Label>
                  <div className="space-y-2">
                    <CheckboxItem
                      id="member-member"
                      label="会員"
                      checked={memberCategories.includes("member")}
                      onCheckedChange={(checked) => handleMemberCategoryChange("member", checked)}
                      labelClassName="text-sm"
                    />
                    <CheckboxItem
                      id="member-sponsor"
                      label="スポンサー"
                      checked={memberCategories.includes("sponsor")}
                      onCheckedChange={(checked) => handleMemberCategoryChange("sponsor", checked)}
                      labelClassName="text-sm"
                    />
                    <CheckboxItem
                      id="member-observer"
                      label="オブザーバー"
                      checked={memberCategories.includes("observer")}
                      onCheckedChange={(checked) => handleMemberCategoryChange("observer", checked)}
                      labelClassName="text-sm"
                    />
                  </div>
                </div>
              )}

              {isAuditSelected && (
                <div className="space-y-2 border-t pt-4">
                  <Label className="text-sm font-semibold">ベンチャー監査役の会 会員種別</Label>
                  <div className="space-y-2">
                    <CheckboxItem
                      id="audit-regular"
                      label="正会員"
                      checked={auditMemberTypes.includes("regular")}
                      onCheckedChange={(checked) => toggleAuditMemberType("regular", checked)}
                      labelClassName="text-sm"
                    />
                    <CheckboxItem
                      id="audit-online"
                      label="オンライン会員"
                      checked={auditMemberTypes.includes("online")}
                      onCheckedChange={(checked) => toggleAuditMemberType("online", checked)}
                      labelClassName="text-sm"
                    />
                  </div>
                </div>
              )}

              {isAuditSelected && (
                <div className="space-y-2 border-t pt-4">
                  <CheckboxItem
                    id="premium"
                    label="プレミアム会員のみ"
                    checked={premiumOnly}
                    onCheckedChange={setPremiumOnly}
                    labelClassName="text-sm"
                  />
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center h-9">
          <CheckboxItem
            id="include-former-members"
            label="元会員を含む"
            checked={includeFormerMembers}
            onCheckedChange={setIncludeFormerMembers}
            labelClassName="text-sm"
          />
        </div>
      </div>

      {/* 結果件数 */}
      <div className="space-y-2">
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredCustomers.length}</span>件
            {filteredCustomers.length > itemsPerPage && (
              <span className="ml-2">
                （{(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredCustomers.length)}件目を表示）
              </span>
            )}
          </div>
        </div>
        <div className="rounded-lg bg-card">
          <Table className="[&_th]:py-3 [&_td]:py-3">
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>氏名</TableHead>
              <TableHead>会社名</TableHead>
              <TableHead>会員区分</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  検索条件に一致する顧客が見つかりませんでした。
                </TableCell>
              </TableRow>
            ) : (
              paginatedCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/admin/customers/${customer.id}`)}
                >
                  <TableCell>{customer.id}</TableCell>
                  <TableCell>{customer.lastName} {customer.firstName}</TableCell>
                  <TableCell>{customer.company}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap items-center">
                      <CustomerBadges customerCommunities={customer.customerCommunities} memberCategory={customer.memberCategory} />
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(customer.registeredAt)}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/customers/${customer.id}/edit`}>編集</Link>
                    </Button>
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

      <div className="flex justify-end">
        <Button variant="outline" onClick={handleDownloadCSV} disabled={isPending}>
          <Download className="h-4 w-4" />
          {isPending ? "ダウンロード中..." : "CSVダウンロード"}
        </Button>
      </div>
    </div>
  );
}
