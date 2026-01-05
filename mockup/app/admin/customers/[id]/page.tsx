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
import { MEMBER_TYPE_LABELS, GENDER_LABELS } from "@/lib/constants/common";
import { use } from "react";
import React from "react";
import { formatEventDate } from "@/lib/utils";

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

  // この顧客のRSVPデータを取得（重複を除去）
  const customerRsvps = rsvps.filter((r) => r.customerId === id);
  
  // イベントIDで重複を除去（同じイベントIDの場合は最初のRSVPのみを使用）
  const uniqueRsvps = customerRsvps.reduce((acc, rsvp) => {
    if (!acc.find((r) => r.eventId === rsvp.eventId)) {
      acc.push(rsvp);
    }
    return acc;
  }, [] as typeof customerRsvps);
  
  // イベント情報とRSVP情報を結合
  const eventList = uniqueRsvps.map((rsvp) => {
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

      {/* 会員情報 */}
      <Card>
        <CardHeader>
          <CardTitle>会員情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">会員区分</p>
              <div className="flex gap-2 flex-wrap items-center">
                {(() => {
                  const badges: React.ReactElement[] = [];
                  
                  // 非会員の判定（memberTypesが空配列）
                  if (customer.memberTypes.length === 0) {
                    badges.push(
                      <Badge key="non-member" variant="secondary" className="text-base px-3 py-1">
                        非会員
                      </Badge>
                    );
                  } else if (customer.memberCategory === "member") {
                    const hasAudit = customer.memberTypes.includes("ベンチャー監査役協会");
                    const hasNaikan = customer.memberTypes.includes("ないかんMeetup");
                    
                    if (hasNaikan && !hasAudit) {
                      badges.push(
                        <Badge key="naikan-member" variant="default" className="text-base px-3 py-1">
                          ないかんMeetup(会員)
                        </Badge>
                      );
                    } else if (hasAudit && !hasNaikan) {
                      const auditType = customer.auditMemberType === "regular" ? "正会員" : "オンライン会員";
                      badges.push(
                        <Badge key="audit-member" variant="default" className="text-base px-3 py-1">
                          ベンチャー監査役協会({auditType})
                        </Badge>
                      );
                    } else if (hasAudit && hasNaikan) {
                      const auditType = customer.auditMemberType === "regular" ? "正会員" : "オンライン会員";
                      badges.push(
                        <Badge key="audit-member" variant="default" className="text-base px-3 py-1">
                          ベンチャー監査役協会({auditType})
                        </Badge>
                      );
                      badges.push(
                        <Badge key="naikan-member" variant="default" className="text-base px-3 py-1">
                          ないかんMeetup(会員)
                        </Badge>
                      );
                    }
                    
                    // プレミアム会員バッジ
                    if (customer.auditMemberPremium) {
                      badges.push(
                        <Badge key="premium" variant="default" className="text-xs px-2 py-0.5 bg-slate-600 hover:bg-slate-700 text-white">
                          プレミアム
                        </Badge>
                      );
                    }
                  } else if (customer.memberCategory === "sponsor") {
                    if (customer.memberTypes.includes("ないかんMeetup")) {
                      badges.push(
                        <Badge key="sponsor-naikan" variant="default" className="text-base px-3 py-1">
                          ないかんMeetup(スポンサー)
                        </Badge>
                      );
                    }
                    if (customer.memberTypes.includes("ベンチャー監査役協会")) {
                      badges.push(
                        <Badge key="sponsor-audit" variant="default" className="text-base px-3 py-1">
                          ベンチャー監査役協会(スポンサー)
                        </Badge>
                      );
                    }
                  } else if (customer.memberCategory === "observer") {
                    if (customer.memberTypes.includes("ないかんMeetup")) {
                      badges.push(
                        <Badge key="observer-naikan" variant="default" className="text-base px-3 py-1">
                          ないかんMeetup(オブザーバー)
                        </Badge>
                      );
                    }
                    if (customer.memberTypes.includes("ベンチャー監査役協会")) {
                      badges.push(
                        <Badge key="observer-audit" variant="default" className="text-base px-3 py-1">
                          ベンチャー監査役協会(オブザーバー)
                        </Badge>
                      );
                    }
                  }
                  
                  return badges.length > 0 ? badges : null;
                })()}
              </div>
            </div>
            {customer.memberCategory === "member" && customer.memberType && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">会員種別</p>
                <p className="text-base">{MEMBER_TYPE_LABELS[customer.memberType]}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
          {customer.subEmails && customer.subEmails.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">サブメールアドレス</p>
              <div className="space-y-1">
                {customer.subEmails.map((subEmail, index) => (
                  <p key={index} className="text-base">{subEmail}</p>
                ))}
              </div>
            </div>
          )}
          {customer.company && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">会社名・所属</p>
              <p className="text-base">{customer.company}</p>
            </div>
          )}
          {(customer.postalCode || customer.prefecture || customer.city) && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">住所</p>
              <p className="text-base">
                {customer.postalCode && `〒${customer.postalCode} `}
                {customer.prefecture}
                {customer.city && ` ${customer.city}`}
              </p>
            </div>
          )}
          {customer.gender && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">性別</p>
              <p className="text-base">{GENDER_LABELS[customer.gender]}</p>
            </div>
          )}
          {customer.listingCategory && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">上場区分</p>
              <p className="text-base">{customer.listingCategory}</p>
            </div>
          )}
          {customer.originIndustry && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">出身業種</p>
              <p className="text-base">{customer.originIndustry}</p>
            </div>
          )}
          {customer.membershipQualification && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">入会資格</p>
              <p className="text-base">{customer.membershipQualification}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">ステータス</p>
              <Badge
                variant={customer.status === "active" ? "default" : "secondary"}
                className="text-base"
              >
                {customer.status === "active" ? "アクティブ" : "非アクティブ"}
              </Badge>
            </div>
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
