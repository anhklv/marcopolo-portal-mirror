import { prisma } from "@/lib/prisma";
import type { Survey, SurveyQuestion } from "@/lib/generated/prisma";

// ============================================================
// 型定義
// ============================================================

export type SurveyForEdit = Survey & {
  questions: SurveyQuestion[];
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
