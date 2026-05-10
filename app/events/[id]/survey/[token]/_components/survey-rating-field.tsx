"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Stack } from "@/components/ui/stack";
import { FormField } from "@/components/ui/form-field";

// ============================================================
// スタイルヘルパー
// ============================================================

const getRatingBoxClass = (selected: boolean) =>
  selected
    ? "border-blue-500 bg-blue-50 text-blue-900"
    : "border-muted bg-muted/50 hover:bg-accent hover:text-accent-foreground";

// ============================================================
// Props
// ============================================================

interface SurveyRatingFieldProps {
  label: string;
  required?: boolean;
  options: readonly string[];
  labels: Record<string, string>;
  value: string | null;
  onValueChange: (value: string) => void;
  reason: string;
  onReasonChange: (value: string) => void;
  idPrefix: string;
  cols?: 3 | 4;
}

// ============================================================
// コンポーネント
// ============================================================

export function SurveyRatingField({
  label,
  required = false,
  options,
  labels,
  value,
  onValueChange,
  reason,
  onReasonChange,
  idPrefix,
  cols = 4,
}: SurveyRatingFieldProps) {
  return (
    <Stack gap="md">
      <Label className="text-base font-medium">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>

      <RadioGroup
        value={value || ""}
        onValueChange={onValueChange}
        className={cols === 3 ? "grid grid-cols-3 gap-4" : "grid grid-cols-4 gap-4"}
      >
        {options.map((option) => (
          <div key={option}>
            <RadioGroupItem
              value={option}
              id={`${idPrefix}-${option}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`${idPrefix}-${option}`}
              className={`flex flex-col items-center justify-center rounded-md border-2 px-4 py-6 cursor-pointer text-center transition-colors ${getRatingBoxClass(value === option)}`}
            >
              <span className="font-semibold">{labels[option]}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>

      <FormField label="上記を選んだ理由を、具体的に教えて下さい。">
        <Textarea
          id={`${idPrefix}-reason`}
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={4}
        />
      </FormField>
    </Stack>
  );
}
