export const ADMIN_LIST_PATH = "/admin/admins";

export type AdminListUrlFilters = {
  keyword: string;
};

export function defaultAdminListUrlFilters(): AdminListUrlFilters {
  return {
    keyword: "",
  };
}

export function parseAdminListSearchParams(
  searchParams: URLSearchParams
): AdminListUrlFilters {
  return {
    keyword: searchParams.get("keyword") ?? "",
  };
}

export function buildAdminListSearchParams(
  filters: AdminListUrlFilters
): URLSearchParams {
  const params = new URLSearchParams();
  const keyword = filters.keyword.trim();

  if (keyword) params.set("keyword", keyword);

  return params;
}

export function buildAdminListPath(filters: AdminListUrlFilters): string {
  const query = buildAdminListSearchParams(filters).toString();
  return query ? `${ADMIN_LIST_PATH}?${query}` : ADMIN_LIST_PATH;
}
