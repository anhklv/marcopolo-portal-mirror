"use client";

import { useState, useCallback } from "react";

export function useArrayToggle<T>(initialValue: T[] = []) {
  const [items, setItems] = useState<T[]>(initialValue);

  const toggle = useCallback((value: T, checked: boolean) => {
    setItems((prev) =>
      checked ? [...prev, value] : prev.filter((v) => v !== value)
    );
  }, []);

  return [items, toggle, setItems] as const;
}
