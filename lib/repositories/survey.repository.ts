import { prisma } from "@/lib/prisma";
import type {
  Survey,
  SurveyQuestion,
  SurveyResponse,
  SurveyToken,
  SurveyRating,
  FutureParticipation,
  MembershipInterest,
  FixedSurveyResponse,
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

export type SurveyTokenForAnswerPage = SurveyToken & {
  survey: Survey & {
    questions: SurveyQuestion[];
    event: Event & {
      community: Pick<Community, "id" | "code" | "name">;
    };
  };
  customer: Pick<Customer, "id" | "lastName" | "firstName" | "deletedAt"> & {
    customerCommunities: {
      resignedAt: Date | null;
      community: { code: string };
    }[];
  };
};

type SurveyResultCustomer = Pick<
  Customer,
  "id" | "lastName" | "firstName" | "company"
> & {
  customerCommunities: {
    resignedAt: Date | null;
    community: { code: string };
  }[];
};

export type SurveyResultData = {
  survey: Survey & { questions: SurveyQuestion[] };
  questionResponses: (SurveyResponse & { customer: SurveyResultCustomer })[];
  fixedResponses: (FixedSurveyResponse & { customer: SurveyResultCustomer })[];
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
    // 既存設問に紐づく回答を先に削除（外部キー制約対策）
    await tx.surveyResponse.deleteMany({
      where: { question: { surveyId } },
    });
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

// ============================================================
// アンケート回答ページ用
// ============================================================

/**
 * トークンからアンケート回答ページ用データを取得
 */
export async function findSurveyTokenByToken(
  token: string
): Promise<SurveyTokenForAnswerPage | null> {
  return prisma.surveyToken.findUnique({
    where: { token },
    include: {
      survey: {
        include: {
          questions: { orderBy: { sortOrder: "asc" } },
          event: {
            include: {
              community: { select: { id: true, code: true, name: true } },
            },
          },
        },
      },
      customer: {
        select: {
          id: true,
          lastName: true,
          firstName: true,
          deletedAt: true,
          customerCommunities: {
            select: {
              resignedAt: true,
              community: { select: { code: true } },
            },
          },
        },
      },
    },
  });
}

/**
 * 既に回答済みかどうかを確認（FixedSurveyResponse の存在チェック）
 */
export async function findExistingResponses(
  surveyId: number,
  customerId: number
): Promise<boolean> {
  const count = await prisma.fixedSurveyResponse.count({
    where: { surveyId, customerId },
  });
  return count > 0;
}

/**
 * アンケート回答を保存（自由設問 + 固定設問をトランザクションで）
 */
export async function saveSurveyResponses(data: {
  surveyTokenId: number;
  surveyId: number;
  customerId: number;
  questionResponses: {
    questionId: number;
    rating: SurveyRating;
    reason: string | null;
  }[];
  afterPartyRating: SurveyRating | null;
  afterPartyReason: string | null;
  futureParticipation: FutureParticipation;
  futureParticipationReason: string | null;
  membership: MembershipInterest | null;
  membershipReason: string | null;
  comments: string | null;
}): Promise<void> {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // 自由設問回答
    if (data.questionResponses.length > 0) {
      await tx.surveyResponse.createMany({
        data: data.questionResponses.map((qr) => ({
          questionId: qr.questionId,
          customerId: data.customerId,
          surveyTokenId: data.surveyTokenId,
          rating: qr.rating,
          reason: qr.reason,
          respondedAt: now,
        })),
      });
    }

    // 固定設問回答
    await tx.fixedSurveyResponse.create({
      data: {
        surveyId: data.surveyId,
        customerId: data.customerId,
        surveyTokenId: data.surveyTokenId,
        afterPartyRating: data.afterPartyRating,
        afterPartyReason: data.afterPartyReason,
        futureParticipation: data.futureParticipation,
        futureParticipationReason: data.futureParticipationReason,
        membership: data.membership,
        membershipReason: data.membershipReason,
        comments: data.comments,
        respondedAt: now,
      },
    });
  });
}

// ============================================================
// アンケート結果用
// ============================================================

const surveyResultCustomerSelect = {
  id: true,
  lastName: true,
  firstName: true,
  company: true,
  customerCommunities: {
    select: {
      resignedAt: true,
      community: { select: { code: true } },
    },
  },
} as const;

/**
 * イベントIDでアンケート結果データを取得
 */
export async function findSurveyResultsByEventId(
  eventId: number
): Promise<SurveyResultData | null> {
  const survey = await prisma.survey.findUnique({
    where: { eventId },
    include: { questions: { orderBy: { sortOrder: "asc" } } },
  });

  if (!survey) return null;

  const [questionResponses, fixedResponses] = await Promise.all([
    prisma.surveyResponse.findMany({
      where: { question: { surveyId: survey.id } },
      include: { customer: { select: surveyResultCustomerSelect } },
    }),
    prisma.fixedSurveyResponse.findMany({
      where: { surveyId: survey.id },
      include: { customer: { select: surveyResultCustomerSelect } },
    }),
  ]);

  return { survey, questionResponses, fixedResponses };
}
