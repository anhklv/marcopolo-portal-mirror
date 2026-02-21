"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { Edit, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CONTRACT_TYPE_LABELS, GENDER_LABELS, JOB_CHANGE_INTENT_LABELS } from "@/lib/constants/customer";
import { USER_ROLE_CONFIG, AUDIT_MEMBER_TYPES } from "@/lib/constants/customer";
import { RSVP_STATUS_CONFIG } from "@/lib/constants/event";
import { deleteCustomerAction } from "@/lib/actions/customer.actions";
import { toast } from "sonner";
import { getCustomerBadges, classifyEvents } from "@/lib/helpers/customer-detail";
import { COMMUNITY_CODE } from "@/lib/constants/community";
import type { RsvpEvent } from "@/lib/helpers/customer-detail";
import type { SerializedCustomerDetail } from "@/lib/types/serialized";

// ============================================================
// 型定義
// ============================================================

interface CustomerDetailProps {
  customer: SerializedCustomerDetail;
}

// ============================================================
// コンポーネント
// ============================================================

export function CustomerDetail({ customer }: CustomerDetailProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const badges = getCustomerBadges(
    customer.customerCommunities,
    customer.memberCategory
  );

  // イベント参加履歴
  const rsvpEvents: RsvpEvent[] = customer.rsvps.map((r) => ({
    eventId: r.event.id,
    eventTitle: r.event.title,
    eventDate: r.event.date,
    communityName: "",
    status: r.status,
  }));
  const { upcoming: upcomingEvents, past: pastEvents } = classifyEvents(rsvpEvents);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteCustomerAction(customer.id);
        if (result?.error) {
          toast.error(result.error);
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
          return;
        }
        toast.error("削除に失敗しました");
      }
    });
  };

  // コミュニティ別詳細
  const auditCommunity = customer.customerCommunities.find(
    (cc) => cc.community.code === COMMUNITY_CODE.VENTURE_AUDITOR
  );
  const naikanCommunity = customer.customerCommunities.find(
    (cc) => cc.community.code === COMMUNITY_CODE.NAIKAN_MEETUP
  );
  const aiCommunity = customer.customerCommunities.find(
    (cc) => cc.community.code === COMMUNITY_CODE.AI_CLUB
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          backHref="/admin/customers"
          title="顧客詳細"
          description={`${customer.lastName} ${customer.firstName}さんの詳細情報`}
        />
        <Button variant="outline" asChild>
          <Link href={`/admin/customers/${customer.id}/edit`}>
            <Edit className="h-4 w-4" />
            編集
          </Link>
        </Button>
      </div>

      {/* 会員情報 */}
      <Card className="border-0">
        <CardContent>
          <Stack gap="lg">
            <SectionHeading>会員情報</SectionHeading>
            <div className="grid grid-cols-2 gap-6">
              <DataItem label="コミュニティ">
                <div className="flex gap-2 flex-wrap items-center">
                  {badges.map((badge, i) => (
                    <Badge key={i} variant={badge.variant}>
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              </DataItem>
              {customer.contractType && (
                <DataItem label="契約主体">
                  {CONTRACT_TYPE_LABELS[customer.contractType as keyof typeof CONTRACT_TYPE_LABELS]}
                </DataItem>
              )}
              <DataItem label="登録日">{formatDate(customer.registeredAt)}</DataItem>
            </div>

            {/* ベンチャー監査役の会 詳細 */}
            {auditCommunity && (
              <div className="rounded-lg border p-4 space-y-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-base">ベンチャー監査役の会</Label>
                  {customer.memberCategory === "member" && auditCommunity.auditMemberType && (
                    <Badge variant={USER_ROLE_CONFIG.member.variant}>
                      {AUDIT_MEMBER_TYPES.find((t) => t.value === auditCommunity.auditMemberType)?.label}
                    </Badge>
                  )}
                  {customer.memberCategory === "sponsor" && (
                    <Badge variant={USER_ROLE_CONFIG.sponsor.variant}>{USER_ROLE_CONFIG.sponsor.label}</Badge>
                  )}
                  {customer.memberCategory === "observer" && (
                    <Badge variant={USER_ROLE_CONFIG.observer.variant}>{USER_ROLE_CONFIG.observer.label}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {auditCommunity?.membershipQualification && (
                    <DataItem label="入会資格">{auditCommunity.membershipQualification.name}</DataItem>
                  )}
                  {auditCommunity?.originIndustry && (
                    <DataItem label="出身業種">{auditCommunity.originIndustry.name}</DataItem>
                  )}
                  {auditCommunity.joinedAt && (
                    <DataItem label="入会日">{formatDate(auditCommunity.joinedAt)}</DataItem>
                  )}
                  {auditCommunity.resignedAt && (
                    <DataItem label="脱退日">{formatDate(auditCommunity.resignedAt)}</DataItem>
                  )}
                </div>
              </div>
            )}

            {/* ないかんMeetup 詳細 */}
            {naikanCommunity && (
              <div className="rounded-lg border p-4 space-y-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-base">ないかんMeetup</Label>
                  {customer.memberCategory && (
                    <Badge variant={USER_ROLE_CONFIG[customer.memberCategory as keyof typeof USER_ROLE_CONFIG]?.variant}>
                      {USER_ROLE_CONFIG[customer.memberCategory as keyof typeof USER_ROLE_CONFIG]?.label}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {naikanCommunity.affiliation && (
                    <DataItem label="所属">{naikanCommunity.affiliation.name}</DataItem>
                  )}
                  {naikanCommunity.joinedAt && (
                    <DataItem label="入会日">{formatDate(naikanCommunity.joinedAt)}</DataItem>
                  )}
                  {naikanCommunity.resignedAt && (
                    <DataItem label="脱退日">{formatDate(naikanCommunity.resignedAt)}</DataItem>
                  )}
                </div>
              </div>
            )}

            {/* AI部会 詳細 */}
            {aiCommunity && (
              <div className="rounded-lg border p-4 space-y-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-base">AI部会</Label>
                  {customer.memberCategory && (
                    <Badge variant={USER_ROLE_CONFIG[customer.memberCategory as keyof typeof USER_ROLE_CONFIG]?.variant}>
                      {USER_ROLE_CONFIG[customer.memberCategory as keyof typeof USER_ROLE_CONFIG]?.label}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {aiCommunity.affiliation && (
                    <DataItem label="所属">{aiCommunity.affiliation.name}</DataItem>
                  )}
                  {aiCommunity.joinedAt && (
                    <DataItem label="入会日">{formatDate(aiCommunity.joinedAt)}</DataItem>
                  )}
                  {aiCommunity.resignedAt && (
                    <DataItem label="脱退日">{formatDate(aiCommunity.resignedAt)}</DataItem>
                  )}
                </div>
              </div>
            )}

            {/* プロフィール */}
            <SectionHeading>プロフィール</SectionHeading>
            <div className="grid grid-cols-2 gap-6">
              <DataItem label="氏名">{customer.lastName} {customer.firstName}</DataItem>
              {(customer.firstNameKana || customer.lastNameKana) && (
                <DataItem label="セイメイ">{customer.lastNameKana} {customer.firstNameKana}</DataItem>
              )}
              <DataItem label="メールアドレス">{customer.email}</DataItem>
              {customer.phone && <DataItem label="電話番号">{customer.phone}</DataItem>}
              {customer.subEmails.length > 0 && (
                <DataItem label="サブメールアドレス">
                  <div className="space-y-1">
                    {customer.subEmails.map((sub, i) => (
                      <p key={i}>{sub}</p>
                    ))}
                  </div>
                </DataItem>
              )}
              {customer.company && <DataItem label="会社名">{customer.company}</DataItem>}
              {customer.listingCategory && (
                <DataItem label="上場区分">{customer.listingCategory.name}</DataItem>
              )}
              {(customer.postalCode || customer.prefecture || customer.city) && (
                <DataItem label="住所">
                  {customer.postalCode && <div>〒{customer.postalCode}</div>}
                  {customer.prefecture && (
                    <div>{customer.prefecture.name}{customer.city}</div>
                  )}
                </DataItem>
              )}
              {customer.gender && (
                <DataItem label="性別">
                  {GENDER_LABELS[customer.gender as keyof typeof GENDER_LABELS]}
                </DataItem>
              )}
              {customer.jobChangeIntent && (
                <DataItem label="転職意欲">
                  {JOB_CHANGE_INTENT_LABELS[customer.jobChangeIntent as keyof typeof JOB_CHANGE_INTENT_LABELS]}
                </DataItem>
              )}
              {customer.note && <DataItem label="備考">{customer.note}</DataItem>}
            </div>
          </Stack>
        </CardContent>
      </Card>

      {/* イベント参加履歴 */}
      <Card className="border-0">
        <CardContent className="space-y-6">
          {upcomingEvents.length > 0 || pastEvents.length > 0 ? (
            <>
              {upcomingEvents.length > 0 && (
                <>
                  <SectionHeading>開催予定のイベント</SectionHeading>
                  <div className="rounded-md">
                    <Table className="[&_th]:py-3 [&_td]:py-3">
                      <TableHeader>
                        <TableRow>
                          <TableHead>イベント名</TableHead>
                          <TableHead>開催日時</TableHead>
                          <TableHead>回答状況</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upcomingEvents.map((event) => (
                          <TableRow key={event.eventId}>
                            <TableCell className="font-medium">
                              <Link href={`/admin/events/${event.eventId}`} className="hover:underline">
                                {event.eventTitle}
                              </Link>
                            </TableCell>
                            <TableCell>{formatDate(event.eventDate)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  RSVP_STATUS_CONFIG[event.status as keyof typeof RSVP_STATUS_CONFIG]
                                    ? RSVP_STATUS_CONFIG[event.status as keyof typeof RSVP_STATUS_CONFIG].variant
                                    : "outline"
                                }
                              >
                                {RSVP_STATUS_CONFIG[event.status as keyof typeof RSVP_STATUS_CONFIG]?.label ?? event.status}
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
                  <SectionHeading>過去のイベント</SectionHeading>
                  <div className="rounded-md">
                    <Table className="[&_th]:py-3 [&_td]:py-3">
                      <TableHeader>
                        <TableRow>
                          <TableHead>イベント名</TableHead>
                          <TableHead>開催日時</TableHead>
                          <TableHead>参加状況</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pastEvents.map((event) => (
                          <TableRow key={event.eventId}>
                            <TableCell className="font-medium">
                              <Link href={`/admin/events/${event.eventId}`} className="hover:underline">
                                {event.eventTitle}
                              </Link>
                            </TableCell>
                            <TableCell>{formatDate(event.eventDate)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  RSVP_STATUS_CONFIG[event.status as keyof typeof RSVP_STATUS_CONFIG]
                                    ? RSVP_STATUS_CONFIG[event.status as keyof typeof RSVP_STATUS_CONFIG].variant
                                    : "outline"
                                }
                              >
                                {RSVP_STATUS_CONFIG[event.status as keyof typeof RSVP_STATUS_CONFIG]?.label ?? event.status}
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

      {/* 削除ボタン */}
      <div className="flex justify-end pt-4 border-t">
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="border-destructive text-destructive bg-white hover:bg-white hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              削除
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>顧客を削除</DialogTitle>
              <DialogDescription>
                この顧客を削除してもよろしいですか？この操作は取り消せません。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                キャンセル
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                {isPending ? "削除中..." : "削除"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
