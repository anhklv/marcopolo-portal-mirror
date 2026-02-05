"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/stack";
import { FormField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { ActionButton } from "@/components/ui/action-button";
import { toast } from "sonner";

export default function PasswordSettingsPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword) {
      toast.error("現在のパスワードを入力してください");
      return;
    }

    if (!newPassword) {
      toast.error("新しいパスワードを入力してください");
      return;
    }

    if (newPassword.length < 12) {
      toast.error("新しいパスワードは12文字以上で入力してください");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("新しいパスワードと確認用パスワードが一致しません");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("現在のパスワードと新しいパスワードが同じです");
      return;
    }

    setIsSubmitting(true);
    
    // TODO: 実際のAPI呼び出しを実装
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("パスワードを変更しました");
      router.push("/admin/customers");
    } catch (error) {
      toast.error("変更に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack gap="lg">
      <PageHeader
        backHref="/admin/customers"
        title="パスワード変更"
        description="ログインに使用するパスワードを変更します。"
      />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <Stack gap="lg">
          <FormField label="現在のパスワード" required>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </FormField>

          <FormField
            label="新しいパスワード"
            required
            description="12文字以上で入力してください。"
          >
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </FormField>

          <FormField
            label="新しいパスワード（確認）"
            required
            description="確認のため、新しいパスワードを再度入力してください。"
          >
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </FormField>

          <div className="flex justify-center">
            <ActionButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "変更中..." : "変更する"}
            </ActionButton>
          </div>
        </Stack>
      </form>
    </Stack>
  );
}

