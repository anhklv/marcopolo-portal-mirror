import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, ArrowRight } from "lucide-react";
import { customers, events } from "@/lib/data/mock";

export default function DashboardPage() {
  const upcomingEvents = events.filter((e) => e.status === "open" || e.status === "waiting");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総顧客数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}名</div>
            <p className="text-xs text-muted-foreground">
              +2名 (今月)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">開催予定イベント</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}件</div>
            <p className="text-xs text-muted-foreground">
              直近のイベント: {upcomingEvents[0]?.title}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>直近のイベント</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{event.title}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {event.date} @ {event.location}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <div className="text-sm font-medium whitespace-nowrap">
                    参加: {event.attendeesCount}名
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/events/${event.id}`}>詳細</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
              <Button variant="ghost" className="w-full" asChild>
                  <Link href="/admin/events" className="flex items-center gap-2">
                      すべてのイベントを見る <ArrowRight className="h-4 w-4" />
                  </Link>
              </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
