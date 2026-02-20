import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth/permissions";
import { findAllEvents } from "@/lib/repositories/event.repository";
import { EventList } from "./_components/event-list";

export default async function EventsPage() {
  const { isSuper, scopedCommunityIds } = await getAuthenticatedAdmin();

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
