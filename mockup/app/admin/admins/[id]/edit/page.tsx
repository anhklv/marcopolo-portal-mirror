"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
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
import { Trash2 } from "lucide-react";
import { admins } from "@/lib/data/mock";
import type { AdminRole, CommunityScope } from "@/lib/types";
import { ADMIN_ROLE_LABELS, COMMUNITY_SCOPE_LABELS } from "@/lib/constants/admin";
import { useAuth } from "@/lib/contexts/auth.context";
import { PageHeader } from "@/components/ui/page-header";
import { Stack } from "@/components/ui/stack";
import { SectionHeading } from "@/components/ui/section-heading";
import { FormField } from "@/components/ui/form-field";
import { RadioItem } from "@/components/ui/radio-item";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import { ActionButton } from "@/components/ui/action-button";

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
        <PageHeader
          backHref="/admin/admins"
          title="管理者が見つかりません"
          description="指定された管理者IDの情報が見つかりませんでした。"
        />
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
      <PageHeader
        backHref="/admin/admins"
        title="管理者編集"
        description="管理者情報を編集・更新します。"
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <Stack gap="lg">
          <SectionHeading>基本情報</SectionHeading>

          <div className="grid grid-cols-2 gap-6">
            <FormField label="姓" required id="lastName">
              <Input
                placeholder="例: 山田"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </FormField>
            <FormField label="名" required id="firstName">
              <Input
                placeholder="例: 太郎"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="メールアドレス" required id="email">
            <Input
              type="email"
              placeholder="admin@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>
        </Stack>

        <Stack gap="lg">
          <SectionHeading>管理者権限</SectionHeading>

          <div className="grid gap-2">
            <Label>権限 <span className="text-destructive">*</span></Label>
            <RadioGroup
              value={role}
              onValueChange={(v) => setRole(v as AdminRole)}
              disabled={admin.role === "super"}
            >
              <div className="space-y-4">
                <div>
                  <RadioItem
                    value="super"
                    label={ADMIN_ROLE_LABELS.super}
                    disabled={admin.role === "super"}
                  />
                  <p className="text-sm text-muted-foreground ml-6 mt-1">
                    {admin.role === "super"
                      ? "特権管理者の権限は変更できません。"
                      : "すべての機能にアクセスでき、管理者の追加・編集が可能です。"}
                  </p>
                </div>
                <div>
                  <RadioItem value="community_admin" label={ADMIN_ROLE_LABELS.community_admin} />
                  <p className="text-sm text-muted-foreground ml-6 mt-1">
                    担当コミュニティの顧客・イベントのみ管理できます。
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {role === "community_admin" && (
            <div className="grid gap-2">
              <Label>対象コミュニティ <span className="text-destructive">*</span></Label>
              <div className="flex items-center gap-6">
                <CheckboxItem
                  id="scope-audit"
                  label={COMMUNITY_SCOPE_LABELS["ベンチャー監査役の会"]}
                  checked={communityScopes.includes("ベンチャー監査役の会")}
                  onCheckedChange={(checked) =>
                    handleCommunityScopeChange("ベンチャー監査役の会", checked)
                  }
                />
                <CheckboxItem
                  id="scope-naikan"
                  label={COMMUNITY_SCOPE_LABELS["ないかんMeetup"]}
                  checked={communityScopes.includes("ないかんMeetup")}
                  onCheckedChange={(checked) =>
                    handleCommunityScopeChange("ないかんMeetup", checked)
                  }
                />
                <CheckboxItem
                  id="scope-ai"
                  label={COMMUNITY_SCOPE_LABELS["AI部会"]}
                  checked={communityScopes.includes("AI部会")}
                  onCheckedChange={(checked) =>
                    handleCommunityScopeChange("AI部会", checked)
                  }
                />
              </div>
              <p className="text-sm text-muted-foreground">
                複数のコミュニティを選択できます。
              </p>
            </div>
          )}
        </Stack>

        <div className="flex justify-center">
          <ActionButton type="submit">更新</ActionButton>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="border-destructive text-destructive bg-white hover:bg-white hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                削除
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
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
                >
                  キャンセル
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                >
                  削除
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </form>
    </div>
  );
}
