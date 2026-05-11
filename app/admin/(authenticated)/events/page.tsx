import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth/permissions";
import { findAllEvents } from "@/lib/repositories/event.repository";
import { serializeEventForList } from "@/lib/serializers/event";
import { EventList } from "./_components/event-list";

export const metadata = {
  title: "イベント管理",
};

export default async function EventsPage() {
  const { isSuper, scopedCommunityIds } = await getAuthenticatedAdmin();

  const events = await findAllEvents(scopedCommunityIds, isSuper);

  const communities = await prisma.community.findMany({
    where: isSuper ? {} : { id: { in: scopedCommunityIds } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <EventList
      initialEvents={events.map(serializeEventForList)}
      communities={communities.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
      }))}
      isSuper={isSuper}
    />
  );
}
