import type { FixedSurveyResponse } from "@/lib/types";
import { fixedSurveyResponses } from "@/lib/data/mock";
import type { IRepository } from "./base.repository";

/**
 * 固定設問回答検索用のフィルター
 */
export interface FixedSurveyResponseFilters {
  surveyId?: string; // アンケートIDでフィルタ
  customerId?: string; // 顧客IDでフィルタ
}

/**
 * FixedSurveyResponseRepository（モック実装）
 * 将来的にDB実装に置き換え可能
 */
class MockFixedSurveyResponseRepository
  implements IRepository<FixedSurveyResponse>
{
  async findAll(
    filters?: FixedSurveyResponseFilters
  ): Promise<FixedSurveyResponse[]> {
    let results = [...fixedSurveyResponses];

    // アンケートIDでフィルタ
    if (filters?.surveyId) {
      results = results.filter((fsr) => fsr.surveyId === filters.surveyId);
    }

    // 顧客IDでフィルタ
    if (filters?.customerId) {
      results = results.filter((fsr) => fsr.customerId === filters.customerId);
    }

    return results;
  }

  async findById(id: string): Promise<FixedSurveyResponse | null> {
    // FixedSurveyResponseは複合キーなので、IDではなくsurveyIdとcustomerIdで検索
    // このメソッドは使用しない想定
    return null;
  }

  /**
   * アンケートIDから固定設問回答を取得
   */
  async findBySurveyId(surveyId: string): Promise<FixedSurveyResponse[]> {
    return fixedSurveyResponses.filter((fsr) => fsr.surveyId === surveyId);
  }

  /**
   * アンケートIDと顧客IDから固定設問回答を取得
   */
  async findBySurveyIdAndCustomerId(
    surveyId: string,
    customerId: string
  ): Promise<FixedSurveyResponse | null> {
    return (
      fixedSurveyResponses.find(
        (fsr) => fsr.surveyId === surveyId && fsr.customerId === customerId
      ) || null
    );
  }

  async create(
    data: Partial<FixedSurveyResponse>
  ): Promise<FixedSurveyResponse> {
    if (!data.surveyId || !data.customerId) {
      throw new Error("surveyId and customerId are required");
    }

    if (!data.token) {
      throw new Error("token is required");
    }

    const fixedSurveyResponse: FixedSurveyResponse = {
      surveyId: data.surveyId,
      customerId: data.customerId,
      token: data.token,
      respondedAt: data.respondedAt || new Date().toISOString(),
      ...data,
    } as FixedSurveyResponse;

    // モックデータに追加（実際のDB実装では不要）
    fixedSurveyResponses.push(fixedSurveyResponse);

    return fixedSurveyResponse;
  }

  async update(
    id: string,
    data: Partial<FixedSurveyResponse>
  ): Promise<FixedSurveyResponse> {
    // FixedSurveyResponseは複合キーのため、surveyIdとcustomerIdで更新
    if (!data.surveyId || !data.customerId) {
      throw new Error("surveyId and customerId are required for update");
    }

    const index = fixedSurveyResponses.findIndex(
      (fsr) =>
        fsr.surveyId === data.surveyId && fsr.customerId === data.customerId
    );

    if (index === -1) {
      throw new Error(
        `FixedSurveyResponse with surveyId ${data.surveyId} and customerId ${data.customerId} not found`
      );
    }

    const updated = {
      ...fixedSurveyResponses[index],
      ...data,
    } as FixedSurveyResponse;
    fixedSurveyResponses[index] = updated;

    return updated;
  }

  async delete(id: string): Promise<void> {
    // FixedSurveyResponseは複合キーのため、このメソッドは使用しない想定
    // 代わりにdeleteBySurveyIdAndCustomerIdを使用
    throw new Error("Use deleteBySurveyIdAndCustomerId instead");
  }

  /**
   * アンケートIDと顧客IDで固定設問回答を削除
   */
  async deleteBySurveyIdAndCustomerId(
    surveyId: string,
    customerId: string
  ): Promise<void> {
    const index = fixedSurveyResponses.findIndex(
      (fsr) => fsr.surveyId === surveyId && fsr.customerId === customerId
    );

    if (index === -1) {
      throw new Error(
        `FixedSurveyResponse with surveyId ${surveyId} and customerId ${customerId} not found`
      );
    }

    fixedSurveyResponses.splice(index, 1);
  }
}

// Repositoryのインスタンスをエクスポート
// 将来的にDB実装に切り替える場合は、ここだけ変更すればOK
export const fixedSurveyResponseRepository =
  new MockFixedSurveyResponseRepository();

