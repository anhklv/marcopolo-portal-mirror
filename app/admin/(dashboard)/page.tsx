import { auth } from "@/lib/auth/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-sm text-muted-foreground">
          {session?.user?.lastName} {session?.user?.firstName} さん、ようこそ
        </p>
      </div>
      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-muted-foreground">
          ダッシュボードの内容はフェーズ2以降で実装されます。
        </p>
      </div>
    </div>
  );
}
