import type { RSVP } from "@/lib/types";
import { rsvps } from "@/lib/data/mock";
import type { IRepository } from "./base.repository";

/**
 * RSVP検索用のフィルター
 */
export interface RSVPFilters {
  eventId?: string; // イベントIDでフィルタ
  customerId?: string; // 顧客IDでフィルタ
  status?: RSVP["status"]; // ステータスでフィルタ
  token?: string; // トークンで検索
}

/**
 * RSVPRepository（モック実装）
 * 将来的にDB実装に置き換え可能
 */
class MockRSVPRepository implements IRepository<RSVP> {
  async findAll(filters?: RSVPFilters): Promise<RSVP[]> {
    let results = [...rsvps];

    // イベントIDでフィルタ
    if (filters?.eventId) {
      results = results.filter((r) => r.eventId === filters.eventId);
    }

    // 顧客IDでフィルタ
    if (filters?.customerId) {
      results = results.filter((r) => r.customerId === filters.customerId);
    }

    // ステータスでフィルタ
    if (filters?.status) {
      results = results.filter((r) => r.status === filters.status);
    }

    // トークンで検索
    if (filters?.token) {
      results = results.filter((r) => r.token === filters.token);
    }

    return results;
  }

  async findById(id: string): Promise<RSVP | null> {
    // RSVPは複合キーなので、IDではなくeventIdとcustomerIdで検索
    // このメソッドは使用しない想定
    return null;
  }

  async findByEventIdAndCustomerId(
    eventId: string,
    customerId: string
  ): Promise<RSVP | null> {
    return (
      rsvps.find(
        (r) => r.eventId === eventId && r.customerId === customerId
      ) || null
    );
  }

  async findByToken(token: string): Promise<RSVP | null> {
    return rsvps.find((r) => r.token === token) || null;
  }

  async create(data: Partial<RSVP>): Promise<RSVP> {
    if (!data.eventId || !data.customerId) {
      throw new Error("eventId and customerId are required");
    }

    // トークンが指定されていない場合は生成
    const token =
      data.token ||
      `token-${data.customerId}-${data.eventId}-${Date.now()}`;

    const rsvp: RSVP = {
      eventId: data.eventId,
      customerId: data.customerId,
      token,
      status: data.status || "未回答",
      ...data,
    } as RSVP;

    // モックデータに追加（実際のDB実装では不要）
    rsvps.push(rsvp);

    return rsvp;
  }

  async update(id: string, data: Partial<RSVP>): Promise<RSVP> {
    // RSVPは複合キーのため、eventIdとcustomerIdで更新
    // idパラメータは無視し、data内のeventIdとcustomerIdを使用
    if (!data.eventId || !data.customerId) {
      throw new Error("eventId and customerId are required for update");
    }

    const index = rsvps.findIndex(
      (r) => r.eventId === data.eventId && r.customerId === data.customerId
    );

    if (index === -1) {
      throw new Error(
        `RSVP with eventId ${data.eventId} and customerId ${data.customerId} not found`
      );
    }

    const updated = { ...rsvps[index], ...data } as RSVP;
    rsvps[index] = updated;

    return updated;
  }

  async delete(id: string): Promise<void> {
    // RSVPは複合キーのため、このメソッドは使用しない想定
    // 代わりにdeleteByEventIdAndCustomerIdを使用
    throw new Error("Use deleteByEventIdAndCustomerId instead");
  }

  async deleteByEventIdAndCustomerId(
    eventId: string,
    customerId: string
  ): Promise<void> {
    const index = rsvps.findIndex(
      (r) => r.eventId === eventId && r.customerId === customerId
    );

    if (index === -1) {
      throw new Error(
        `RSVP with eventId ${eventId} and customerId ${customerId} not found`
      );
    }

    rsvps.splice(index, 1);
  }
}

// Repositoryのインスタンスをエクスポート
// 将来的にDB実装に切り替える場合は、ここだけ変更すればOK
export const rsvpRepository = new MockRSVPRepository();

