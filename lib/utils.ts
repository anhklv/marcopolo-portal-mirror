import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** ISO形式(YYYY-MM-DDまたはYYYY-MM-DDTHH:mm:ss.sssZ) → 表示形式(YYYY/MM/DD) */
export function isoToDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 10).replace(/-/g, "/");
}

/** Next.js の redirect() が投げるエラーかどうか判定する */
export function isRedirectError(err: unknown): boolean {
  return err instanceof Error && err.message.includes("NEXT_REDIRECT");
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}
