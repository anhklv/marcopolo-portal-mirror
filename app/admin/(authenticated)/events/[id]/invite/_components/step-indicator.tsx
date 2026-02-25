import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface StepConfig {
  key: string;
  label: string;
  number: number;
}

export const INVITE_STEPS: readonly StepConfig[] = [
  { key: "select", label: "案内者を選択", number: 1 },
  { key: "email", label: "メール文作成", number: 2 },
  { key: "confirm", label: "確認", number: 3 },
  { key: "send", label: "送信", number: 4 },
] as const;

export function StepIndicator({
  currentStep,
  steps = INVITE_STEPS,
}: {
  currentStep: string;
  steps?: readonly StepConfig[];
}) {
  const getStepStatus = (stepKey: string) => {
    const currentIndex = steps.findIndex((s) => s.key === currentStep);
    const stepIndex = steps.findIndex((s) => s.key === stepKey);

    // "send" はインジケータ表示専用で、実際のstep状態としては使わない
    if (stepKey === "send") return "upcoming";
    if (stepIndex <= currentIndex) return "completed";
    return "upcoming";
  };

  return (
    <div className="flex items-center justify-between w-full mb-6">
      {steps.map((stepItem) => {
        const status = getStepStatus(stepItem.key);
        return (
          <div key={stepItem.key} className="flex flex-col items-center flex-1">
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors mb-2",
                status === "completed" && "bg-primary text-primary-foreground border-primary",
                status === "upcoming" && "bg-background text-muted-foreground border-muted"
              )}
            >
              {status === "completed" ? <Check className="h-5 w-5" /> : <span className="text-sm font-medium">{stepItem.number}</span>}
            </div>
            <div className={cn("text-sm font-medium text-center", status === "upcoming" && "text-muted-foreground")}>
              {stepItem.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
