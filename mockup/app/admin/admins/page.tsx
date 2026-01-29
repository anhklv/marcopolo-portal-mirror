"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { admins } from "@/lib/data/mock";
import type { Admin } from "@/lib/types";
import { ADMIN_ROLE_LABELS } from "@/lib/constants/admin";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/contexts/auth.context";

export default function AdminsPage() {
  const router = useRouter();
  const { currentAdmin } = useAuth();
  const [searchKeyword, setSearchKeyword] = useState("");

  // 特権管理者のみアクセス可能
  useEffect(() => {
    if (currentAdmin?.role !== "super") {
      toast.error("この機能は特権管理者のみ利用できます");
      router.push("/admin/customers");
    }
  }, [currentAdmin, router]);

  const filteredAdmins = useMemo(() => {
    let results = [...admins];

    // フリーワード検索
    if (searchKeyword) {
      results = results.filter((admin) => {
        const fullName = `${admin.lastName}${admin.firstName}`;
        return (
          fullName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          admin.email.toLowerCase().includes(searchKeyword.toLowerCase())
        );
      });
    }

    // ソート: ID昇順
    return results.sort((a, b) => {
      const idA = parseInt(a.id.replace("A", "")) || 0;
      const idB = parseInt(b.id.replace("A", "")) || 0;
      return idA - idB;
    });
  }, [searchKeyword]);


  if (currentAdmin?.role !== "super") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">管理者管理</h1>
          <p className="text-sm text-muted-foreground">
            システムを利用する管理者アカウントを管理します。
          </p>
        </div>
        <Button variant="outline" asChild>
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
            className="pl-9 h-10"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredAdmins.length}</span>件
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
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
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  検索条件に一致する管理者が見つかりませんでした。
                </TableCell>
              </TableRow>
            ) : (
              filteredAdmins.map((admin, index) => (
                <TableRow
                  key={admin.id}
                  className="hover:bg-gray-50"
                >
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{`${admin.lastName} ${admin.firstName}`}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Badge variant={admin.role === "super" ? "default" : "secondary"}>
                      {admin.role === "community_admin" && admin.communityScopes
                        ? `${ADMIN_ROLE_LABELS[admin.role]}(${admin.communityScopes.join("、")})`
                        : ADMIN_ROLE_LABELS[admin.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {admin.lastLoginAt ? formatDate(admin.lastLoginAt) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/admins/${admin.id}/edit`}>編集</Link>
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
