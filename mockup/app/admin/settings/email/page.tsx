"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function EmailSettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("メールアドレスを入力してください");
      return;
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("正しいメールアドレスを入力してください");
      return;
    }

    setIsSubmitting(true);
    
    // TODO: 実際のAPI呼び出しを実装
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("ログインID（メールアドレス）を変更しました");
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
          <h1 className="text-3xl font-bold tracking-tight">ログインID変更</h1>
          <p className="text-muted-foreground">
            ログインに使用するメールアドレスを変更します。
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">新しいメールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              ログイン時に使用するメールアドレスを入力してください。
            </p>
            <p className="text-sm text-muted-foreground">
              テストメールの送信先にもなります。
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

