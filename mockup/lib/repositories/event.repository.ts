import type { Event, EventType } from "@/lib/data/mock";
import { events, getEventStatus } from "@/lib/data/mock";
import type { IRepository } from "./base.repository";

/**
 * イベント検索用のフィルター
 */
export interface EventFilters {
  eventType?: EventType; // イベント種別でフィルタ
  status?: "open" | "waiting" | "closed"; // イベントステータスでフィルタ
  keyword?: string; // タイトル、説明で検索
  dateFrom?: string; // 開始日時（ISO形式）
  dateTo?: string; // 終了日時（ISO形式）
  isPaused?: boolean; // 一時停止中かどうか
}

/**
 * イベントRepository（モック実装）
 * 将来的にDB実装に置き換え可能
 */
class MockEventRepository implements IRepository<Event> {
  async findAll(filters?: EventFilters): Promise<Event[]> {
    let results = [...events];

    // イベント種別でフィルタ
    if (filters?.eventType) {
      results = results.filter((e) => e.eventType === filters.eventType);
    }

    // ステータスでフィルタ
    if (filters?.status) {
      results = results.filter((e) => getEventStatus(e) === filters.status);
    }

    // キーワード検索
    if (filters?.keyword) {
      const keyword = filters.keyword.toLowerCase();
      results = results.filter(
        (e) =>
          e.title.toLowerCase().includes(keyword) ||
          e.description.toLowerCase().includes(keyword) ||
          e.location.toLowerCase().includes(keyword)
      );
    }

    // 日時でフィルタ
    if (filters?.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      results = results.filter((e) => new Date(e.date) >= dateFrom);
    }

    if (filters?.dateTo) {
      const dateTo = new Date(filters.dateTo);
      results = results.filter((e) => new Date(e.date) <= dateTo);
    }

    // 一時停止中かどうか
    if (filters?.isPaused !== undefined) {
      results = results.filter(
        (e) => (e.isPaused ?? false) === filters.isPaused
      );
    }

    return results;
  }

  async findById(id: string): Promise<Event | null> {
    return events.find((e) => e.id === id) || null;
  }

  async create(data: Partial<Event>): Promise<Event> {
    // モック実装：新しいIDを生成
    const maxId = Math.max(
      ...events.map((e) => parseInt(e.id.replace("E", "")) || 0)
    );
    const newId = `E${String(maxId + 1).padStart(3, "0")}`;

    const event: Event = {
      id: newId,
      title: data.title || "",
      date: data.date || new Date().toISOString(),
      location: data.location || "",
      description: data.description || "",
      eventType: data.eventType || "その他",
      attendeesCount: data.attendeesCount || 0,
      ...data,
    } as Event;

    // モックデータに追加（実際のDB実装では不要）
    events.push(event);

    return event;
  }

  async update(id: string, data: Partial<Event>): Promise<Event> {
    const index = events.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new Error(`Event with id ${id} not found`);
    }

    const updated = { ...events[index], ...data } as Event;
    events[index] = updated;

    return updated;
  }

  async delete(id: string): Promise<void> {
    const index = events.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new Error(`Event with id ${id} not found`);
    }

    // 物理削除（モック実装）
    events.splice(index, 1);
  }
}

// Repositoryのインスタンスをエクスポート
// 将来的にDB実装に切り替える場合は、ここだけ変更すればOK
export const eventRepository = new MockEventRepository();

