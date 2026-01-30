"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { DataItem } from "@/components/ui/data-item";
import { Stack } from "@/components/ui/stack";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Edit, Calendar, Trash2 } from "lucide-react";
import { customers, events, rsvps } from "@/lib/data/mock";
import { CONTRACT_TYPE_LABELS, GENDER_LABELS } from "@/lib/constants/common";
import { use, useState } from "react";
import React from "react";
import { formatEventDate, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const customer = customers.find((c) => c.id === id);

  if (!customer) {
    return (
      <div className="max-w-4xl space-y-6">
        <PageHeader
          backHref="/admin/customers"
          title="顧客が見つかりません"
          description="指定された顧客IDの情報が見つかりませんでした。"
        />
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

  const handleDelete = () => {
    toast.success("顧客を削除しました");
    setIsDeleteDialogOpen(false);
    router.push("/admin/customers");
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          backHref="/admin/customers"
          title="顧客詳細"
          description={`${customer.name}さんの詳細情報`}
        />
        <Button variant="outline" asChild>
          <Link href={`/admin/customers/${id}/edit`}>
            <Edit className="h-4 w-4" />
            編集
          </Link>
        </Button>
      </div>

      {/* 会員情報 */}
      <Card>
        <CardContent>
          <Stack gap="lg">
            <SectionHeading>会員情報</SectionHeading>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">コミュニティ</p>
              <div className="flex gap-2 flex-wrap items-center">
                {(() => {
                  const badges: React.ReactElement[] = [];
                  
                  // 非会員の判定（communitiesが空配列）
                  if (customer.communities.length === 0) {
                    badges.push(
                      <Badge key="non-member" variant="secondary">
                        非会員
                      </Badge>
                    );
                  } else {
                    if (customer.communities.includes("ベンチャー監査役の会")) {
                      badges.push(
                        <Badge key="audit" variant="default">
                          ベンチャー監査役の会
                        </Badge>
                      );
                    }
                    if (customer.communities.includes("ないかんMeetup")) {
                      badges.push(
                        <Badge key="naikan" variant="default">
                          ないかんMeetup
                        </Badge>
                      );
                    }
                    
                    // プレミアム会員バッジ
                    if (customer.auditMemberPremium) {
                      badges.push(
                        <Badge key="premium" variant="premium">
                          プレミアム
                        </Badge>
                      );
                    }
                  }
                  
                  return badges.length > 0 ? badges : null;
                })()}
              </div>
            </div>
            {customer.memberCategory === "member" && customer.contractType && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">契約主体</p>
                <p className="text-base">{CONTRACT_TYPE_LABELS[customer.contractType]}</p>
              </div>
            )}
            <DataItem label="登録日">{formatDate(customer.registeredAt)}</DataItem>
            </div>

            {/* ベンチャー監査役の会 詳細 */}
            {customer.communities.includes("ベンチャー監査役の会") && (
              <div className="rounded-lg border p-4 space-y-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-base">ベンチャー監査役の会</Label>
                  {customer.memberCategory === "member" && customer.auditMemberType && (
                    <Badge variant="outline">
                      {customer.auditMemberType === "regular" ? "正会員" : "オンライン会員"}
                    </Badge>
                  )}
                  {customer.memberCategory === "sponsor" && (
                    <Badge variant="outline">スポンサー</Badge>
                  )}
                  {customer.memberCategory === "observer" && (
                    <Badge variant="outline">オブザーバー</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {customer.membershipQualification && (
                    <DataItem label="入会資格">{customer.membershipQualification}</DataItem>
                  )}
                  {customer.originIndustry && (
                    <DataItem label="出身業種">{customer.originIndustry}</DataItem>
                  )}
                  {customer.auditJoinedAt && (
                    <DataItem label="入会日">{formatDate(customer.auditJoinedAt)}</DataItem>
                  )}
                  {customer.auditResignedAt && (
                    <DataItem label="脱退日">{formatDate(customer.auditResignedAt)}</DataItem>
                  )}
                </div>
              </div>
            )}

          {/* ないかんMeetup 詳細 */}
          {customer.communities.includes("ないかんMeetup") && (
            <div className="rounded-lg border p-4 space-y-4 bg-slate-50">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-base">ないかんMeetup</Label>
                {customer.memberCategory === "member" && (
                  <Badge variant="outline">会員</Badge>
                )}
                {customer.memberCategory === "sponsor" && (
                  <Badge variant="outline">スポンサー</Badge>
                )}
                {customer.memberCategory === "observer" && (
                  <Badge variant="outline">オブザーバー</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-6">
                  {customer.naikanAffiliation && (
                    <DataItem label="所属">{customer.naikanAffiliation}</DataItem>
                  )}
                  {customer.naikanJoinedAt && (
                    <DataItem label="入会日">{formatDate(customer.naikanJoinedAt)}</DataItem>
                  )}
                  {customer.naikanResignedAt && (
                    <DataItem label="脱退日">{formatDate(customer.naikanResignedAt)}</DataItem>
                  )}
                </div>
              </div>
            )}

            {/* AI部会 詳細 */}
            {customer.communities.includes("AI部会") && (
              <div className="rounded-lg border p-4 space-y-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-base">AI部会</Label>
                  {customer.memberCategory === "member" && (
                    <Badge variant="outline">会員</Badge>
                  )}
                  {customer.memberCategory === "sponsor" && (
                    <Badge variant="outline">スポンサー</Badge>
                  )}
                  {customer.memberCategory === "observer" && (
                    <Badge variant="outline">オブザーバー</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {(customer as any).aiAffiliation && (
                    <DataItem label="所属">{(customer as any).aiAffiliation}</DataItem>
                  )}
                  {(customer as any).aiJoinedAt && (
                    <DataItem label="入会日">{formatDate((customer as any).aiJoinedAt)}</DataItem>
                  )}
                  {(customer as any).aiResignedAt && (
                    <DataItem label="脱退日">{formatDate((customer as any).aiResignedAt)}</DataItem>
                  )}
                </div>
              </div>
            )}

            {/* プロフィール */}
            <SectionHeading>プロフィール</SectionHeading>
            <div className="grid grid-cols-2 gap-6">
              <DataItem label="氏名">{customer.name}</DataItem>
              {customer.nameKana ? (
                <DataItem label="セイメイ">{customer.nameKana}</DataItem>
              ) : (
                <div></div>
              )}
              <DataItem label="メールアドレス">{customer.email}</DataItem>
              {customer.phone ? (
                <DataItem label="電話番号">{customer.phone}</DataItem>
              ) : (
                <div></div>
              )}
              {customer.subEmails && customer.subEmails.length > 0 && (
                <DataItem label="サブメールアドレス">
                  <div className="space-y-1">
                    {customer.subEmails.map((subEmail, index) => (
                      <p key={index}>{subEmail}</p>
                    ))}
                  </div>
                </DataItem>
              )}
              {customer.company && (
                <DataItem label="会社名">{customer.company}</DataItem>
              )}
              {customer.listingCategory && (
                <DataItem label="上場区分">{customer.listingCategory}</DataItem>
              )}
              {(customer.postalCode || customer.prefecture || customer.city) && (
                <DataItem label="住所">
                  {customer.postalCode && <div>〒{customer.postalCode}</div>}
                  {customer.prefecture && (
                    <div>
                      {customer.prefecture}
                      {customer.city && customer.city}
                    </div>
                  )}
                </DataItem>
              )}
              {customer.gender && (
                <DataItem label="性別">{GENDER_LABELS[customer.gender]}</DataItem>
              )}
              {customer.note && (
                <DataItem label="備考">{customer.note}</DataItem>
              )}
            </div>
          </Stack>
        </CardContent>
      </Card>

      {/* イベント参加履歴 */}
      <Card>
        <CardContent className="space-y-6">
          {upcomingEvents.length > 0 || pastEvents.length > 0 ? (
            <>
              {upcomingEvents.length > 0 && (
                <>
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      開催予定のイベント
                    </h2>
                    <Separator className="mt-2" />
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>イベント種別</TableHead>
                          <TableHead>イベント名</TableHead>
                          <TableHead>開催日時</TableHead>
                          <TableHead>回答状況</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upcomingEvents.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell>
                              <Badge variant="outline">
                                {event.eventType}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              <Link
                                href={`/admin/events/${event.id}`}
                                className="hover:underline"
                              >
                                {event.title}
                              </Link>
                            </TableCell>
                            <TableCell>{formatEventDate(event.date)}</TableCell>
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
                </>
              )}

              {pastEvents.length > 0 && (
                <>
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      過去のイベント
                    </h2>
                    <Separator className="mt-2" />
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>イベント種別</TableHead>
                          <TableHead>イベント名</TableHead>
                          <TableHead>開催日時</TableHead>
                          <TableHead>参加状況</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pastEvents.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell>
                              <Badge variant="outline">
                                {event.eventType}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              <Link
                                href={`/admin/events/${event.id}`}
                                className="hover:underline"
                              >
                                {event.title}
                              </Link>
                            </TableCell>
                            <TableCell>{formatEventDate(event.date)}</TableCell>
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
                </>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              参加予定・参加済みのイベントはありません。
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4 border-t">
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              className="cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              削除
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>顧客を削除</DialogTitle>
              <DialogDescription>
                この顧客を削除してもよろしいですか？この操作は取り消せません。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="cursor-pointer"
              >
                キャンセル
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="cursor-pointer text-destructive hover:text-destructive"
              >
                削除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
