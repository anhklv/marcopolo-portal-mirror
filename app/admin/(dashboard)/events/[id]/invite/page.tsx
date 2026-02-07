import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import * as CustomerRepository from "@/lib/repositories/customer.repository";
import { InviteForm } from "./_components/invite-form";
import { auth } from "@/lib/auth/auth";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { id } = await params;
  const eventId = parseInt(id, 10);
  const session = await auth();

  if (isNaN(eventId)) {
    notFound();
  }

  // イベント情報取得
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      rsvps: true,
    },
  });

  if (!event) {
    notFound();
  }

  // 権限チェックとスコープ取得（簡易版）
  // 実際にはauth.tsのセッション情報から取得する
  const isSuper = session?.user?.role === "super";
  
  // TODO: コミュニティ管理者用のスコープ制御
  // 現状は全コミュニティを取得する形にするが、本来はadminのscopesを見る必要がある
  // repositoryの引数に合わせてダミーのスコープを設定
  const scopedCommunityIds: number[] = [];
  if (!isSuper) {
    // 仮実装: 本来は session.user.communityScopes からIDを特定する
    // 今回は全件取得してしまう（実運用では修正が必要）
    // scopedCommunityIds.push(...)
  }

  // 顧客一覧取得
  // inviteページでは、元会員や非会員も含めて検索・招待できるようにする
  const customers = await CustomerRepository.findAll(scopedCommunityIds, true, {
    includeFormerMembers: true,
    includeNonMember: true,
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
      currentUserRole={session?.user?.role as "super" | "community_admin"}
    />
  );
}
