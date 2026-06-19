import type { MemberCategory, AuditMemberType } from "@/lib/generated/prisma";

export const CUSTOMER_LIST_PATH = "/admin/customers";

export type CustomerListUrlFilters = {
  keyword: string;
  communityIds: number[];
  memberCategories: MemberCategory[];
  auditMemberTypes: AuditMemberType[];
  premiumOnly: boolean;
  includeFormerMembers: boolean;
  includeNonMemberFilter: boolean;
  page: number;
};

const MEMBER_CATEGORIES = new Set<MemberCategory>(["member", "sponsor", "observer"]);
const AUDIT_MEMBER_TYPES = new Set<AuditMemberType>(["regular", "online"]);

export function defaultCustomerListUrlFilters(): CustomerListUrlFilters {
  return {
    keyword: "",
    communityIds: [],
    memberCategories: [],
    auditMemberTypes: [],
    premiumOnly: false,
    includeFormerMembers: false,
    includeNonMemberFilter: false,
    page: 1,
  };
}

function parseCommaSeparatedInts(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => parseInt(part.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n > 0);
}

function parseCommaSeparatedEnums<T extends string>(
  value: string | null,
  valid: Set<T>
): T[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part): part is T => valid.has(part as T));
}

export function parseCustomerListSearchParams(
  searchParams: URLSearchParams
): CustomerListUrlFilters {
  const pageRaw = parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;

  return {
    keyword: searchParams.get("keyword") ?? "",
    communityIds: parseCommaSeparatedInts(searchParams.get("communities")),
    memberCategories: parseCommaSeparatedEnums(
      searchParams.get("memberCategories"),
      MEMBER_CATEGORIES
    ),
    auditMemberTypes: parseCommaSeparatedEnums(
      searchParams.get("auditMemberTypes"),
      AUDIT_MEMBER_TYPES
    ),
    premiumOnly: searchParams.get("premiumOnly") === "1",
    includeFormerMembers: searchParams.get("includeFormerMembers") === "1",
    includeNonMemberFilter: searchParams.get("includeNonMember") === "1",
    page,
  };
}

export function buildCustomerListSearchParams(
  filters: CustomerListUrlFilters
): URLSearchParams {
  const params = new URLSearchParams();
  const keyword = filters.keyword.trim();

  if (keyword) params.set("keyword", keyword);
  if (filters.communityIds.length > 0) {
    params.set("communities", filters.communityIds.join(","));
  }
  if (filters.memberCategories.length > 0) {
    params.set("memberCategories", filters.memberCategories.join(","));
  }
  if (filters.auditMemberTypes.length > 0) {
    params.set("auditMemberTypes", filters.auditMemberTypes.join(","));
  }
  if (filters.premiumOnly) params.set("premiumOnly", "1");
  if (filters.includeFormerMembers) params.set("includeFormerMembers", "1");
  if (filters.includeNonMemberFilter) params.set("includeNonMember", "1");
  if (filters.page > 1) params.set("page", String(filters.page));

  return params;
}

export function buildCustomerListPath(filters: CustomerListUrlFilters): string {
  const query = buildCustomerListSearchParams(filters).toString();
  return query ? `${CUSTOMER_LIST_PATH}?${query}` : CUSTOMER_LIST_PATH;
}

function sortedArraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

export function areCustomerListFiltersEqual(
  a: CustomerListUrlFilters,
  b: CustomerListUrlFilters
): boolean {
  return (
    a.keyword === b.keyword &&
    a.premiumOnly === b.premiumOnly &&
    a.includeFormerMembers === b.includeFormerMembers &&
    a.includeNonMemberFilter === b.includeNonMemberFilter &&
    a.page === b.page &&
    sortedArraysEqual(a.communityIds, b.communityIds) &&
    sortedArraysEqual(a.memberCategories, b.memberCategories) &&
    sortedArraysEqual(a.auditMemberTypes, b.auditMemberTypes)
  );
}
