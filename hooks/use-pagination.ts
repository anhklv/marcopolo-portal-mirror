"use client";

import { useState, useMemo } from "react";

const DEFAULT_ITEMS_PER_PAGE = 20;

type UsePaginationOptions = {
  itemsPerPage?: number;
  page?: number;
  onPageChange?: (page: number) => void;
};

export function usePagination<T>(
  items: T[],
  itemsPerPageOrOptions: number | UsePaginationOptions = DEFAULT_ITEMS_PER_PAGE,
  legacyOptions?: UsePaginationOptions
) {
  const options =
    typeof itemsPerPageOrOptions === "number"
      ? { itemsPerPage: itemsPerPageOrOptions, ...legacyOptions }
      : itemsPerPageOrOptions;
  const itemsPerPage = options.itemsPerPage ?? DEFAULT_ITEMS_PER_PAGE;
  const isControlled = options.page !== undefined && options.onPageChange !== undefined;

  const [internalPage, setInternalPage] = useState(options.page ?? 1);
  const currentPage = isControlled ? options.page! : internalPage;
  const setCurrentPage = isControlled ? options.onPageChange! : setInternalPage;

  // フィルタ変更でアイテムが変わったらページ1にリセット（レンダー中の調整）
  // 外部制御時は hook 側で page を管理するため、参照変化だけではリセットしない
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    if (!isControlled) {
      setCurrentPage(1);
    }
  }

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "ellipsis")[] = [1];
    if (currentPage > 3) pages.push("ellipsis");
    if (currentPage > 1 && currentPage < totalPages) pages.push(currentPage);
    if (currentPage < totalPages - 2) pages.push("ellipsis");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    getPageNumbers,
    itemsPerPage,
  };
}
