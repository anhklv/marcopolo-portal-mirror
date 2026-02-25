import type { RsvpForPage } from "@/lib/repositories/rsvp.repository";
import type { SerializedRsvpPageData } from "@/lib/types/serialized";

/**
 * RSVP回答ページ用シリアライズ
 */
export function serializeRsvpForPage(
  rsvp: RsvpForPage
): SerializedRsvpPageData {
  return {
    event: {
      id: rsvp.event.id,
      title: rsvp.event.title,
      date: rsvp.event.date.toISOString(),
      location: rsvp.event.location,
      description: rsvp.event.description,
      timetable: rsvp.event.timetable,
      note: rsvp.event.note,
      allowsOnline: rsvp.event.allowsOnline,
      hasAfterParty: rsvp.event.hasAfterParty,
      responseDeadline: rsvp.event.responseDeadline?.toISOString() ?? null,
      community: {
        name: rsvp.event.community.name,
      },
    },
    rsvp: {
      id: rsvp.id,
      token: rsvp.token,
      status: rsvp.status,
      afterPartyStatus: rsvp.afterPartyStatus,
      comment: rsvp.comment,
      respondedAt: rsvp.respondedAt?.toISOString() ?? null,
    },
    customer: {
      lastName: rsvp.customer.lastName,
      firstName: rsvp.customer.firstName,
    },
  };
}
