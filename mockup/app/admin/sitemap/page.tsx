import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, LayoutDashboard, Users, Calendar, UserCheck } from "lucide-react";

export default function SitemapPage() {
  const adminPages = [
    {
      title: "ダッシュボード",
      href: "/admin",
      icon: LayoutDashboard,
      status: "実装済み",
    },
    {
      title: "顧客一覧",
      href: "/admin/customers",
      icon: Users,
      status: "実装済み",
    },
    {
      title: "顧客登録",
      href: "/admin/customers/new",
      icon: Users,
      status: "実装済み",
    },
    {
      title: "イベント一覧",
      href: "/admin/events",
      icon: Calendar,
      status: "実装済み",
    },
    {
      title: "イベント詳細・管理",
      href: "/admin/events/E001",
      icon: Calendar,
      status: "実装済み",
    },
  ];

  const userPages = [
    {
      title: "参加回答フォーム",
      href: "/events/E001/rsvp",
      icon: UserCheck,
      status: "実装済み",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">画面一覧</h1>
        <p className="text-muted-foreground">
          各画面へのクイックアクセス用リンク集です。（本番環境には不要なページです）
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5" />
              管理者画面
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {adminPages.map((page) => (
              <Link key={page.href} href={page.href}>
                <div className="flex items-start justify-between rounded-lg border p-4 hover:bg-accent transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <page.icon className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">{page.title}</h3>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        {page.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{page.href}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-2" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              ユーザー回答画面
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userPages.map((page) => (
              <Link key={page.href} href={page.href} target="_blank">
                <div className="flex items-start justify-between rounded-lg border p-4 hover:bg-accent transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <page.icon className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">{page.title}</h3>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        {page.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{page.href}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-2" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
