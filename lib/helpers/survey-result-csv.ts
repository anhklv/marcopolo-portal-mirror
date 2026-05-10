import {
  SURVEY_RATING_LABELS,
  FUTURE_PARTICIPATION_LABELS,
  MEMBERSHIP_INTEREST_LABELS,
} from "@/lib/constants/survey";
import { COMMUNITY_CODE } from "@/lib/constants/community";
import type { SerializedEventDetail, SerializedSurveyResult } from "@/lib/types/serialized";
import { formatDateTime } from "@/lib/utils/event";
import { encodeCsvDocument } from "@/lib/utils/csv";
import { toSurveyResultRows, type SurveyResultRow } from "@/lib/helpers/survey-result";

function formatRatingBlock(
  rating: string | null,
  reason: string | null,
  labels: Record<string, string>
): string {
  if (!rating) return "";
  const label = labels[rating] ?? rating;
  if (reason) return `${label}\n${reason}`;
  return label;
}

/**
 * アンケート回答一覧（管理画面テーブル）と同じ列・表示で CSV 文字列を生成する（BOM 付き）
 */
export function buildSurveyResultsCsv(
  event: SerializedEventDetail,
  surveyResult: SerializedSurveyResult
): string {
  const hasNonMembers = surveyResult.respondents.some(
    (r) => !r.isMemberOfVentureAuditor
  );
  const showMembership =
    hasNonMembers &&
    event.community.code === COMMUNITY_CODE.VENTURE_AUDITOR;

  const rows = toSurveyResultRows(surveyResult);

  const headers: string[] = [
    "顧客ID",
    "回答者",
    "会社名",
    ...surveyResult.questions.map((q) => q.title),
  ];
  if (event.hasAfterParty) {
    headers.push("懇親会");
  }
  if (hasNonMembers) {
    headers.push("今後の参加について");
  }
  if (showMembership) {
    headers.push(`${event.community.name}への入会について`);
  }
  headers.push("ご意見・ご提案・感想等", "回答日時");

  const dataRows = rows.map((row) => buildDataRow(event, surveyResult, row, {
    hasNonMembers,
    showMembership,
  }));

  return encodeCsvDocument(headers, dataRows);
}

function buildDataRow(
  event: SerializedEventDetail,
  surveyResult: SerializedSurveyResult,
  row: SurveyResultRow,
  flags: { hasNonMembers: boolean; showMembership: boolean }
): string[] {
  const cells: string[] = [
    String(row.customerId),
    `${row.lastName} ${row.firstName}`.trim(),
    row.company ?? "",
  ];

  for (const q of surveyResult.questions) {
    const resp = row.questionResponses.get(q.id);
    cells.push(
      formatRatingBlock(
        resp?.rating ?? null,
        resp?.reason ?? null,
        SURVEY_RATING_LABELS
      )
    );
  }

  if (event.hasAfterParty) {
    cells.push(
      formatRatingBlock(
        row.afterPartyRating,
        row.afterPartyReason,
        SURVEY_RATING_LABELS
      )
    );
  }

  if (flags.hasNonMembers) {
    if (row.isMemberOfVentureAuditor) {
      cells.push("");
    } else {
      cells.push(
        formatRatingBlock(
          row.futureParticipation,
          row.futureParticipationReason,
          FUTURE_PARTICIPATION_LABELS
        )
      );
    }
  }

  if (flags.showMembership) {
    if (row.isMemberOfVentureAuditor) {
      cells.push("");
    } else {
      cells.push(
        formatRatingBlock(
          row.membership,
          row.membershipReason,
          MEMBERSHIP_INTEREST_LABELS
        )
      );
    }
  }

  cells.push(row.comments ?? "");
  cells.push(
    row.respondedAt ? formatDateTime(row.respondedAt) : ""
  );

  return cells;
}
