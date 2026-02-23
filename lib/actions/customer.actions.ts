"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  requireAuthenticatedAdmin,
  canAccessCustomer,
} from "@/lib/auth/permissions";
import { formatDate } from "@/lib/utils";
import { MEMBER_CATEGORY_LABELS } from "@/lib/constants/customer";
import { COMMUNITY_CODE } from "@/lib/constants/community";
import { customerFormSchema } from "@/lib/validations/customer";
import type { CustomerFormInput } from "@/lib/validations/customer";
import { formatZodFieldErrors } from "@/lib/validations/utils";
import * as customerRepo from "@/lib/repositories/customer.repository";
import { filterCustomers } from "@/lib/helpers/customer-filter";
import type { ActionResult } from "@/lib/types/action";

export type { ActionResult };

// ============================================================
// ヘルパー
// ============================================================

function validateCommunityScope(
  communityIds: number[],
  scopedCommunityIds: number[],
  isSuper: boolean
): string | null {
  if (isSuper) return null;

  // community_admin は最低1つのスコープ内コミュニティが必要
  if (communityIds.length === 0) {
    return "コミュニティを1つ以上選択してください";
  }

  const outOfScope = communityIds.filter(
    (id) => !scopedCommunityIds.includes(id)
  );
  if (outOfScope.length > 0) {
    return "権限のないコミュニティが含まれています";
  }
  return null;
}

function parseFormData(raw: unknown): { data: CustomerFormInput | null; errors: ActionResult | null } {
  const parsed = customerFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, errors: { fieldErrors: formatZodFieldErrors(parsed.error) } };
  }
  return { data: parsed.data, errors: null };
}

function buildCommunityData(communities?: CustomerFormInput["communities"]) {
  if (!communities || communities.length === 0) return [];
  return communities.map((c) => ({
    communityId: c.communityId,
    joinedAt: c.joinedAt ? new Date(c.joinedAt) : null,
    resignedAt: c.resignedAt ? new Date(c.resignedAt) : null,
    auditMemberType: c.auditMemberType ?? null,
    auditMemberPremium: c.auditMemberPremium ?? null,
    affiliationId: c.affiliationId ?? null,
    originIndustryId: c.originIndustryId ?? null,
    membershipQualificationId: c.membershipQualificationId ?? null,
  }));
}

/**
 * ベンチャー監査役の会＋会員の場合、会員種別は必須
 */
async function validateAuditMemberType(
  data: CustomerFormInput
): Promise<{ error?: string }> {
  const ventureAuditor = await prisma.community.findUnique({
    where: { code: COMMUNITY_CODE.VENTURE_AUDITOR },
  });
  if (!ventureAuditor) return {};

  const auditCommunity = (data.communities ?? []).find(
    (c) => c.communityId === ventureAuditor.id
  );
  if (!auditCommunity) return {};

  if (data.memberCategory !== "member") return {};

  if (!auditCommunity.auditMemberType || !["regular", "online"].includes(auditCommunity.auditMemberType)) {
    return { error: "会員種別を選択してください" };
  }
  return {};
}

// ============================================================
// Actions
// ============================================================

/**
 * 顧客新規作成
 */
