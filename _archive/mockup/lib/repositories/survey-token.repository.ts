import type { SurveyToken } from "@/lib/types";
import { surveyTokens } from "@/lib/data/mock";
import type { IRepository } from "./base.repository";

/**
 * アンケートトークン検索用のフィルター
 */
export interface SurveyTokenFilters {
  surveyId?: string; // アンケートIDでフィルタ
  customerId?: string; // 顧客IDでフィルタ
  token?: string; // トークンで検索
}

/**
 * SurveyTokenRepository（モック実装）
 * 将来的にDB実装に置き換え可能
 */
class MockSurveyTokenRepository implements IRepository<SurveyToken> {
  async findAll(filters?: SurveyTokenFilters): Promise<SurveyToken[]> {
    let results = [...surveyTokens];

    // アンケートIDでフィルタ
    if (filters?.surveyId) {
      results = results.filter((st) => st.surveyId === filters.surveyId);
    }

    // 顧客IDでフィルタ
    if (filters?.customerId) {
      results = results.filter((st) => st.customerId === filters.customerId);
    }

    // トークンで検索
    if (filters?.token) {
      results = results.filter((st) => st.token === filters.token);
    }

    return results;
  }

  async findById(id: string): Promise<SurveyToken | null> {
    // SurveyTokenは複合キーなので、IDではなくtokenで検索
    // このメソッドは使用しない想定
    return null;
  }

  /**
   * トークンからアンケートトークンを取得
   */
  async findByToken(token: string): Promise<SurveyToken | null> {
    return surveyTokens.find((st) => st.token === token) || null;
  }

  /**
   * アンケートIDと顧客IDからアンケートトークンを取得
   */
  async findBySurveyIdAndCustomerId(
    surveyId: string,
    customerId: string
  ): Promise<SurveyToken | null> {
    return (
      surveyTokens.find(
        (st) => st.surveyId === surveyId && st.customerId === customerId
      ) || null
    );
  }

  async create(data: Partial<SurveyToken>): Promise<SurveyToken> {
    if (!data.surveyId || !data.customerId) {
      throw new Error("surveyId and customerId are required");
    }

    // トークンが指定されていない場合は生成
    const token =
      data.token ||
      `survey-${data.customerId}-${data.surveyId}-${Date.now()}`;

    const surveyToken: SurveyToken = {
      surveyId: data.surveyId,
      customerId: data.customerId,
      token,
      sentAt: data.sentAt || new Date().toISOString(),
      ...data,
    } as SurveyToken;

    // モックデータに追加（実際のDB実装では不要）
    surveyTokens.push(surveyToken);

    return surveyToken;
  }

  async update(id: string, data: Partial<SurveyToken>): Promise<SurveyToken> {
    // SurveyTokenは複合キーのため、tokenで更新
    // idパラメータは無視し、data内のtokenを使用
    if (!data.token) {
      throw new Error("token is required for update");
    }

    const index = surveyTokens.findIndex((st) => st.token === data.token);

    if (index === -1) {
      throw new Error(`SurveyToken with token ${data.token} not found`);
    }

    const updated = { ...surveyTokens[index], ...data } as SurveyToken;
    surveyTokens[index] = updated;

    return updated;
  }

  async delete(id: string): Promise<void> {
    // SurveyTokenは複合キーのため、このメソッドは使用しない想定
    // 代わりにdeleteByTokenを使用
    throw new Error("Use deleteByToken instead");
  }

  /**
   * トークンでアンケートトークンを削除
   */
  async deleteByToken(token: string): Promise<void> {
    const index = surveyTokens.findIndex((st) => st.token === token);

    if (index === -1) {
      throw new Error(`SurveyToken with token ${token} not found`);
    }

    surveyTokens.splice(index, 1);
  }
}

// Repositoryのインスタンスをエクスポート
// 将来的にDB実装に切り替える場合は、ここだけ変更すればOK
export const surveyTokenRepository = new MockSurveyTokenRepository();

