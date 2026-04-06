import { prisma } from "@/lib/prisma";
import type {
  Survey,
  SurveyQuestion,
  Event,
  Community,
  Rsvp,
  Customer,
} from "@/lib/generated/prisma";

// ============================================================
// 型定義
// ============================================================

export type SurveyForEdit = Survey & {
  questions: SurveyQuestion[];
};

export type EventForSurveySend = Event & {
  community: Community;
  rsvps: (Rsvp & {
    customer: Pick<
      Customer,
      | "id"
      | "lastName"
      | "firstName"
      | "email"
      | "subEmails"
      | "company"
      | "memberCategory"
    > & {
      customerCommunities: {
        communityId: number;
        resignedAt: Date | null;
        auditMemberType: string | null;
        auditMemberPremium: boolean | null;
        community: { code: string; name: string };
      }[];
    };
  })[];
  survey: (Survey & { questions: SurveyQuestion[] }) | null;
};

// ============================================================
// Repository 関数
// ============================================================

/**
 * イベントIDでアンケート取得（設問付き）
 */
export async function findSurveyByEventId(
  eventId: number
): Promise<SurveyForEdit | null> {
  return prisma.survey.findUnique({
    where: { eventId },
    include: { questions: { orderBy: { sortOrder: "asc" } } },
  });
}

/**
 * アンケート新規作成（設問込み）
 */
export async function createSurvey(data: {
  eventId: number;
  questions: { title: string; sortOrder: number }[];
}): Promise<Survey> {
  return prisma.survey.create({
    data: {
      eventId: data.eventId,
      questions: {
        create: data.questions,
      },
    },
  });
}

/**
 * アンケート送信画面用のイベント取得
 * 参加者（attending/online）のみを含む
 */
export async function findEventForSurveySend(
  eventId: number
): Promise<EventForSurveySend | null> {
  return prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    include: {
      community: true,
      rsvps: {
        where: {
          status: { in: ["attending", "online"] },
          customer: { deletedAt: null },
        },
        include: {
          customer: {
            select: {
              id: true,
              lastName: true,
              firstName: true,
              email: true,
              subEmails: true,
              company: true,
              memberCategory: true,
              customerCommunities: {
                select: {
                  communityId: true,
                  resignedAt: true,
                  auditMemberType: true,
                  auditMemberPremium: true,
                  community: { select: { code: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      survey: { include: { questions: { orderBy: { sortOrder: "asc" } } } },
    },
  });
}

/**
 * アンケート設問の全置換（トランザクション）
 */
export async function updateSurveyQuestions(
  surveyId: number,
  questions: { title: string; sortOrder: number }[]
): Promise<Survey> {
  return prisma.$transaction(async (tx) => {
    await tx.surveyQuestion.deleteMany({ where: { surveyId } });
    if (questions.length > 0) {
      await tx.surveyQuestion.createMany({
        data: questions.map((q) => ({ ...q, surveyId })),
      });
    }
    return tx.survey.update({
      where: { id: surveyId },
      data: { updatedAt: new Date() },
    });
  });
}
