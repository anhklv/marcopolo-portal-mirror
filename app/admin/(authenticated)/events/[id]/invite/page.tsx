import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import * as CustomerRepository from "@/lib/repositories/customer.repository";
import { InviteForm } from "./_components/invite-form";
import { getAuthenticatedAdmin } from "@/lib/auth/permissions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { id } = await params;
  const eventId = parseInt(id, 10);

  if (isNaN(eventId)) {
    notFound();
  }

  const { admin, isSuper, scopedCommunityIds } = await getAuthenticatedAdmin();

  // イベント情報取得
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      rsvps: true,
      community: true,
    },
  });

  if (!event) {
    notFound();
  }

  // イベントへのアクセス権チェック（community_adminの場合）
  if (!isSuper && !scopedCommunityIds.includes(event.communityId)) {
    notFound();
  }

  // 顧客一覧取得
  // inviteページでは、元会員や非会員も含めて検索・招待できるようにする
  const customers = await CustomerRepository.findAll(scopedCommunityIds, isSuper, {
    includeFormerMembers: true,
    includeNonMember: true,
  });

  // コミュニティ一覧取得（フィルタ用）
  const communities = await prisma.community.findMany({
    where: isSuper ? undefined : { id: { in: scopedCommunityIds } },
    orderBy: { sortOrder: "asc" },
  });

  // シリアライズ可能な形式に変換
  const serializedCustomers = customers.map((c) => ({
    ...c,
    registeredAt: c.registeredAt.toISOString(),
    deletedAt: c.deletedAt?.toISOString() ?? null,
    customerCommunities: c.customerCommunities.map((cc) => ({
      ...cc,
      joinedAt: cc.joinedAt?.toISOString() ?? null,
      resignedAt: cc.resignedAt?.toISOString() ?? null,
      createdAt: cc.createdAt.toISOString(),
      updatedAt: cc.updatedAt.toISOString(),
    })),
  }));

  const serializedEvent = {
    ...event,
    date: event.date.toISOString(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    community: {
      ...event.community,
      createdAt: event.community.createdAt.toISOString(),
      updatedAt: event.community.updatedAt.toISOString(),
    },
    rsvps: event.rsvps.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  };

  return (
    <InviteForm
      event={serializedEvent}
      customers={serializedCustomers}
      currentUserRole={admin.role}
      communities={communities.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
      }))}
    />
  );
}
