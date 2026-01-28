import type { Customer, MemberCategory, Community } from "@/lib/types";
import { customers } from "@/lib/data/mock";
import type { IRepository } from "./base.repository";

/**
 * 顧客検索用のフィルター
 */
export interface CustomerFilters {
  keyword?: string; // 名前、会社名、メールアドレスで検索
  memberCategories?: MemberCategory[]; // 会員区分でフィルタ（会員の場合のみ）
  organizations?: string[]; // コミュニティ（ベンチャー監査役の会、ないかんMeetup、非会員）でフィルタ
  auditMemberTypes?: ("regular" | "online")[]; // ベンチャー監査役の会の会員種別
  premiumOnly?: boolean; // プレミアム会員のみ
  includeFormerMembers?: boolean; // 元会員を含む（デフォルトは含まない）
}

/**
 * 顧客Repository（モック実装）
 * 将来的にDB実装に置き換え可能
 */
class MockCustomerRepository implements IRepository<Customer> {
  async findAll(filters?: CustomerFilters): Promise<Customer[]> {
    let results = [...customers];

    // キーワード検索
    if (filters?.keyword) {
      const keyword = filters.keyword.toLowerCase();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(keyword) ||
          c.company?.toLowerCase().includes(keyword) ||
          c.email.toLowerCase().includes(keyword) ||
          c.nameKana?.toLowerCase().includes(keyword)
      );
    }

    // 会員区分でフィルタ（会員の場合のみ）
    if (filters?.memberCategories && filters.memberCategories.length > 0) {
      results = results.filter((c) =>
        c.memberCategory && filters.memberCategories!.includes(c.memberCategory)
      );
    }

    // 所属コミュニティでフィルタ（ベンチャー監査役の会、ないかんMeetup、非会員）
    if (filters?.organizations && filters.organizations.length > 0) {
      results = results.filter((c) => {
        const hasNonMember = filters.organizations!.includes("非会員");
        const hasOrganizations = filters.organizations!.some((org) =>
          c.communities.includes(org as Community)
        );
        
        // 非会員の場合
        if (c.communities.length === 0) {
          return hasNonMember;
        }
        // コミュニティに所属している場合
        return hasOrganizations;
      });
    }

    // ベンチャー監査役の会の会員種別でフィルタ
    if (
      filters?.auditMemberTypes &&
      filters.auditMemberTypes.length > 0
    ) {
      results = results.filter(
        (c) =>
          c.auditMemberType &&
          filters.auditMemberTypes!.includes(c.auditMemberType)
      );
    }

    // プレミアム会員のみ
    if (filters?.premiumOnly) {
      results = results.filter((c) => c.auditMemberPremium === true);
    }

    // 元会員フィルタ（デフォルトでは全コミュニティ脱退済みの顧客を除外）
    if (!filters?.includeFormerMembers) {
      results = results.filter((c) => {
        // 非会員（入会歴なし）は表示
        if (c.communities.length === 0) return true;
        // 所属コミュニティがあり、全て脱退済みかチェック
        const allResigned = c.communities.every((community) => {
          if (community === "ベンチャー監査役の会") return !!c.auditResignedAt;
          if (community === "ないかんMeetup") return !!c.naikanResignedAt;
          if (community === "AI部会") return !!c.aiResignedAt;
          return false;
        });
        return !allResigned;
      });
    }

    return results;
  }

  async findById(id: string): Promise<Customer | null> {
    return customers.find((c) => c.id === id) || null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return customers.find((c) => c.email === email) || null;
  }

  async create(data: Partial<Customer>): Promise<Customer> {
    // モック実装：新しいIDを生成
    const maxId = Math.max(
      ...customers.map((c) => parseInt(c.id.replace("C", "")) || 0)
    );
    const newId = `C${String(maxId + 1).padStart(3, "0")}`;

    const customer: Customer = {
      id: newId,
      name: data.name || "",
      email: data.email || "",
      memberCategory: data.memberCategory, // 会員の場合のみ設定、非会員の場合はundefined
      communities: data.communities || [],
      registeredAt: data.registeredAt || new Date().toISOString(),
      ...data,
    } as Customer;

    // モックデータに追加（実際のDB実装では不要）
    customers.push(customer);

    return customer;
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Customer with id ${id} not found`);
    }

    const updated = { ...customers[index], ...data } as Customer;
    customers[index] = updated;

    return updated;
  }

  async delete(id: string): Promise<void> {
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Customer with id ${id} not found`);
    }

    // 物理削除
    customers.splice(index, 1);
  }
}

// Repositoryのインスタンスをエクスポート
// 将来的にDB実装に切り替える場合は、ここだけ変更すればOK
export const customerRepository = new MockCustomerRepository();

