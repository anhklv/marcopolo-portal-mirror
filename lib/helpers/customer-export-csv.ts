import {
  AUDIT_MEMBER_TYPES,
  CONTRACT_TYPE_LABELS,
  GENDER_LABELS,
  JOB_CHANGE_INTENT_LABELS,
  MEMBER_CATEGORY_LABELS,
} from "@/lib/constants/customer";
import { COMMUNITY_CODE, COMMUNITY_NAME } from "@/lib/constants/community";
import type { CustomerWithCommunities } from "@/lib/repositories/customer.repository";
import type {
  ContractType,
  Gender,
  JobChangeIntent,
  MemberCategory,
} from "@/lib/generated/prisma";
import { formatDate } from "@/lib/utils";
import { encodeCsvDocument } from "@/lib/utils/csv";

const CUSTOMER_EXPORT_HEADERS = [
  "ID",
  "姓",
  "名",
  "セイ",
  "メイ",
  "メールアドレス",
  "サブメール1",
  "サブメール2",
  "サブメール3",
  "電話番号",
  "会社名",
  "上場区分",
  "郵便番号",
  "都道府県",
  "市区町村",
  "性別",
  "会員区分",
  "契約主体",
  "転職意欲",
  "備考",
  "所属コミュニティ",
  `${COMMUNITY_NAME[COMMUNITY_CODE.VENTURE_AUDITOR]}_会員種別`,
  `${COMMUNITY_NAME[COMMUNITY_CODE.VENTURE_AUDITOR]}_プレミアム会員`,
  `${COMMUNITY_NAME[COMMUNITY_CODE.VENTURE_AUDITOR]}_入会資格`,
  `${COMMUNITY_NAME[COMMUNITY_CODE.VENTURE_AUDITOR]}_出身業種`,
  `${COMMUNITY_NAME[COMMUNITY_CODE.VENTURE_AUDITOR]}_入会日`,
  `${COMMUNITY_NAME[COMMUNITY_CODE.VENTURE_AUDITOR]}_脱退日`,
  `${COMMUNITY_NAME[COMMUNITY_CODE.NAIKAN_MEETUP]}_所属`,
  `${COMMUNITY_NAME[COMMUNITY_CODE.NAIKAN_MEETUP]}_入会日`,
  `${COMMUNITY_NAME[COMMUNITY_CODE.NAIKAN_MEETUP]}_脱退日`,
  `${COMMUNITY_NAME[COMMUNITY_CODE.AI_CLUB]}_所属`,
  `${COMMUNITY_NAME[COMMUNITY_CODE.AI_CLUB]}_入会日`,
  `${COMMUNITY_NAME[COMMUNITY_CODE.AI_CLUB]}_脱退日`,
  "登録日",
] as const;

export function formatListingCategory(
  listingCategory: Pick<
    NonNullable<CustomerWithCommunities["listingCategory"]>,
    "marketName" | "stockExchangeName"
  >
): string {
  return listingCategory.stockExchangeName
    ? `${listingCategory.stockExchangeName} ${listingCategory.marketName}`
    : listingCategory.marketName;
}

function formatOptionalDate(date: Date | null | undefined): string {
  return date ? formatDate(date) : "";
}

function buildCustomerExportRow(customer: CustomerWithCommunities): string[] {
  const auditCommunity = customer.customerCommunities.find(
    (cc) => cc.community.code === COMMUNITY_CODE.VENTURE_AUDITOR
  );
  const naikanCommunity = customer.customerCommunities.find(
    (cc) => cc.community.code === COMMUNITY_CODE.NAIKAN_MEETUP
  );
  const aiCommunity = customer.customerCommunities.find(
    (cc) => cc.community.code === COMMUNITY_CODE.AI_CLUB
  );

  const auditMemberTypeLabel = auditCommunity?.auditMemberType
    ? AUDIT_MEMBER_TYPES.find((type) => type.value === auditCommunity.auditMemberType)
        ?.label ?? ""
    : "";

  return [
    String(customer.id),
    customer.lastName,
    customer.firstName,
    customer.lastNameKana ?? "",
    customer.firstNameKana ?? "",
    customer.email,
    customer.subEmails?.[0] ?? "",
    customer.subEmails?.[1] ?? "",
    customer.subEmails?.[2] ?? "",
    customer.phone ?? "",
    customer.company ?? "",
    customer.listingCategory ? formatListingCategory(customer.listingCategory) : "",
    customer.postalCode ?? "",
    customer.prefecture?.name ?? "",
    customer.city ?? "",
    customer.gender
      ? GENDER_LABELS[customer.gender as Gender] ?? ""
      : "",
    customer.memberCategory
      ? MEMBER_CATEGORY_LABELS[customer.memberCategory as MemberCategory] ?? ""
      : "",
    customer.contractType
      ? CONTRACT_TYPE_LABELS[customer.contractType as ContractType] ?? ""
      : "",
    customer.jobChangeIntent
      ? JOB_CHANGE_INTENT_LABELS[customer.jobChangeIntent as JobChangeIntent] ?? ""
      : "",
    customer.note ?? "",
    customer.customerCommunities.map((cc) => cc.community.name).join("・"),
    auditMemberTypeLabel,
    auditCommunity?.auditMemberPremium === true ? "はい" : "",
    auditCommunity?.membershipQualification?.name ?? "",
    auditCommunity?.originIndustry?.name ?? "",
    formatOptionalDate(auditCommunity?.joinedAt),
    formatOptionalDate(auditCommunity?.resignedAt),
    naikanCommunity?.affiliation?.name ?? "",
    formatOptionalDate(naikanCommunity?.joinedAt),
    formatOptionalDate(naikanCommunity?.resignedAt),
    aiCommunity?.affiliation?.name ?? "",
    formatOptionalDate(aiCommunity?.joinedAt),
    formatOptionalDate(aiCommunity?.resignedAt),
    formatDate(customer.registeredAt),
  ];
}

/**
 * 顧客一覧（管理画面フィルタ結果）と同等の全項目で CSV 文字列を生成する（BOM 付き）
 */
export function buildCustomersExportCsv(
  customers: CustomerWithCommunities[]
): string {
  const rows = customers.map(buildCustomerExportRow);
  return encodeCsvDocument([...CUSTOMER_EXPORT_HEADERS], rows);
}

export { CUSTOMER_EXPORT_HEADERS };
