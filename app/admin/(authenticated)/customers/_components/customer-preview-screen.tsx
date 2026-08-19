"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, CircleAlert, FileText, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerEditDialog } from "./customer-edit-dialog";
import type {
  CommunityOption,
  ListingCategoryOption,
  MasterData,
} from "@/lib/types/serialized";
import {
  createCustomersBatchAction,
  findExistingCustomerEmailsAction,
} from "@/lib/actions/customer.actions";
import { usePagination } from "@/hooks/use-pagination";
import {
  formatFileSize,
  selectedCommunityNames,
  rebuildPayload,
  type PreviewCustomer,
} from "./customer-csv-types";
import { useRouter } from "next/navigation";

interface CustomerPreviewScreenProps {
  file: File;
  customers: PreviewCustomer[];
  onCustomersChange: (customers: PreviewCustomer[]) => void;
  onBack: () => void;
  prefectures: MasterData[];
  listingCategories: ListingCategoryOption[];
  departments: MasterData[];
  originIndustries: MasterData[];
  membershipQualifications: MasterData[];
  affiliations: MasterData[];
  communities: CommunityOption[];
  isSuper: boolean;
  scopedCommunityIds: number[];
}

export function CustomerPreviewScreen({
  file,
  customers,
  onCustomersChange,
  onBack,
  prefectures,
  listingCategories,
  departments,
  originIndustries,
  membershipQualifications,
  affiliations,
  communities,
  isSuper,
  scopedCommunityIds,
}: CustomerPreviewScreenProps) {
  const [editingCustomer, setEditingCustomer] =
    useState<PreviewCustomer | null>(null);
  const [isPending, startTransition] = useTransition();

  const errorCount = customers.filter((customer) => customer.error).length;
  const validCount = customers.length - errorCount;
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems: paginatedCustomers,
    getPageNumbers,
    itemsPerPage,
  } = usePagination(customers);

  const router = useRouter();

  const handleSave = async () => {
    if (!editingCustomer) return;
    const existingResult = await findExistingCustomerEmailsAction([
      editingCustomer.email,
    ]);
    if (existingResult.error) {
      toast.error(existingResult.error);
      return;
    }
    if ((existingResult.emails?.length ?? 0) > 0) {
      // const message = `${editingCustomer.id}行目：Toメールアドレス「${editingCustomer.email}」は既存顧客のメールアドレスと重複しています。`;
      const message = `${editingCustomer.id}行目：このメールアドレスは既に登録されています`;
      console.log('message', message);
      setEditingCustomer({
        ...editingCustomer,
        csvIssues: [
          ...(editingCustomer.csvIssues ?? []).filter(
            (issue) => issue.key !== "email" || issue.message !== message,
          ),
          { key: "email", message },
        ],
      });
      toast.error("このメールアドレスは既に登録されています");
      return;
    }
    const updatedCustomer = rebuildPayload(editingCustomer, {
      communities,
      departments,
      isSuper,
      scopedCommunityIds,
    });
    onCustomersChange(
      customers.map((customer) =>
        customer.id === updatedCustomer.id ? updatedCustomer : customer,
      ),
    );
    setEditingCustomer(null);
    toast.success(`${updatedCustomer.id}行目のデータを更新しました`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)} · バリデーション完了
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x rounded-md border bg-background text-center">
          <div className="px-5 py-2">
            <p className="text-xl font-semibold">{customers.length}</p>
            <p className="text-xs text-muted-foreground">総件数</p>
          </div>
          <div className="px-5 py-2">
            <p className="text-xl font-semibold text-green-600">{validCount}</p>
            <p className="text-xs text-muted-foreground">正常件数</p>
          </div>
          <div className="px-5 py-2">
            <p className="text-xl font-semibold text-destructive">
              {errorCount}
            </p>
            <p className="text-xs text-muted-foreground">エラー件数</p>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-semibold">データプレビュー</h3>
            <p className="text-sm text-muted-foreground">
              登録内容を確認し、不正なデータを編集してください。
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {customers.length}
            </span>
            件
            {customers.length > itemsPerPage && (
              <span className="ml-2">
                （{(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, customers.length)}
                件目を表示）
              </span>
            )}
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-14">No.</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>メールアドレス</TableHead>
                <TableHead>会社名</TableHead>
                <TableHead>コミュニティ</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="w-20 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className={customer.error ? "bg-destructive/5" : undefined}
                >
                  <TableCell>{customer.id}</TableCell>
                  <TableCell className="font-medium">
                    {customer.lastName} {customer.firstName}
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.company || "-"}</TableCell>
                  <TableCell>
                    {selectedCommunityNames(customer) || "-"}
                  </TableCell>
                  <TableCell>
                    {customer.error ? (
                      <div className="flex items-center gap-1.5 text-destructive">
                        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        <span className="text-xs">
                          {/* {customer.error.split("、")[0]}
                          {customer.error.split("、").length > 1 &&
                            `（他${customer.error.split("、").length - 1}件）`} */}
                          入力値に誤りがあります。
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-medium">登録可能</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditingCustomer({
                          ...customer,
                          auditMembershipQualificationId: resolveMasterId(
                            customer.auditMembershipQualificationId,
                            customer.auditMembershipQualification,
                            membershipQualifications,
                          ),
                          auditOriginIndustryId: resolveMasterId(
                            customer.auditOriginIndustryId,
                            customer.auditOriginIndustry,
                            originIndustries,
                          ),
                          naikanAffiliationId: resolveMasterId(
                            customer.naikanAffiliationId,
                            customer.naikanAffiliation,
                            affiliations,
                          ),
                          aiAffiliationId: resolveMasterId(
                            customer.aiAffiliationId,
                            customer.aiAffiliation,
                            affiliations,
                          ),
                          listingCategoryId: resolveListingId(
                            customer.listingCategoryId,
                            customer.listingCategory,
                            listingCategories,
                          ),
                          prefectureId: resolveMasterId(
                            customer.prefectureId,
                            customer.prefecture,
                            prefectures,
                          ),
                        })
                      }
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      編集
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            getPageNumbers={getPageNumbers}
          />
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <ActionButton type="button" variant="outline" onClick={onBack}>
          戻る
        </ActionButton>
        <ActionButton
          type="button"
          disabled={validCount < 1 || isPending}
          onClick={() =>
            startTransition(async () => {
              try {
                const validCustomers = customers.filter(
                  (customer) => !customer.error,
                );
                const existingResult = await findExistingCustomerEmailsAction(
                  validCustomers.map((customer) => customer.email),
                );
                if (existingResult.error) {
                  toast.error(existingResult.error);
                  return;
                }
                const existingEmails = existingResult.emails ?? [];
                if (existingEmails.length > 0) {
                  toast.error(
                    [
                      "既に登録されているメールアドレスがあります。",
                      ...existingEmails.map((email) => `・${email}`),
                    ].join("\n"),
                    {
                      style: {
                        whiteSpace: "pre-line",
                      },
                    },
                  );
                  return;
                }
                const result = await createCustomersBatchAction(
                  validCustomers.map((customer) => customer.payload),
                );
                if (result.error) {
                  toast.error(result.error);
                  return;
                }
                toast.success(
                  `${result.count ?? validCustomers.length}件の顧客データを登録しました。\n${errorCount}件の顧客データ エラー。`,
                  {
                    style: {
                      whiteSpace: "pre-line",
                    },
                  }
                );
                router.push("/admin/customers");
                router.refresh();
              } catch {
                toast.error(
                  "顧客データの登録に失敗しました。もう一度お試しください。",
                );
              }
            })
          }
        >
          {isPending ? "登録中..." : "登録する"}
        </ActionButton>
      </div>

      <CustomerEditDialog
        customer={editingCustomer}
        onOpenChange={(open) => {
          if (!open) setEditingCustomer(null);
        }}
        onChange={setEditingCustomer}
        onSave={handleSave}
        prefectures={prefectures}
        listingCategories={listingCategories}
        departments={departments}
        originIndustries={originIndustries}
        membershipQualifications={membershipQualifications}
        affiliations={affiliations}
        communities={communities}
        isSuper={isSuper}
        scopedCommunityIds={scopedCommunityIds}
      />
    </div>
  );
}

function resolveMasterId(
  id: number | undefined,
  name: string,
  items: MasterData[],
) {
  return items.some((item) => item.id === id)
    ? id
    : items.find((item) => item.name === name)?.id;
}

function resolveListingId(
  id: number | undefined,
  name: string,
  items: ListingCategoryOption[],
) {
  return items.some((item) => item.id === id)
    ? id
    : items.find(
      (item) =>
        item.marketName === name ||
        `${item.stockExchangeName} ${item.marketName}` === name,
    )?.id;
}
