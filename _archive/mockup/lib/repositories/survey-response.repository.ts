import type { SurveyResponse } from "@/lib/types";
import { surveyResponses } from "@/lib/data/mock";
import type { IRepository } from "./base.repository";

/**
 * アンケート回答検索用のフィルター
 */
export interface SurveyResponseFilters {
  surveyId?: string; // アンケートIDでフィルタ
  customerId?: string; // 顧客IDでフィルタ
  questionId?: string; // 設問IDでフィルタ
  token?: string; // トークンでフィルタ
}

/**
 * SurveyResponseRepository（モック実装）
 * 将来的にDB実装に置き換え可能
 */
class MockSurveyResponseRepository implements IRepository<SurveyResponse> {
  async findAll(filters?: SurveyResponseFilters): Promise<SurveyResponse[]> {
    let results = [...surveyResponses];

    // アンケートIDでフィルタ
    if (filters?.surveyId) {
      results = results.filter((sr) => sr.surveyId === filters.surveyId);
    }

    // 顧客IDでフィルタ
    if (filters?.customerId) {
      results = results.filter((sr) => sr.customerId === filters.customerId);
    }

    // 設問IDでフィルタ
    if (filters?.questionId) {
      results = results.filter((sr) => sr.questionId === filters.questionId);
    }

    // トークンでフィルタ
    if (filters?.token) {
      results = results.filter((sr) => sr.token === filters.token);
    }

    return results;
  }

  async findById(id: string): Promise<SurveyResponse | null> {
    // SurveyResponseは複合キーなので、IDではなくsurveyId, questionId, customerIdで検索
    // このメソッドは使用しない想定
    return null;
  }

  /**
   * アンケートIDから回答を取得
   */
  async findBySurveyId(surveyId: string): Promise<SurveyResponse[]> {
    return surveyResponses.filter((sr) => sr.surveyId === surveyId);
  }

  /**
   * アンケートIDと顧客IDから回答を取得
   */
  async findBySurveyIdAndCustomerId(
    surveyId: string,
    customerId: string
  ): Promise<SurveyResponse[]> {
    return surveyResponses.filter(
      (sr) => sr.surveyId === surveyId && sr.customerId === customerId
    );
  }

  /**
   * 顧客が既に回答済みかチェック
   */
  async hasResponded(surveyId: string, customerId: string): Promise<boolean> {
    return surveyResponses.some(
      (sr) => sr.surveyId === surveyId && sr.customerId === customerId
    );
  }

  async create(data: Partial<SurveyResponse>): Promise<SurveyResponse> {
    if (!data.surveyId || !data.questionId || !data.customerId) {
      throw new Error("surveyId, questionId, and customerId are required");
    }

    if (!data.token) {
      throw new Error("token is required");
    }

    const surveyResponse: SurveyResponse = {
      surveyId: data.surveyId,
      questionId: data.questionId,
      customerId: data.customerId,
      token: data.token,
      rating: data.rating || "よかった",
      reason: data.reason || "",
      respondedAt: data.respondedAt || new Date().toISOString(),
      ...data,
    } as SurveyResponse;

    // モックデータに追加（実際のDB実装では不要）
    surveyResponses.push(surveyResponse);

    return surveyResponse;
  }

  async update(id: string, data: Partial<SurveyResponse>): Promise<SurveyResponse> {
    // SurveyResponseは複合キーのため、surveyId, questionId, customerIdで更新
    if (!data.surveyId || !data.questionId || !data.customerId) {
      throw new Error("surveyId, questionId, and customerId are required for update");
    }

    const index = surveyResponses.findIndex(
      (sr) =>
        sr.surveyId === data.surveyId &&
        sr.questionId === data.questionId &&
        sr.customerId === data.customerId
    );

    if (index === -1) {
      throw new Error(
        `SurveyResponse with surveyId ${data.surveyId}, questionId ${data.questionId}, and customerId ${data.customerId} not found`
      );
    }

    const updated = { ...surveyResponses[index], ...data } as SurveyResponse;
    surveyResponses[index] = updated;

    return updated;
  }

  async delete(id: string): Promise<void> {
    // SurveyResponseは複合キーのため、このメソッドは使用しない想定
    // 代わりにdeleteBySurveyIdAndQuestionIdAndCustomerIdを使用
    throw new Error("Use deleteBySurveyIdAndQuestionIdAndCustomerId instead");
  }

  /**
   * アンケートID、設問ID、顧客IDで回答を削除
   */
  async deleteBySurveyIdAndQuestionIdAndCustomerId(
    surveyId: string,
    questionId: string,
    customerId: string
  ): Promise<void> {
    const index = surveyResponses.findIndex(
      (sr) =>
        sr.surveyId === surveyId &&
        sr.questionId === questionId &&
        sr.customerId === customerId
    );

    if (index === -1) {
      throw new Error(
        `SurveyResponse with surveyId ${surveyId}, questionId ${questionId}, and customerId ${customerId} not found`
      );
    }

    surveyResponses.splice(index, 1);
  }
}

// Repositoryのインスタンスをエクスポート
// 将来的にDB実装に切り替える場合は、ここだけ変更すればOK
export const surveyResponseRepository = new MockSurveyResponseRepository();

