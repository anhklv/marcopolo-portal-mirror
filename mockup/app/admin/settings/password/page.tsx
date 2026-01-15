"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">パスワード変更</h1>
          <p className="text-muted-foreground">
            ログインに使用するパスワードを変更します。
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">現在のパスワード</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">新しいパスワード</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              12文字以上で入力してください。
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              確認のため、新しいパスワードを再度入力してください。
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button type="submit" variant="outline" disabled={isSubmitting}>
              {isSubmitting ? "変更中..." : "変更する"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

