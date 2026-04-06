import type {
  EventForSurveySend,
  SurveyTokenForAnswerPage,
} from "@/lib/repositories/survey.repository";
import type {
  SerializedEventForSurvey,
  SerializedAttendee,
  SerializedSurveyAnswerPageData,
} from "@/lib/types/serialized";
import { COMMUNITY_CODE } from "@/lib/constants/community";

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

/**
 * アンケート回答ページ用シリアライズ
 */
export function serializeSurveyForAnswerPage(
  surveyToken: SurveyTokenForAnswerPage
): SerializedSurveyAnswerPageData {
  const { survey, customer } = surveyToken;
  const event = survey.event;

  const isMemberOfVentureAuditor = customer.customerCommunities.some(
    (cc) =>
      cc.community.code === COMMUNITY_CODE.VENTURE_AUDITOR &&
      cc.resignedAt === null
  );

  return {
    event: {
      id: event.id,
      title: event.title,
      date: event.date.toISOString(),
      hasAfterParty: event.hasAfterParty,
      community: {
        code: event.community.code,
        name: event.community.name,
      },
    },
    survey: {
      id: survey.id,
      questions: survey.questions.map((q) => ({
        id: q.id,
        title: q.title,
        sortOrder: q.sortOrder,
      })),
    },
    customer: {
      id: customer.id,
      lastName: customer.lastName,
      firstName: customer.firstName,
      isMemberOfVentureAuditor,
    },
    surveyToken: {
      id: surveyToken.id,
      token: surveyToken.token,
    },
  };
}
