"use server";

import { revalidatePath } from "next/cache";
import {
  requireAuthenticatedAdmin,
  canManageSurvey,
} from "@/lib/auth/permissions";
import { saveSurveySchema } from "@/lib/validations/survey";
import { formatZodFieldErrors } from "@/lib/validations/utils";
import * as surveyRepo from "@/lib/repositories/survey.repository";
import type { ActionResult } from "@/lib/types/action";

// ============================================================
// 型定義
// ============================================================

export type SurveyActionResult =
  | { success: true; surveyId: number }
  | ({ success: false } & ActionResult);

// ============================================================
// Actions
// ============================================================

/**
 * アンケート保存（新規作成 or 設問更新）
 */
export async function saveSurveyAction(
  formData: unknown
): Promise<SurveyActionResult> {
  // 認証
  const { admin } = await requireAuthenticatedAdmin();

  // バリデーション
  const parsed = saveSurveySchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, fieldErrors: formatZodFieldErrors(parsed.error) };
  }

  const { eventId, questions } = parsed.data;

  // 権限チェック
  const hasPermission = await canManageSurvey(admin, eventId);
  if (!hasPermission) {
    return { success: false, error: "このイベントのアンケートを操作する権限がありません" };
  }

  try {
    const existing = await surveyRepo.findSurveyByEventId(eventId);
    const questionsData = questions.map((q) => ({
      title: q.title,
      sortOrder: q.sortOrder,
    }));

    let surveyId: number;
    if (existing) {
      const updated = await surveyRepo.updateSurveyQuestions(
        existing.id,
        questionsData
      );
      surveyId = updated.id;
    } else {
      const created = await surveyRepo.createSurvey({
        eventId,
        questions: questionsData,
      });
      surveyId = created.id;
    }

    revalidatePath(`/admin/events/${eventId}/survey`);
    return { success: true, surveyId };
  } catch {
    return { success: false, error: "アンケートの保存に失敗しました" };
  }
}

/**
 * アンケートスキップ（設問なしで作成）
 */
export async function skipSurveyAction(
  eventId: number
): Promise<SurveyActionResult> {
  // 認証
  const { admin } = await requireAuthenticatedAdmin();

  // 権限チェック
  const hasPermission = await canManageSurvey(admin, eventId);
  if (!hasPermission) {
    return { success: false, error: "このイベントのアンケートを操作する権限がありません" };
  }

  try {
    const existing = await surveyRepo.findSurveyByEventId(eventId);
    if (existing) {
      return { success: true, surveyId: existing.id };
    }

    const created = await surveyRepo.createSurvey({
      eventId,
      questions: [],
    });

    revalidatePath(`/admin/events/${eventId}/survey`);
    return { success: true, surveyId: created.id };
  } catch {
    return { success: false, error: "アンケートの作成に失敗しました" };
  }
}
