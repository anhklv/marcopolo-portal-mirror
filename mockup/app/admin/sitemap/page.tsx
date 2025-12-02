import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, LayoutDashboard, Users, Calendar, UserCheck } from "lucide-react";

export default function SitemapPage() {
  const adminPages = [
    {
      title: "ダッシュボード",
      description: "システムの概要と直近のイベント一覧",
      href: "/admin",
      icon: LayoutDashboard,
      status: "実装済み",
    },
    {
      title: "顧客一覧",
      description: "顧客（会員・非会員）の一覧表示、検索",
      href: "/admin/customers",
      icon: Users,
      status: "実装済み",
    },
    {
      title: "顧客登録",
      description: "新規顧客情報の登録フォーム",
      href: "/admin/customers/new",
      icon: Users,
      status: "実装済み",
    },
    {
      title: "イベント一覧",
      description: "過去・現在・未来のイベント一覧",
      href: "/admin/events",
      icon: Calendar,
      status: "実装済み",
    },
    {
      title: "イベント詳細・管理",
      description: "イベントの詳細、参加状況、招待送信",
      href: "/admin/events/E001",
      icon: Calendar,
      status: "実装済み",
    },
  ];

  const userPages = [
    {
      title: "参加回答フォーム",
      description: "招待された顧客が参加可否を回答",
      href: "/events/E001/rsvp",
      icon: UserCheck,
      status: "実装済み",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">サイトマップ</h1>
        <p className="text-muted-foreground">
          システムの画面構成と遷移フローです。各画面をクリックして確認できます。
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5" />
              管理者画面
            </CardTitle>
            <CardDescription>
              管理者が使用する管理画面です。サイドバーから各画面にアクセスできます。
            </CardDescription>
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
                    <p className="text-sm text-muted-foreground">{page.description}</p>
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
            <CardDescription>
              招待された顧客が使用する回答画面です。個別ID付きURLでアクセスします。
            </CardDescription>
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
                    <p className="text-sm text-muted-foreground">{page.description}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{page.href}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-2" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>画面遷移フロー</CardTitle>
          <CardDescription>
            主要な画面遷移の流れです。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">管理者フロー</h4>
              <div className="text-sm space-y-1">
                <div>ダッシュボード → サイドバーから各画面へ</div>
                <div>顧客一覧 → 新規登録ボタン → 顧客登録</div>
                <div>イベント一覧 → イベントを選択 → イベント詳細</div>
                <div>イベント詳細 → 招待・追送タブ → 顧客選択 → 送信</div>
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">ユーザー回答フロー</h4>
              <div className="text-sm space-y-1">
                <div>メール受信 → URLクリック → 回答フォーム</div>
                <div>参加・不参加選択 → 送信 → 完了画面</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>注意事項</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>• このモックアップは画面遷移とUIの確認用です</li>
            <li>• 実際のデータベース連携やメール送信機能は未実装です</li>
            <li>• フォーム送信やボタンクリックによる変更は、ページをリロードすると元に戻ります</li>
            <li>• 詳細は <code className="bg-muted px-1 rounded">mockup/README.md</code> を参照してください</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

