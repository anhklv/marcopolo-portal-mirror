import { z } from "zod";

const surveyRatingEnum = z.enum(["excellent", "good", "fair", "poor"], {
  message: "評価を選択してください",
});

const futureParticipationEnum = z.enum(
  ["definitely_yes", "considering", "no"],
  { message: "今後の参加について選択してください" }
);

const membershipInterestEnum = z.enum(
  ["want_to_join", "considering", "not_interested"],
  { message: "入会について選択してください" }
);

const toNullIfEmpty = (val: string | null | undefined) =>
  val?.trim() || null;

export const surveyAnswerSchema = z.object({
  token: z.string().min(1, "無効なトークンです"),
  questionResponses: z.array(
    z.object({
      questionId: z.number().int().positive(),
      rating: surveyRatingEnum,
      reason: z
        .string()
        .max(2000, "理由は2000文字以内で入力してください")
        .optional()
        .transform(toNullIfEmpty),
    })
  ),
  afterPartyRating: surveyRatingEnum.nullable().optional().transform((val) => val ?? null),
  afterPartyReason: z
    .string()
    .max(2000, "理由は2000文字以内で入力してください")
    .optional()
    .transform(toNullIfEmpty),
  futureParticipation: futureParticipationEnum,
  futureParticipationReason: z
    .string()
    .max(2000, "理由は2000文字以内で入力してください")
    .optional()
    .transform(toNullIfEmpty),
  membership: membershipInterestEnum.nullable().optional().transform((val) => val ?? null),
  membershipReason: z
    .string()
    .max(2000, "理由は2000文字以内で入力してください")
    .optional()
    .transform(toNullIfEmpty),
  comments: z
    .string()
    .max(5000, "ご意見・感想は5000文字以内で入力してください")
    .optional()
    .transform(toNullIfEmpty),
});

export type SurveyAnswerInput = z.infer<typeof surveyAnswerSchema>;
