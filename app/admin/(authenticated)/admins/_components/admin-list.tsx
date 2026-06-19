"use client";

import { useMemo } from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ADMIN_ROLE_LABELS } from "@/lib/constants/admin";
import { filterAdmins } from "@/lib/helpers/admin-filter";
import { useAdminListFilters } from "@/hooks/use-admin-list-filters";
import type { SerializedAdmin } from "@/lib/types/serialized";

// ============================================================
// 型定義
// ============================================================

interface AdminListProps {
  initialAdmins: SerializedAdmin[];
}

// ============================================================
// コンポーネント
// ============================================================

export function AdminList({ initialAdmins }: AdminListProps) {
  const { filters, keywordInput, setKeywordInput, applyKeywordSearch } =
    useAdminListFilters();

  const filteredAdmins = useMemo(
    () => filterAdmins(initialAdmins, filters.keyword),
    [initialAdmins, filters.keyword]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="管理者管理"
          description="システムを利用する管理者アカウントを管理します。"
        />
        <Button asChild>
          <Link href="/admin/admins/new">
            <Plus className="h-4 w-4" />
            新規登録
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="名前、メールアドレスで検索..."
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
      </div>

      <div className="flex justify-end">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {filteredAdmins.length}
          </span>
          件
        </div>
      </div>

      <div className="rounded-lg bg-card">
        <Table className="[&_th]:py-3 [&_td]:py-3">
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>氏名</TableHead>
              <TableHead>メールアドレス</TableHead>
              <TableHead>管理者権限</TableHead>
              <TableHead>最終ログイン</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdmins.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  検索条件に一致する管理者が見つかりませんでした。
                </TableCell>
              </TableRow>
            ) : (
              filteredAdmins.map((admin) => (
                <TableRow key={admin.id} className="hover:bg-muted">
                  <TableCell className="font-medium">{admin.id}</TableCell>
                  <TableCell>{`${admin.lastName} ${admin.firstName}`}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        admin.role === "super" ? "default" : "secondary"
                      }
                    >
                      {admin.role === "community_admin" &&
                      admin.adminCommunities.length > 0
                        ? `${ADMIN_ROLE_LABELS[admin.role as keyof typeof ADMIN_ROLE_LABELS]}(${admin.adminCommunities.map((ac) => ac.community.name).join("、")})`
                        : ADMIN_ROLE_LABELS[
                            admin.role as keyof typeof ADMIN_ROLE_LABELS
                          ]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {admin.lastLoginAt
                      ? formatDate(admin.lastLoginAt)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/admins/${admin.id}/edit`}>
                          編集
                        </Link>
                      </Button>
                    </div>
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
