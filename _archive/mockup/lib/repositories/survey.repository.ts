import type { Survey } from "@/lib/types";
import { surveys } from "@/lib/data/mock";
import type { IRepository } from "./base.repository";

/**
 * アンケート検索用のフィルター
 */
export interface SurveyFilters {
  eventId?: string; // イベントIDでフィルタ
}

/**
 * SurveyRepository（モック実装）
 * 将来的にDB実装に置き換え可能
 */
class MockSurveyRepository implements IRepository<Survey> {
  async findAll(filters?: SurveyFilters): Promise<Survey[]> {
    let results = [...surveys];

    // イベントIDでフィルタ
    if (filters?.eventId) {
      results = results.filter((s) => s.eventId === filters.eventId);
    }

    return results;
  }

  async findById(id: string): Promise<Survey | null> {
    return surveys.find((s) => s.id === id) || null;
  }

  /**
   * イベントIDからアンケートを取得
   */
  async findByEventId(eventId: string): Promise<Survey | null> {
    return surveys.find((s) => s.eventId === eventId) || null;
  }

  async create(data: Partial<Survey>): Promise<Survey> {
    if (!data.eventId) {
      throw new Error("eventId is required");
    }

    // モック実装：新しいIDを生成
    const maxId = Math.max(
      ...surveys.map((s) => parseInt(s.id.replace("SUR", "")) || 0)
    );
    const newId = `SUR${String(maxId + 1).padStart(3, "0")}`;

    const survey: Survey = {
      id: newId,
      eventId: data.eventId,
      questions: data.questions || [],
      createdAt: data.createdAt || new Date().toISOString(),
      ...data,
    } as Survey;

    // モックデータに追加（実際のDB実装では不要）
    surveys.push(survey);

    return survey;
  }

  async update(id: string, data: Partial<Survey>): Promise<Survey> {
    const index = surveys.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Survey with id ${id} not found`);
    }

    const updated = { ...surveys[index], ...data } as Survey;
    surveys[index] = updated;

    return updated;
  }

  async delete(id: string): Promise<void> {
    const index = surveys.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Survey with id ${id} not found`);
    }

    surveys.splice(index, 1);
  }
}

// Repositoryのインスタンスをエクスポート
// 将来的にDB実装に切り替える場合は、ここだけ変更すればOK
export const surveyRepository = new MockSurveyRepository();

