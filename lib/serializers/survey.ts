import type { EventForSurveySend } from "@/lib/repositories/survey.repository";
import type {
  SerializedEventForSurvey,
  SerializedAttendee,
} from "@/lib/types/serialized";

/**
 * アンケート送信画面用イベントシリアライズ
 */
export function serializeEventForSurvey(
  e: EventForSurveySend
): SerializedEventForSurvey {
  return {
    id: e.id,
    title: e.title,
    date: e.date.toISOString(),
    community: {
      id: e.community.id,
      code: e.community.code,
      name: e.community.name,
      hasSurvey: e.community.hasSurvey,
    },
    surveyId: e.survey?.id ?? null,
  };
}

/**
 * 参加者シリアライズ（RSVP → SerializedAttendee）
 */
export function serializeAttendee(
  rsvp: EventForSurveySend["rsvps"][number]
): SerializedAttendee {
  return {
    id: rsvp.customer.id,
    firstName: rsvp.customer.firstName,
    lastName: rsvp.customer.lastName,
    email: rsvp.customer.email,
    subEmails: rsvp.customer.subEmails ?? [],
    company: rsvp.customer.company,
    memberCategory: rsvp.customer.memberCategory,
    rsvpStatus: rsvp.status,
    customerCommunities: rsvp.customer.customerCommunities.map((cc) => ({
      communityId: cc.communityId,
      resignedAt: cc.resignedAt?.toISOString() ?? null,
      auditMemberType: cc.auditMemberType,
      auditMemberPremium: cc.auditMemberPremium,
      community: {
        code: cc.community.code,
        name: cc.community.name,
      },
    })),
  };
}
