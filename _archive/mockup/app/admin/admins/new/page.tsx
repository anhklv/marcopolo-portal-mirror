"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { toast } from "sonner";
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

export default function NewAdminPage() {
  const router = useRouter();
  const { currentAdmin } = useAuth();

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("community_admin");
  const [communityScopes, setCommunityScopes] = useState<CommunityScope[]>([]);

  // 特権管理者のみアクセス可能
  useEffect(() => {
    if (currentAdmin?.role !== "super") {
      toast.error("この機能は特権管理者のみ利用できます");
      router.push("/admin/customers");
    }
  }, [currentAdmin, router]);

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
    if (!lastName || !firstName || !email || !password) {
      toast.error("すべての必須項目を入力してください");
      return;
    }

    if (password.length < 12) {
      toast.error("パスワードは12文字以上で入力してください");
      return;
    }

    if (role === "community_admin" && communityScopes.length === 0) {
      toast.error("対象コミュニティを1つ以上選択してください");
      return;
    }

    toast.success("管理者を登録しました");
    router.push("/admin/admins");
  };

  if (currentAdmin?.role !== "super") {
    return null;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        backHref="/admin/admins"
        title="管理者登録"
        description="新しい管理者アカウントを作成します。"
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

          <FormField
            label="パスワード"
            required
            id="password"
            description="パスワードは12文字以上で設定してください。"
          >
            <Input
              type="password"
              placeholder="12文字以上"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormField>
        </Stack>

        <Stack gap="lg">
          <SectionHeading>管理者権限</SectionHeading>

          <div className="grid gap-2">
            <Label>権限 <span className="text-destructive">*</span></Label>
            <RadioGroup value={role} onValueChange={(v) => setRole(v as AdminRole)}>
              <div className="space-y-4">
                <div>
                  <RadioItem value="super" label={ADMIN_ROLE_LABELS.super} />
                  <p className="text-sm text-muted-foreground ml-6 mt-1">
                    すべての機能にアクセスでき、管理者の追加・編集が可能です。
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
          <ActionButton type="submit">登録</ActionButton>
        </div>
      </form>
    </div>
  );
}
