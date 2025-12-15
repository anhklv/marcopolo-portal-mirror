"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Edit, Calendar } from "lucide-react";
import { customers, events, rsvps } from "@/lib/data/mock";
import { use } from "react";
import { formatEventDate } from "@/lib/utils";

// 会員区分の表示名を短縮する関数
const getMemberTypeDisplayName = (type: string): string => {
  const mapping: Record<string, string> = {
    "監査役協会会員": "監査役協会",
    "ないかんMeetup会員": "ないかんMeetup",
    "監査役協会会員・ないかんMeetup会員": "監査役協会・ないかんMeetup",
    "非会員": "非会員",
  };
  return mapping[type] || type;
};

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const customer = customers.find((c) => c.id === id);

  if (!customer) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">顧客が見つかりません</h1>
            <p className="text-muted-foreground">
              指定された顧客IDの情報が見つかりませんでした。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // この顧客のRSVPデータを取得
  const customerRsvps = rsvps.filter((r) => r.customerId === id);
  
  // イベント情報とRSVP情報を結合
  const eventList = customerRsvps.map((rsvp) => {
    const event = events.find((e) => e.id === rsvp.eventId);
    if (!event) return null;
    return {
      ...event,
      rsvpStatus: rsvp.status,
      respondedAt: rsvp.respondedAt,
    };
  }).filter((e): e is NonNullable<typeof e> => e !== null);

  // 日付でソート（未来のイベントが先）
  const sortedEvents = eventList.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  // 参加済みと参加予定に分類
  const now = new Date();
  const pastEvents = sortedEvents.filter((e) => new Date(e.date) < now);
  const upcomingEvents = sortedEvents.filter((e) => new Date(e.date) >= now);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">顧客詳細</h1>
            <p className="text-muted-foreground">
              {customer.name}さんの詳細情報
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/admin/customers/${id}/edit`}>
            <Edit className="h-4 w-4" />
            編集
          </Link>
        </Button>
      </div>

      {/* 顧客プロフィール */}
      <Card>
        <CardHeader>
          <CardTitle>プロフィール</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">氏名</p>
              <p className="text-base">{customer.name}</p>
            </div>
            {customer.nameKana && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">セイメイ</p>
                <p className="text-base">{customer.nameKana}</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">メールアドレス</p>
              <p className="text-base">{customer.email}</p>
            </div>
            {customer.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">電話番号</p>
                <p className="text-base">{customer.phone}</p>
              </div>
            )}
          </div>
          {customer.company && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">会社名・所属</p>
              <p className="text-base">{customer.company}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">会員区分</p>
              <Badge
                variant={customer.type === "非会員" ? "secondary" : "default"}
                className="text-base"
              >
                {getMemberTypeDisplayName(customer.type)}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ステータス</p>
              <Badge
                variant={customer.status === "active" ? "default" : "secondary"}
                className="text-base"
              >
                {customer.status === "active" ? "アクティブ" : "非アクティブ"}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">登録日</p>
              <p className="text-base">{customer.registeredAt}</p>
            </div>
          </div>
          {customer.note && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">備考</p>
              <p className="text-base">{customer.note}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 開催予定のイベント */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              開催予定のイベント
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>イベント名</TableHead>
                    <TableHead>開催日時</TableHead>
                    <TableHead>場所</TableHead>
                    <TableHead>回答状況</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="hover:underline"
                        >
                          {event.title}
                        </Link>
                      </TableCell>
                      <TableCell>{formatEventDate(event.date)}</TableCell>
                      <TableCell>{event.location}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            event.rsvpStatus === "参加"
                              ? "default"
                              : event.rsvpStatus === "不参加"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {event.rsvpStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 過去のイベント */}
      {pastEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              過去のイベント
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>イベント名</TableHead>
                    <TableHead>開催日時</TableHead>
                    <TableHead>場所</TableHead>
                    <TableHead>参加状況</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="hover:underline"
                        >
                          {event.title}
                        </Link>
                      </TableCell>
                      <TableCell>{formatEventDate(event.date)}</TableCell>
                      <TableCell>{event.location}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            event.rsvpStatus === "参加"
                              ? "default"
                              : event.rsvpStatus === "不参加"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {event.rsvpStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {eventList.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              参加予定・参加済みのイベントはありません。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
