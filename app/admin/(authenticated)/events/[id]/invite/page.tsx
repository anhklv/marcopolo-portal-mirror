import { notFound } from "next/navigation";
import { getAuthenticatedAdmin, canAccessEvent } from "@/lib/auth/permissions";
import { COMMUNITY_CODE } from "@/lib/constants/community";
import { findEventByIdForInvite } from "@/lib/repositories/event.repository";
import { serializeEventForInvite } from "@/lib/serializers/event";
import { serializeCustomerForInvite } from "@/lib/serializers/customer";
import { generateInviteSubject, generateInviteBody } from "@/lib/mail/templates/invite";
import * as customerRepo from "@/lib/repositories/customer.repository";
import { getEventDisplayStatus } from "@/lib/utils/event";
import { prisma } from "@/lib/prisma";
import { InviteForm } from "./_components/invite-form";

export const metadata = {
  title: "招待メール送信",
};

export default async function EventInvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = Number(id);

  if (isNaN(eventId)) {
    notFound();
  }

  const { admin, isSuper, scopedCommunityIds } = await getAuthenticatedAdmin();

  const hasAccess = await canAccessEvent(admin, eventId);
  if (!hasAccess) {
    notFound();
  }

  const event = await findEventByIdForInvite(eventId);
  if (!event) {
    notFound();
  }

  if (getEventDisplayStatus(event) !== "receiving") {
    notFound();
  }

  // 顧客一覧取得（元会員・非会員を含む）
  const customers = await customerRepo.findAll(scopedCommunityIds, isSuper, {
    includeFormerMembers: true,
    includeNonMember: true,
  });

  // 管理者メール取得（テスト送信先用）
  const adminRecord = await prisma.admin.findUnique({
    where: { id: admin.id },
    select: { email: true },
  });

  // コミュニティ一覧（フィルタ用。顧客の所属は主要3コミュニティのみのため「その他」は除外）
  const communities = await prisma.community.findMany({
    where: {
      code: { not: COMMUNITY_CODE.OTHER },
      ...(isSuper ? {} : { id: { in: scopedCommunityIds } }),
    },
    select: { id: true, code: true, name: true },
    orderBy: { sortOrder: "asc" },
  });

  // テンプレート初期値生成
  const serializedEvent = serializeEventForInvite(event);
  const templateParams = {
    eventTitle: event.title,
    eventDate: serializedEvent.date,
    eventLocation: event.location,
    eventDescription: event.description,
    eventTimetable: event.timetable,
    eventNote: event.note,
  };

  return (
    <InviteForm
      event={serializedEvent}
      customers={customers.map(serializeCustomerForInvite)}
      currentUserRole={admin.role}
      communities={communities}
      adminEmail={adminRecord?.email ?? ""}
      defaultEmailTitle={generateInviteSubject(templateParams)}
      defaultEmailBody={generateInviteBody(templateParams)}
    />
  );
}
