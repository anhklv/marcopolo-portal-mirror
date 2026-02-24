"use client";

import { useState, useMemo } from "react";

const DEFAULT_ITEMS_PER_PAGE = 20;

export function usePagination<T>(items: T[], itemsPerPage = DEFAULT_ITEMS_PER_PAGE) {
  const [currentPage, setCurrentPage] = useState(1);

  // フィルタ変更でアイテムが変わったらページ1にリセット（レンダー中の調整）
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setCurrentPage(1);
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
