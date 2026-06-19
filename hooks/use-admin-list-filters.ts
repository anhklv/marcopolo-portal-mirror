"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  buildAdminListPath,
  parseAdminListSearchParams,
  type AdminListUrlFilters,
} from "@/lib/helpers/admin-list-url";

export function useAdminListFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();

  const [syncedParamsKey, setSyncedParamsKey] = useState(searchParamsKey);
  const [filters, setFilters] = useState<AdminListUrlFilters>(() =>
    parseAdminListSearchParams(searchParams)
  );
  const [keywordInput, setKeywordInput] = useState(
    () => parseAdminListSearchParams(searchParams).keyword
  );

  if (searchParamsKey !== syncedParamsKey) {
    const parsed = parseAdminListSearchParams(
      new URLSearchParams(searchParamsKey)
    );
    setSyncedParamsKey(searchParamsKey);
    setFilters(parsed);
    setKeywordInput(parsed.keyword);
  }

  const syncUrl = useCallback(
    (next: AdminListUrlFilters) => {
      router.replace(buildAdminListPath(next), { scroll: false });
    },
    [router]
  );

  const applyKeywordSearch = useCallback(
    (keyword?: string) => {
      const nextKeyword = keyword ?? keywordInput;
      const next = { keyword: nextKeyword };
      setKeywordInput(nextKeyword);
      setFilters(next);
      syncUrl(next);
    },
    [keywordInput, syncUrl]
  );

  return {
    filters,
    keywordInput,
    setKeywordInput,
    applyKeywordSearch,
  };
}
