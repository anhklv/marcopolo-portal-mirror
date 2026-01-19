"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { admins } from "@/lib/data/mock";
import type { AdminRole, CommunityScope } from "@/lib/types";
import { ADMIN_ROLE_LABELS, COMMUNITY_SCOPE_LABELS } from "@/lib/constants/admin";
import { useAuth } from "@/lib/contexts/auth.context";

export default function AdminEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next.js 16ではparamsはPromiseとして渡されるため、use()を使用
  // React 19の機能で、Next.js 16でサポートされている
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { currentAdmin } = useAuth();
  const admin = admins.find((a) => a.id === id);

  const [lastName, setLastName] = useState(admin?.lastName || "");
  const [firstName, setFirstName] = useState(admin?.firstName || "");
  const [email, setEmail] = useState(admin?.email || "");
  const [role, setRole] = useState<AdminRole>(admin?.role || "community_admin");
  const [communityScopes, setCommunityScopes] = useState<CommunityScope[]>(
    admin?.communityScopes || []
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 特権管理者のみアクセス可能
  useEffect(() => {
    if (currentAdmin?.role !== "super") {
      toast.error("この機能は特権管理者のみ利用できます");
      router.push("/admin/customers");
    }
  }, [currentAdmin, router]);

  if (!admin) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/admins">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">管理者が見つかりません</h1>
            <p className="text-muted-foreground">
              指定された管理者IDの情報が見つかりませんでした。
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleCommunityScopeChange = (scope: CommunityScope, checked: boolean) => {
    setCommunityScopes((prev) => {
      const hasScope = prev.includes(scope);
      if (checked) {
        return hasScope ? prev : [...prev, scope];
      }
      return hasScope ? prev.filter((s) => s !== scope) : prev;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (!lastName || !firstName || !email) {
      toast.error("すべての必須項目を入力してください");
      return;
    }

    if (role === "community_admin" && communityScopes.length === 0) {
      toast.error("対象コミュニティを1つ以上選択してください");
      return;
    }

    toast.success("管理者情報を更新しました");
    router.push("/admin/admins");
  };

  const handleDelete = () => {
    toast.success(`${admin.lastName}${admin.firstName}を削除しました`);
    setIsDeleteDialogOpen(false);
    router.push("/admin/admins");
  };

  if (currentAdmin?.role !== "super") {
    return null;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/admins">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">管理者編集</h1>
          <p className="text-muted-foreground">
            管理者情報を編集・更新します。
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lastName">
                  姓 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="例: 山田"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="firstName">
                  名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="例: 太郎"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">
                メールアドレス <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>管理者権限</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label className="text-base font-medium">
                権限 <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={role}
                onValueChange={(v) => setRole(v as AdminRole)}
                disabled={admin.role === "super"}
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="super" id="super" disabled={admin.role === "super"} />
                    <Label
                      htmlFor="super"
                      className={admin.role === "super" ? "cursor-not-allowed" : "cursor-pointer"}
                    >
                      {ADMIN_ROLE_LABELS.super}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {admin.role === "super"
                      ? "特権管理者の権限は変更できません。"
                      : "すべての機能にアクセスでき、管理者の追加・編集が可能です。"}
                  </p>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="community_admin" id="community_admin" />
                    <Label htmlFor="community_admin" className="cursor-pointer">
                      {ADMIN_ROLE_LABELS.community_admin}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    担当コミュニティの顧客・イベントのみ管理できます。
                  </p>
                </div>
              </RadioGroup>
            </div>

            {role === "community_admin" && (
              <div className="grid gap-2">
                <Label className="text-base font-medium">
                  対象コミュニティ <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="scope-audit"
                      checked={communityScopes.includes("ベンチャー監査役の会")}
                      onCheckedChange={(checked) =>
                        handleCommunityScopeChange("ベンチャー監査役の会", checked === true)
                      }
                    />
                    <Label htmlFor="scope-audit" className="cursor-pointer">
                      {COMMUNITY_SCOPE_LABELS["ベンチャー監査役の会"]}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="scope-naikan"
                      checked={communityScopes.includes("ないかんMeetup")}
                      onCheckedChange={(checked) =>
                        handleCommunityScopeChange("ないかんMeetup", checked === true)
                      }
                    />
                    <Label htmlFor="scope-naikan" className="cursor-pointer">
                      {COMMUNITY_SCOPE_LABELS["ないかんMeetup"]}
                    </Label>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  複数のコミュニティを選択できます。
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-4 border-t">
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                削除
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>管理者を削除</DialogTitle>
                <DialogDescription>
                  {admin.lastName}{admin.firstName}（{admin.email}）を削除してもよろしいですか？
                  <br />
                  この操作は取り消せません。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="cursor-pointer"
                >
                  キャンセル
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="cursor-pointer text-destructive hover:text-destructive"
                >
                  削除
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button type="submit" variant="outline" className="cursor-pointer">
            更新する
          </Button>
        </div>
      </form>
    </div>
  );
}
