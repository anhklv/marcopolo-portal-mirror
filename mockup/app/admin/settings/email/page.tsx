"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/stack";
import { FormField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { ActionButton } from "@/components/ui/action-button";
import { toast } from "sonner";

export default function EmailSettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("新しいメールアドレスを入力してください");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("有効なメールアドレスを入力してください");
      return;
    }

    setIsSubmitting(true);

    // TODO: 実際のAPI呼び出しを実装
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("メールアドレスを変更しました");
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
        title="ログインID変更"
        description="ログインに使用するメールアドレスを変更します。"
      />

      <div className="rounded-lg border bg-card shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            <FormField
              label="新しいメールアドレス"
              required
              description="ログイン時に使用するメールアドレスを入力してください。テストメールの送信先にもなります。"
            >
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </FormField>

            <div className="flex justify-center gap-4">
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                キャンセル
              </ActionButton>
              <ActionButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? "変更中..." : "変更する"}
              </ActionButton>
            </div>
          </Stack>
        </form>
      </div>
    </Stack>
  );
}
