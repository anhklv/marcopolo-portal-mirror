"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { MemberCategory, AuditMemberType } from "@/lib/generated/prisma";
import {
  buildCustomerListPath,
  parseCustomerListSearchParams,
  type CustomerListUrlFilters,
} from "@/lib/helpers/customer-list-url";

export function useCustomerListFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();

  const [syncedParamsKey, setSyncedParamsKey] = useState(searchParamsKey);
  const [filters, setFilters] = useState<CustomerListUrlFilters>(() =>
    parseCustomerListSearchParams(searchParams)
  );
  const [keywordInput, setKeywordInput] = useState(
    () => parseCustomerListSearchParams(searchParams).keyword
  );
  const filtersRef = useRef(filters);

  // Next.js の Link やブラウザバック等で searchParams が変わったら state を復元
  if (searchParamsKey !== syncedParamsKey) {
    const parsed = parseCustomerListSearchParams(
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
    (next: CustomerListUrlFilters) => {
      router.replace(buildCustomerListPath(next), { scroll: false });
    },
    [router]
  );

  // キーワード以外: 変更直後に URL 同期（マウント時は URL から復元済みのため同期しない）
  const hasSyncedNonKeywordRef = useRef(false);
  useEffect(() => {
    if (!hasSyncedNonKeywordRef.current) {
      hasSyncedNonKeywordRef.current = true;
      return;
    }
    syncUrl(filtersRef.current);
  }, [
    filters.communityIds,
    filters.memberCategories,
    filters.auditMemberTypes,
    filters.premiumOnly,
    filters.includeFormerMembers,
    filters.includeNonMemberFilter,
    filters.page,
    syncUrl,
  ]);

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

  const toggleCommunityId = useCallback((communityId: number, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      communityIds: checked
        ? [...prev.communityIds, communityId]
        : prev.communityIds.filter((id) => id !== communityId),
      page: 1,
    }));
  }, []);

  const setMemberCategories = useCallback((memberCategories: MemberCategory[]) => {
    setFilters((prev) => ({ ...prev, memberCategories, page: 1 }));
  }, []);

  const toggleMemberCategory = useCallback(
    (category: MemberCategory, checked: boolean) => {
      setFilters((prev) => ({
        ...prev,
        memberCategories: checked
          ? [...prev.memberCategories, category]
          : prev.memberCategories.filter((value) => value !== category),
        page: 1,
      }));
    },
    []
  );

  const setAuditMemberTypes = useCallback((auditMemberTypes: AuditMemberType[]) => {
    setFilters((prev) => ({ ...prev, auditMemberTypes, page: 1 }));
  }, []);

  const toggleAuditMemberType = useCallback(
    (type: AuditMemberType, checked: boolean) => {
      setFilters((prev) => ({
        ...prev,
        auditMemberTypes: checked
          ? [...prev.auditMemberTypes, type]
          : prev.auditMemberTypes.filter((value) => value !== type),
        page: 1,
      }));
    },
    []
  );

  const setPremiumOnly = useCallback((premiumOnly: boolean) => {
    setFilters((prev) => ({ ...prev, premiumOnly, page: 1 }));
  }, []);

  const setIncludeFormerMembers = useCallback((includeFormerMembers: boolean) => {
    setFilters((prev) => ({ ...prev, includeFormerMembers, page: 1 }));
  }, []);

  const setIncludeNonMemberFilter = useCallback((includeNonMemberFilter: boolean) => {
    setFilters((prev) => ({ ...prev, includeNonMemberFilter, page: 1 }));
  }, []);

  return {
    filters,
    keywordInput,
    setKeywordInput,
    applyKeywordSearch,
    setPage,
    toggleCommunityId,
    setMemberCategories,
    toggleMemberCategory,
    setAuditMemberTypes,
    toggleAuditMemberType,
    setPremiumOnly,
    setIncludeFormerMembers,
    setIncludeNonMemberFilter,
  };
}
