"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
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
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Search, Users, ChevronDown, Download, Plus } from "lucide-react";
import { getCustomerBadges } from "@/lib/helpers/customer-detail";
import type { SerializedCustomer, CommunityOption } from "@/lib/types/serialized";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { exportCustomersAction } from "@/lib/actions/customer.actions";
import { filterCustomers } from "@/lib/helpers/customer-filter";

const ITEMS_PER_PAGE = 10;

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

  // フィルタ状態
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCommunityIds, setSelectedCommunityIds] = useState<number[]>([]);
  const [memberCategories, setMemberCategories] = useState<string[]>([]);
  const [auditMemberTypes, setAuditMemberTypes] = useState<string[]>([]);
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [includeFormerMembers, setIncludeFormerMembers] = useState(false);
  const [includeNonMemberFilter, setIncludeNonMemberFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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
    [initialCustomers, searchKeyword, selectedCommunityIds, memberCategories, auditMemberTypes, premiumOnly, includeFormerMembers, includeNonMemberFilter]
  );

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, selectedCommunityIds, memberCategories, auditMemberTypes, premiumOnly, includeFormerMembers, includeNonMemberFilter]);

  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "ellipsis")[] = [1];
    if (currentPage > 3) pages.push("ellipsis");
    if (currentPage > 1 && currentPage < totalPages) pages.push(currentPage);
    if (currentPage < totalPages - 2) pages.push("ellipsis");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  // コミュニティ選択操作
  const handleCommunityChange = (communityId: number, checked: boolean) => {
    setSelectedCommunityIds((prev) =>
      checked ? [...prev, communityId] : prev.filter((id) => id !== communityId)
    );
  };

  const handleMemberCategoryChange = (category: string, checked: boolean) => {
    setMemberCategories((prev) =>
      checked ? [...prev, category] : prev.filter((c) => c !== category)
    );
    if (!checked && category === "member") {
      setAuditMemberTypes([]);
      setPremiumOnly(false);
    }
  };

  const handleAuditMemberTypeChange = (type: string, checked: boolean) => {
    setAuditMemberTypes((prev) =>
      checked ? [...prev, type] : prev.filter((t) => t !== type)
    );
  };

  // ベンチャー監査役の会が選択されているか
  const ventureAuditorCommunity = communities.find((c) => c.code === "venture_auditor");
  const isAuditSelected = ventureAuditorCommunity
    ? selectedCommunityIds.includes(ventureAuditorCommunity.id)
    : false;
  const anyCommunitySelected = selectedCommunityIds.length > 0;

  // フィルタ表示テキスト
  const getFilterDisplayText = () => {
    if (selectedCommunityIds.length === 0 && !includeNonMemberFilter) return "コミュニティ";
    
    const names = communities
      .filter((c) => selectedCommunityIds.includes(c.id))
      .map((c) => c.name);
      
    if (includeNonMemberFilter) {
      names.push("非会員");
    }

    if (names.length === 1) return names[0];
    return `${names.length}件選択`;
  };

  // CSVダウンロード
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
          const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `customers_${new Date().toISOString().split("T")[0]}.csv`;
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success("CSVファイルをダウンロードしました");
        } else {
          toast.error(result.error ?? "CSVダウンロードに失敗しました");
        }
      } catch {
        toast.error("CSVダウンロードに失敗しました");
      }
    });
  };

  // バッジ生成
  const renderBadges = (customer: SerializedCustomer) => {
    const badges = getCustomerBadges(
      customer.customerCommunities,
      customer.memberCategory
    );
    return badges.map((badge, i) => (
      <Badge key={i} variant={badge.variant}>
        {badge.label}
      </Badge>
    ));
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
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[280px] justify-between h-9">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate">{getFilterDisplayText()}</span>
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
                      />
                    ))}
                  {/* 非会員（特権管理者のみ） */}
                  {isSuper && (
                    <CheckboxItem
                      id="non-member"
                      label="非会員"
                      checked={includeNonMemberFilter}
                      onCheckedChange={setIncludeNonMemberFilter}
                    />
                  )}
                </div>
              </div>

              {/* 会員区分（コミュニティを選択した場合のみ表示、非会員には会員区分がないため） */}
              {anyCommunitySelected && (
                <div className="space-y-2 border-t pt-4">
                  <Label className="text-sm font-semibold">会員区分</Label>
                  <div className="space-y-2">
                    <CheckboxItem
                      id="member-member"
                      label="会員"
                      checked={memberCategories.includes("member")}
                      onCheckedChange={(checked) => handleMemberCategoryChange("member", checked)}
                    />
                    <CheckboxItem
                      id="member-sponsor"
                      label="スポンサー"
                      checked={memberCategories.includes("sponsor")}
                      onCheckedChange={(checked) => handleMemberCategoryChange("sponsor", checked)}
                    />
                    <CheckboxItem
                      id="member-observer"
                      label="オブザーバー"
                      checked={memberCategories.includes("observer")}
                      onCheckedChange={(checked) => handleMemberCategoryChange("observer", checked)}
                    />
                  </div>
                </div>
              )}

              {/* 会員種別（ベンチャー監査役の会選択時） */}
              {isAuditSelected && (
                <div className="space-y-2 border-t pt-4">
                  <Label className="text-sm font-semibold">ベンチャー監査役の会 会員種別</Label>
                  <div className="space-y-2">
                    <CheckboxItem
                      id="audit-regular"
                      label="正会員"
                      checked={auditMemberTypes.includes("regular")}
                      onCheckedChange={(checked) => handleAuditMemberTypeChange("regular", checked)}
                    />
                    <CheckboxItem
                      id="audit-online"
                      label="オンライン会員"
                      checked={auditMemberTypes.includes("online")}
                      onCheckedChange={(checked) => handleAuditMemberTypeChange("online", checked)}
                    />
                  </div>
                </div>
              )}

              {/* プレミアム */}
              {isAuditSelected && (
                <div className="space-y-2 border-t pt-4">
                  <CheckboxItem
                    id="premium"
                    label="プレミアム会員のみ"
                    checked={premiumOnly}
                    onCheckedChange={setPremiumOnly}
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
          />
        </div>
      </div>

      {/* 結果件数 */}
      <div className="space-y-2">
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredCustomers.length}</span>件
            {filteredCustomers.length > ITEMS_PER_PAGE && (
              <span className="ml-2">
                （{(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)}件目を表示）
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
                      {renderBadges(customer)}
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

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              />
            </PaginationItem>
            {getPageNumbers().map((page, i) =>
              page === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={currentPage === page}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* CSVダウンロード */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleDownloadCSV} disabled={isPending}>
          <Download className="h-4 w-4" />
          {isPending ? "ダウンロード中..." : "CSVダウンロード"}
        </Button>
      </div>
    </div>
  );
}
