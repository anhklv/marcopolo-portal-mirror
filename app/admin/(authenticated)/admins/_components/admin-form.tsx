"use client";

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
import { PageHeader } from "@/components/ui/page-header";
import { Stack } from "@/components/ui/stack";
import { SectionHeading } from "@/components/ui/section-heading";
import { FormField } from "@/components/ui/form-field";
import { RadioItem } from "@/components/ui/radio-item";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import { ActionButton } from "@/components/ui/action-button";
import { Trash2 } from "lucide-react";
import { ADMIN_ROLE_LABELS } from "@/lib/constants/admin";
import type { CommunityOption } from "@/lib/types/serialized";
import { useAdminForm } from "./use-admin-form";
import type { AdminInitialData } from "./use-admin-form";

// ============================================================
// 型定義
// ============================================================

interface AdminFormProps {
  mode: "create" | "edit";
  initialData?: AdminInitialData;
  communities: CommunityOption[];
}

// ============================================================
// コンポーネント
// ============================================================

export function AdminForm({ mode, initialData, communities }: AdminFormProps) {
  const router = useRouter();
  const form = useAdminForm({ mode, initialData, communities });

  const pageTitle = mode === "create" ? "管理者登録" : "管理者編集";
  const pageDescription =
    mode === "create"
      ? "新しい管理者アカウントを作成します。"
      : "管理者情報を編集・更新します。";
  const submitLabel = mode === "create" ? "登録" : "更新";
  const pendingLabel = mode === "create" ? "登録中..." : "更新中...";

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        backAction={() => router.back()}
        title={pageTitle}
        description={pageDescription}
      />

      {form.generalError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {form.generalError}
        </div>
      )}

      <form onSubmit={form.handleSubmit} className="space-y-8">
        <Stack gap="lg">
          <SectionHeading>基本情報</SectionHeading>

          <div className="grid grid-cols-2 gap-6">
            <FormField
              label="姓"
              required
              id="lastName"
              error={form.fieldErrors["lastName"]?.[0]}
            >
              <Input
                placeholder="例: 山田"
                value={form.lastName}
                onChange={(e) => {
                  form.setLastName(e.target.value);
                  form.clearFieldError("lastName");
                }}
              />
            </FormField>
            <FormField
              label="名"
              required
              id="firstName"
              error={form.fieldErrors["firstName"]?.[0]}
            >
              <Input
                placeholder="例: 太郎"
                value={form.firstName}
                onChange={(e) => {
                  form.setFirstName(e.target.value);
                  form.clearFieldError("firstName");
                }}
              />
            </FormField>
          </div>

          <FormField
            label="メールアドレス"
            required
            id="email"
            error={form.fieldErrors["email"]?.[0]}
          >
            <Input
              type="email"
              placeholder="admin@example.com"
              value={form.email}
              onChange={(e) => {
                form.setEmail(e.target.value);
                form.clearFieldError("email");
              }}
            />
          </FormField>

          {mode === "create" && (
            <>
              <FormField
                label="パスワード"
                required
                id="password"
                description="パスワードは12文字以上で設定してください。"
                error={form.fieldErrors["password"]?.[0]}
              >
                <Input
                  type="password"
                  placeholder="12文字以上"
                  value={form.password}
                  onChange={(e) => {
                    form.setPassword(e.target.value);
                    form.clearFieldError("password");
                  }}
                />
              </FormField>

              <FormField
                label="パスワード（確認）"
                required
                id="passwordConfirm"
                error={form.fieldErrors["passwordConfirm"]?.[0]}
              >
                <Input
                  type="password"
                  placeholder="パスワードを再入力"
                  value={form.passwordConfirm}
                  onChange={(e) => {
                    form.setPasswordConfirm(e.target.value);
                    form.clearFieldError("passwordConfirm");
                  }}
                />
              </FormField>
            </>
          )}
        </Stack>

        <Stack gap="lg">
          <SectionHeading>管理者権限</SectionHeading>

          <div className="grid gap-2">
            <Label>
              権限 <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={form.role}
              onValueChange={(v) => {
                form.setRole(v as "super" | "community_admin");
                form.clearFieldError("role");
                form.clearFieldError("communityIds");
              }}
              disabled={form.isOriginalSuper}
            >
              <div className="space-y-4">
                <div>
                  <RadioItem
                    value="super"
                    label={ADMIN_ROLE_LABELS.super}
                    disabled={form.isOriginalSuper}
                  />
                  <p className="text-sm text-muted-foreground ml-6 mt-1">
                    {form.isOriginalSuper
                      ? "特権管理者の権限は変更できません。"
                      : "すべての機能にアクセスでき、管理者の追加・編集が可能です。"}
                  </p>
                </div>
                <div>
                  <RadioItem
                    value="community_admin"
                    label={ADMIN_ROLE_LABELS.community_admin}
                  />
                  <p className="text-sm text-muted-foreground ml-6 mt-1">
                    担当コミュニティの顧客・イベントのみ管理できます。
                  </p>
                </div>
              </div>
            </RadioGroup>
            {form.fieldErrors["role"]?.[0] && (
              <p className="text-sm text-destructive">
                {form.fieldErrors["role"][0]}
              </p>
            )}
          </div>

          {form.role === "community_admin" && (
            <div className="grid gap-2">
              <Label>
                対象コミュニティ <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-6">
                {communities.map((community) => (
                  <CheckboxItem
                    key={community.id}
                    id={`scope-${community.code}`}
                    label={community.name}
                    checked={form.communityIds.includes(community.id)}
                    onCheckedChange={(checked) =>
                      form.handleCommunityToggle(community.id, checked)
                    }
                  />
                ))}
              </div>
              {form.fieldErrors["communityIds"]?.[0] && (
                <p className="text-sm text-destructive">
                  {form.fieldErrors["communityIds"][0]}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                複数のコミュニティを選択できます。
              </p>
            </div>
          )}
        </Stack>

        <div className="flex justify-center">
          <ActionButton type="submit" disabled={form.isPending}>
            {form.isPending ? pendingLabel : submitLabel}
          </ActionButton>
        </div>

        {mode === "edit" && initialData && (
          <div className="flex justify-end pt-4 border-t">
            <Dialog
              open={form.isDeleteDialogOpen}
              onOpenChange={form.setIsDeleteDialogOpen}
            >
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
                    {initialData.lastName}
                    {initialData.firstName}（{initialData.email}
                    ）を削除してもよろしいですか？
                    <br />
                    この操作は取り消せません。
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => form.setIsDeleteDialogOpen(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={form.handleDelete}
                    disabled={form.isPending}
                  >
                    {form.isPending ? "削除中..." : "削除"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </form>
    </div>
  );
}
