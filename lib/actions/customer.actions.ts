"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  requireAuthenticatedAdmin,
  canAccessCustomer,
} from "@/lib/auth/permissions";
import { COMMUNITY_CODE } from "@/lib/constants/community";
import { customerFormSchema } from "@/lib/validations/customer";
import type { CustomerFormInput } from "@/lib/validations/customer";
import { formatZodFieldErrors } from "@/lib/validations/utils";
import * as customerRepo from "@/lib/repositories/customer.repository";
import { filterCustomers } from "@/lib/helpers/customer-filter";
import { buildCustomersExportCsv } from "@/lib/helpers/customer-export-csv";
import type { ActionResult } from "@/lib/types/action";
import { logServerError } from "@/lib/utils/log-error";
import { isPrismaUniqueViolationOnField } from "@/lib/utils/prisma-error";

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

async function findOutOfScopeCommunityData(
  customerId: number,
  scopedCommunityIds: number[]
) {
  const communities = await prisma.customerCommunity.findMany({
    where: {
      customerId,
      communityId: { notIn: scopedCommunityIds },
    },
    select: {
      communityId: true,
      joinedAt: true,
      resignedAt: true,
      auditMemberType: true,
      auditMemberPremium: true,
      affiliationId: true,
      originIndustryId: true,
      membershipQualificationId: true,
    },
  });

  return communities.map((c) => ({
    communityId: c.communityId,
    joinedAt: c.joinedAt,
    resignedAt: c.resignedAt,
    auditMemberType: c.auditMemberType,
    auditMemberPremium: c.auditMemberPremium,
    affiliationId: c.affiliationId,
    originIndustryId: c.originIndustryId,
    membershipQualificationId: c.membershipQualificationId,
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
    if (isPrismaUniqueViolationOnField(err, "email")) {
      return { error: "このメールアドレスは既に登録されています" };
    }
    logServerError("createCustomerAction", err);
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
    const scopedCommunityData = buildCommunityData(data.communities);
    const preservedOutOfScopeCommunityData = isSuper
      ? []
      : await findOutOfScopeCommunityData(id, scopedCommunityIds);
    const updateData = {
      ...data,
      communities: [
        ...scopedCommunityData,
        ...preservedOutOfScopeCommunityData,
      ],
    };
    await customerRepo.update(id, updateData);
  } catch (err: unknown) {
    if (isPrismaUniqueViolationOnField(err, "email")) {
      return { error: "このメールアドレスは既に登録されています" };
    }
    logServerError("updateCustomerAction", err);
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

  return { csv: buildCustomersExportCsv(targetCustomers) };
}
