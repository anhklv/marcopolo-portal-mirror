"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getSurveyRatingBgClass } from "@/lib/helpers/survey-result";
import type { RatingCount } from "@/lib/helpers/survey-result";

// ============================================================
// RatingCell: テーブル内の評価表示
// ============================================================

interface RatingCellProps {
  rating: string | null;
  reason: string | null;
  labels: Record<string, string>;
}

export function RatingCell({ rating, reason, labels }: RatingCellProps) {
  if (!rating) {
    return null;
  }
  const label = labels[rating] ?? rating;
  return (
    <div className="space-y-1">
      <Badge
        variant="secondary"
        className={cn("font-medium", getSurveyRatingBgClass(rating))}
      >
        {label}
      </Badge>
      {reason && (
        <div className="text-xs text-muted-foreground max-w-xs truncate">
          {reason}
        </div>
      )}
    </div>
  );
}

// ============================================================
// RatingGrid: 集計グリッド表示
// ============================================================

interface RatingGridProps {
  title: string;
  counts: RatingCount[];
  cols: number;
}

const bgClasses = ["bg-gray-50", "bg-gray-100", "bg-gray-200", "bg-gray-300"];

export function RatingGrid({ title, counts, cols }: RatingGridProps) {
  return (
    <div className="space-y-2">
      <div className="font-medium">{title}</div>
      <div
        className={cn(
          "grid gap-4 text-sm",
          cols === 3 ? "grid-cols-3" : "grid-cols-4"
        )}
      >
        {counts.map((item, i) => (
          <div
            key={item.key}
            className={cn(
              "text-center p-3 rounded-lg",
              bgClasses[i] ?? "bg-gray-50"
            )}
          >
            <div className="text-2xl font-bold text-gray-800">{item.count}</div>
            <div className="text-xs text-gray-700">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