export async function createCustomerAction(
  formData: unknown
): Promise<ActionResult | void> {
  // 認証
  const { isSuper, scopedCommunityIds } = await requireAuthenticatedAdmin();

  // バリデーション
  const { data, errors } = parseFormData(formData);
  if (errors) return errors;
  if (!data) return { error: "データが不正です" };

  const auditError = await validateAuditMemberType(data);
  if (auditError.error) return auditError;

  // スコープ検証
  const communityIds = (data.communities ?? []).map((c) => c.communityId);
  const scopeError = validateCommunityScope(communityIds, scopedCommunityIds, isSuper);
  if (scopeError) return { error: scopeError };

  // メール重複チェック
  const emailExists = await customerRepo.existsByEmail(data.email);
  if (emailExists) {
    return { error: "このメールアドレスは既に登録されています" };
  }

  // 作成
  try {
    await customerRepo.create({
      ...data,
      communities: buildCommunityData(data.communities),
    });
  } catch (err: unknown) {
    if (isPrismaUniqueError(err)) {
      return { error: "このメールアドレスは既に登録されています" };
    }
    throw err;
  }

  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

/**
 * 顧客更新
 */
export async function updateCustomerAction(
  id: number,
  formData: unknown
): Promise<ActionResult | void> {
  // 認証
  const { admin, isSuper, scopedCommunityIds } = await requireAuthenticatedAdmin();

  // アクセス権チェック
  const hasAccess = await canAccessCustomer(admin, id);
  if (!hasAccess) {
    return { error: "この顧客へのアクセス権がありません" };
  }

  // バリデーション
  const { data, errors } = parseFormData(formData);
  if (errors) return errors;
  if (!data) return { error: "データが不正です" };

  const auditError = await validateAuditMemberType(data);
  if (auditError.error) return auditError;

  // スコープ検証
  const communityIds = (data.communities ?? []).map((c) => c.communityId);
  const scopeError = validateCommunityScope(communityIds, scopedCommunityIds, isSuper);
  if (scopeError) return { error: scopeError };

  // メール重複チェック（自身を除外）
  const emailExists = await customerRepo.existsByEmail(data.email, id);
  if (emailExists) {
    return { error: "このメールアドレスは既に登録されています" };
  }

  // 更新
  try {
    await customerRepo.update(id, {
      ...data,
      communities: buildCommunityData(data.communities),
    });
  } catch (err: unknown) {
    if (isPrismaUniqueError(err)) {
      return { error: "このメールアドレスは既に登録されています" };
    }
    throw err;
  }

  revalidatePath("/admin/customers");
  redirect(`/admin/customers/${id}`);
}

/**
 * 顧客論理削除
 */
export async function deleteCustomerAction(
  id: number
): Promise<ActionResult | void> {
  // 認証
  const { admin } = await requireAuthenticatedAdmin();

  // アクセス権チェック
  const hasAccess = await canAccessCustomer(admin, id);
  if (!hasAccess) {
    return { error: "この顧客へのアクセス権がありません" };
  }

  await customerRepo.softDelete(id);

  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

/**
 * CSVエクスポート
 */
export async function exportCustomersAction(
  filters?: customerRepo.CustomerListFilters
): Promise<{ csv: string } | ActionResult> {
  // 認証
  const { isSuper, scopedCommunityIds } = await requireAuthenticatedAdmin();

  const customers = await customerRepo.findAll(scopedCommunityIds, isSuper, {
    includeFormerMembers: true,
    includeNonMember: true,
  });

  // UIと同じロジックで再フィルタリング（CSV出力の整合性確保）
  // 特に「非会員のみ」選択時に会員が混ざるのを防ぐため
  const filterableCustomers = customers.map((c) => ({
    ...c,
    customerCommunities: c.customerCommunities.map((cc) => ({
      communityId: cc.communityId,
      resignedAt: cc.resignedAt?.toISOString() ?? null,
      auditMemberType: cc.auditMemberType,
      auditMemberPremium: cc.auditMemberPremium,
    })),
  }));

  const helperFilters = {
    keyword: filters?.keyword ?? "",
    communityIds: filters?.communityIds ?? [],
    memberCategories: filters?.memberCategories ?? [],
    auditMemberTypes: filters?.auditMemberTypes ?? [],
    premiumOnly: filters?.premiumOnly ?? false,
    includeFormerMembers: filters?.includeFormerMembers ?? false,
    includeNonMemberFilter: isSuper ? (filters?.includeNonMember ?? false) : false,
  };

  const filteredResult = filterCustomers(filterableCustomers, helperFilters);
  const filteredIds = new Set(filteredResult.map((c) => c.id));
  const targetCustomers = customers.filter((c) => filteredIds.has(c.id));

  // CSV生成
  const BOM = "\uFEFF";
  const headers = [
    "ID",
    "姓",
    "名",
    "セイ",
    "メイ",
    "メールアドレス",
    "会社名",
    "所属コミュニティ",
    "会員区分",
    "都道府県",
    "上場区分",
    "出身業種",
    "入会資格",
    "登録日",
  ];

  const rows = targetCustomers.map((c) => {
    const communityNames = c.customerCommunities
      .map((cc) => cc.community.name)
      .join("・");
    const memberCategoryLabel = c.memberCategory
      ? MEMBER_CATEGORY_LABELS[c.memberCategory as keyof typeof MEMBER_CATEGORY_LABELS] ?? ""
      : "";
    const registeredAt = formatDate(c.registeredAt);
    // originIndustry/membershipQualification は CustomerCommunity（ベンチャー監査役の会）に紐づく
    const auditCC = c.customerCommunities.find((cc) => cc.community.code === COMMUNITY_CODE.VENTURE_AUDITOR);

    return [
      String(c.id),
      c.lastName,
      c.firstName,
      c.lastNameKana ?? "",
      c.firstNameKana ?? "",
      c.email,
      c.company ?? "",
      communityNames,
      memberCategoryLabel,
      c.prefecture?.name ?? "",
      c.listingCategory
        ? (c.listingCategory.stockExchangeName
            ? `${c.listingCategory.stockExchangeName} ${c.listingCategory.marketName}`
            : c.listingCategory.marketName)
        : "",
      auditCC?.originIndustry?.name ?? "",
      auditCC?.membershipQualification?.name ?? "",
      registeredAt,
    ];
  });

  const csvLines = [
    headers.map(escapeCsvField).join(","),
    ...rows.map((row) => row.map(escapeCsvField).join(",")),
  ];

  return { csv: BOM + csvLines.join("\n") };
}

// ============================================================
// CSV ヘルパー
// ============================================================

function escapeCsvField(value: string): string {
  // CSVインジェクション対策
  let sanitized = value;
  if (/^[=+\-@]/.test(sanitized)) {
    sanitized = "'" + sanitized;
  }

  // カンマ、ダブルクォート、改行を含む場合はクォート
  if (sanitized.includes(",") || sanitized.includes('"') || sanitized.includes("\n")) {
    return '"' + sanitized.replace(/"/g, '""') + '"';
  }
  return sanitized;
}

function isPrismaUniqueError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}
