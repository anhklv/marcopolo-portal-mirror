// 顧客データのシリアライズ関数
// Prisma の Date オブジェクトを string に変換し、型安全にクライアントへ渡す

import type { CustomerWithCommunities, CustomerDetail } from "@/lib/repositories/customer.repository";
import type { SerializedCustomer, SerializedCustomerDetail, SerializedCustomerForInvite } from "@/lib/types/serialized";
import { COMMUNITY_CODE } from "@/lib/constants/community";

/**
 * 顧客一覧用シリアライズ
 * リレーションを文字列にフラット化（prefecture → name, listingCategory → marketName 等）
 */
export function serializeCustomerForList(c: CustomerWithCommunities): SerializedCustomer {
  const auditCC = c.customerCommunities.find(
    (cc) => cc.community.code === COMMUNITY_CODE.VENTURE_AUDITOR
  );
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    firstNameKana: c.firstNameKana,
    lastNameKana: c.lastNameKana,
    email: c.email,
    subEmails: c.subEmails,
    company: c.company,
    phone: c.phone,
    postalCode: c.postalCode,
    prefecture: c.prefecture?.name ?? null,
    city: c.city,
    gender: c.gender,
    listingCategory: c.listingCategory?.marketName ?? null,
    departments: c.customerDepartments.map((cd) => cd.department.name),
    originIndustry: auditCC?.originIndustry?.name ?? null,
    membershipQualification: auditCC?.membershipQualification?.name ?? null,
    memberCategory: c.memberCategory,
    contractType: c.contractType,
    note: c.note,
    registeredAt: c.registeredAt.toISOString(),
    deletedAt: c.deletedAt?.toISOString() ?? null,
    customerCommunities: c.customerCommunities.map((cc) => ({
      id: cc.id,
      customerId: cc.customerId,
      communityId: cc.communityId,
      joinedAt: cc.joinedAt?.toISOString() ?? null,
      resignedAt: cc.resignedAt?.toISOString() ?? null,
      auditMemberType: cc.auditMemberType,
      auditMemberPremium: cc.auditMemberPremium,
      affiliation: cc.affiliation?.name ?? null,
      createdAt: cc.createdAt.toISOString(),
      updatedAt: cc.updatedAt.toISOString(),
      community: {
        id: cc.community.id,
        code: cc.community.code,
        name: cc.community.name,
        hasSurvey: cc.community.hasSurvey,
        sortOrder: cc.community.sortOrder,
        createdAt: cc.community.createdAt.toISOString(),
        updatedAt: cc.community.updatedAt.toISOString(),
      },
    })),
  };
}

/**
 * 顧客詳細用シリアライズ
 * リレーションを { id, name } 形式で保持（詳細画面でID参照が必要なため）
 */
export function serializeCustomerForDetail(c: CustomerDetail): SerializedCustomerDetail {
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    firstNameKana: c.firstNameKana,
    lastNameKana: c.lastNameKana,
    email: c.email,
    subEmails: c.subEmails,
    company: c.company,
    phone: c.phone,
    postalCode: c.postalCode,
    prefecture: c.prefecture
      ? { id: c.prefecture.id, name: c.prefecture.name }
      : null,
    city: c.city,
    gender: c.gender,
    listingCategory: c.listingCategory
      ? {
          id: c.listingCategory.id,
          name: c.listingCategory.stockExchangeName
            ? `${c.listingCategory.stockExchangeName} ${c.listingCategory.marketName}`
            : c.listingCategory.marketName,
        }
      : null,
    departments: c.customerDepartments.map((cd) => ({
      id: cd.department.id,
      name: cd.department.name,
    })),
    memberCategory: c.memberCategory,
    contractType: c.contractType,
    jobChangeIntent: c.jobChangeIntent,
    note: c.note,
    registeredAt: c.registeredAt.toISOString(),
    deletedAt: c.deletedAt?.toISOString() ?? null,
    customerCommunities: c.customerCommunities.map((cc) => ({
      id: cc.id,
      communityId: cc.communityId,
      joinedAt: cc.joinedAt?.toISOString() ?? null,
      resignedAt: cc.resignedAt?.toISOString() ?? null,
      auditMemberType: cc.auditMemberType,
      auditMemberPremium: cc.auditMemberPremium,
      affiliation: cc.affiliation
        ? { id: cc.affiliation.id, name: cc.affiliation.name }
        : null,
      originIndustry: cc.originIndustry
        ? { id: cc.originIndustry.id, name: cc.originIndustry.name }
        : null,
      membershipQualification: cc.membershipQualification
        ? { id: cc.membershipQualification.id, name: cc.membershipQualification.name }
        : null,
      community: {
        id: cc.community.id,
        code: cc.community.code,
        name: cc.community.name,
      },
    })),
    rsvps: c.rsvps.map((r) => ({
      id: r.id,
      status: r.status,
      respondedAt: r.respondedAt?.toISOString() ?? null,
      event: {
        id: r.event.id,
        title: r.event.title,
        date: r.event.date.toISOString(),
        communityId: r.event.communityId,
      },
    })),
  };
}

/**
 * イベント招待用シリアライズ
 */
export function serializeCustomerForInvite(c: CustomerWithCommunities): SerializedCustomerForInvite {
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    subEmails: c.subEmails,
    company: c.company,
    memberCategory: c.memberCategory,
    customerCommunities: c.customerCommunities.map((cc) => ({
      communityId: cc.communityId,
      resignedAt: cc.resignedAt?.toISOString() ?? null,
      auditMemberType: cc.auditMemberType,
      auditMemberPremium: cc.auditMemberPremium,
      community: {
        code: cc.community.code,
        name: cc.community.name,
      },
    })),
  };
}
