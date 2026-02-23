"use client";

import { useState } from "react";

export function useFieldErrors() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  return { fieldErrors, setFieldErrors, generalError, setGeneralError, clearFieldError };
}
