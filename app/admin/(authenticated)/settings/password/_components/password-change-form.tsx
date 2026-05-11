"use client";

import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { FormField } from "@/components/ui/form-field";
import { ActionButton } from "@/components/ui/action-button";
import { usePasswordChangeForm } from "./use-password-change-form";

export function PasswordChangeForm() {
  const form = usePasswordChangeForm();

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        backHref="/admin/customers"
        title="パスワード変更"
        description="ログインに使用するパスワードを変更します。"
      />

      {form.generalError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {form.generalError}
        </div>
      )}

      <form onSubmit={form.handleSubmit} className="max-w-2xl space-y-8">
        <FormField
          label="現在のパスワード"
          required
          id="currentPassword"
          error={form.fieldErrors["currentPassword"]?.[0]}
        >
          <Input
            type="password"
            placeholder="現在のパスワードを入力"
            value={form.currentPassword}
            onChange={(e) => {
              form.setCurrentPassword(e.target.value);
              form.clearFieldError("currentPassword");
            }}
          />
        </FormField>

        <FormField
          label="新しいパスワード"
          required
          id="newPassword"
          description="パスワードは12文字以上で設定してください。"
          error={form.fieldErrors["newPassword"]?.[0]}
        >
          <Input
            type="password"
            placeholder="12文字以上"
            value={form.newPassword}
            onChange={(e) => {
              form.setNewPassword(e.target.value);
              form.clearFieldError("newPassword");
            }}
          />
        </FormField>

        <FormField
          label="新しいパスワード（確認）"
          required
          id="newPasswordConfirm"
          description="確認のためもう一度入力してください。"
          error={form.fieldErrors["newPasswordConfirm"]?.[0]}
        >
          <Input
            type="password"
            placeholder="新しいパスワードを再入力"
            value={form.newPasswordConfirm}
            onChange={(e) => {
              form.setNewPasswordConfirm(e.target.value);
              form.clearFieldError("newPasswordConfirm");
            }}
          />
        </FormField>

        <div className="flex justify-center">
          <ActionButton type="submit" disabled={form.isPending}>
            {form.isPending ? "変更中..." : "変更"}
          </ActionButton>
        </div>
      </form>
    </div>
  );
}
