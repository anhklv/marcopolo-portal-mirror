import type {
  SurveyRating,
  FutureParticipation,
  MembershipInterest,
} from "@/lib/generated/prisma";
import type { StepConfig } from "@/app/admin/(authenticated)/events/[id]/invite/_components/step-indicator";

// ============================================================
// アンケート送信ステップ
// ============================================================

export const SURVEY_STEPS: readonly StepConfig[] = [
  { key: "select", label: "送信先を選択", number: 1 },
  { key: "email", label: "メール文を作成", number: 2 },
  { key: "confirm", label: "確認", number: 3 },
  { key: "send", label: "送信", number: 4 },
] as const;

// ============================================================
// アンケート評価（4段階）
// ============================================================

export const SURVEY_RATING_OPTIONS: SurveyRating[] = [
  "excellent",
  "good",
  "fair",
  "poor",
];

export const SURVEY_RATING_LABELS: Record<SurveyRating, string> = {
  excellent: "よかった",
  good: "まぁよかった",
  fair: "あまりよくなかった",
  poor: "よくなかった",
};

// ============================================================
// 今後の参加について（3択）
// ============================================================

export const FUTURE_PARTICIPATION_OPTIONS: FutureParticipation[] = [
  "definitely_yes",
  "considering",
  "no",
];

export const FUTURE_PARTICIPATION_LABELS: Record<
  FutureParticipation,
  string
> = {
  definitely_yes: "ぜひ参加したい",
  considering: "参加を検討したい",
  no: "参加しない",
};

// ============================================================
// 入会について（3択）
// ============================================================

export const MEMBERSHIP_INTEREST_OPTIONS: MembershipInterest[] = [
  "want_to_join",
  "considering",
  "not_interested",
];

export const MEMBERSHIP_INTEREST_LABELS: Record<
  MembershipInterest,
  string
> = {
  want_to_join: "入会をしたい",
  considering: "入会を検討したい",
  not_interested: "関心がない",
};
