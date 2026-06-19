"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EventDisplayStatus } from "@/lib/constants/event";
import {
  buildEventListPath,
  parseEventListSearchParams,
  type EventListUrlFilters,
} from "@/lib/helpers/event-list-url";

export function useEventListFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();

  const [syncedParamsKey, setSyncedParamsKey] = useState(searchParamsKey);
  const [filters, setFilters] = useState<EventListUrlFilters>(() =>
    parseEventListSearchParams(searchParams)
  );
  const [keywordInput, setKeywordInput] = useState(
    () => parseEventListSearchParams(searchParams).keyword
  );
  const filtersRef = useRef(filters);

  if (searchParamsKey !== syncedParamsKey) {
    const parsed = parseEventListSearchParams(
      new URLSearchParams(searchParamsKey)
    );
    setSyncedParamsKey(searchParamsKey);
    setFilters(parsed);
    setKeywordInput(parsed.keyword);
  }

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const syncUrl = useCallback(
    (next: EventListUrlFilters) => {
      router.replace(buildEventListPath(next), { scroll: false });
    },
    [router]
  );

  const hasSyncedNonKeywordRef = useRef(false);
  useEffect(() => {
    if (!hasSyncedNonKeywordRef.current) {
      hasSyncedNonKeywordRef.current = true;
      return;
    }
    syncUrl(filtersRef.current);
  }, [filters.statuses, filters.eventTypeCodes, filters.page, syncUrl]);

  const applyKeywordSearch = useCallback(
    (keyword?: string) => {
      const nextKeyword = keyword ?? keywordInput;
      const next = {
        ...filtersRef.current,
        keyword: nextKeyword,
        page: filtersRef.current.keyword !== nextKeyword ? 1 : filtersRef.current.page,
      };
      setKeywordInput(nextKeyword);
      setFilters(next);
      syncUrl(next);
    },
    [keywordInput, syncUrl]
  );

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const toggleStatus = useCallback(
    (status: EventDisplayStatus, checked: boolean) => {
      setFilters((prev) => ({
        ...prev,
        statuses: checked
          ? [...prev.statuses, status]
          : prev.statuses.filter((value) => value !== status),
        page: 1,
      }));
    },
    []
  );

  const toggleEventTypeCode = useCallback((code: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      eventTypeCodes: checked
        ? [...prev.eventTypeCodes, code]
        : prev.eventTypeCodes.filter((value) => value !== code),
      page: 1,
    }));
  }, []);

  return {
    filters,
    keywordInput,
    setKeywordInput,
    applyKeywordSearch,
    setPage,
    toggleStatus,
    toggleEventTypeCode,
  };
}
