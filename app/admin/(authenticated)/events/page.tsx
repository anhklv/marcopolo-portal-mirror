import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { getScopedCommunityIds } from "@/lib/auth/permissions";
import type { AdminForPermission } from "@/lib/auth/permissions";
import { findAllEvents } from "@/lib/repositories/event.repository";
import { EventList } from "./_components/event-list";
import { redirect } from "next/navigation";

export default async function EventsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const adminId = Number(session.user.id);
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    include: { adminCommunities: { select: { communityId: true } } },
  });

  if (!admin) {
    redirect("/admin/login");
  }

  const adminForPermission: AdminForPermission = {
    id: admin.id,
    role: admin.role,
    adminCommunities: admin.adminCommunities,
  };

  const isSuper = admin.role === "super";
  const scopedCommunityIds = await getScopedCommunityIds(adminForPermission);

  const events = await findAllEvents(scopedCommunityIds, isSuper);

  const communities = await prisma.community.findMany({
    where: isSuper ? {} : { id: { in: scopedCommunityIds } },
    orderBy: { sortOrder: "asc" },
  });

  const serializedEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.date.toISOString(),
    location: e.location,
    description: e.description,
    note: e.note,
    isPaused: e.isPaused,
    responseDeadline: e.responseDeadline?.toISOString() ?? null,
    community: {
      id: e.community.id,
      code: e.community.code,
      name: e.community.name,
    },
    rsvps: e.rsvps.map((r) => ({
      id: r.id,
      status: r.status,
    })),
  }));

  return (
    <EventList
      initialEvents={serializedEvents}
      communities={communities.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
      }))}
      isSuper={isSuper}
    />
  );
}
