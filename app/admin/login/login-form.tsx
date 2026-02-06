"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/stack";
import { FormField } from "@/components/ui/form-field";
import { ActionButton } from "@/components/ui/action-button";
import { loginAction } from "@/lib/actions/auth";
import { toast } from "sonner";

interface LoginFormProps {
  debugMode: boolean;
}

export function LoginForm({ debugMode }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("メールアドレスとパスワードを入力してください");
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginAction(email, password);

      if (result.success) {
        toast.success("ログインしました");
        router.push("/admin");
      } else {
        toast.error(result.error ?? "ログインに失敗しました");
      }
    } catch {
      toast.error("ログイン中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <Stack gap="xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Marcopolo Admin</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              管理者ログイン
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Stack gap="lg">
              <FormField label="メールアドレス">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </FormField>

              <FormField label="パスワード">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </FormField>

              <ActionButton type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "ログイン中..." : "ログイン"}
              </ActionButton>
            </Stack>
          </form>

          {debugMode && (
            <div className="text-center text-sm text-muted-foreground">
              <p>開発用アカウント:</p>
              <p className="mt-1">admin@example.com / password12345</p>
            </div>
          )}
        </Stack>
      </div>
    </div>
  );
}
