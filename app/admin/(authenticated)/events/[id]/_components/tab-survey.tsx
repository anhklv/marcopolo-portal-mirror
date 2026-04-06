"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/event";
import {
  SURVEY_RATING_LABELS,
  FUTURE_PARTICIPATION_LABELS,
  MEMBERSHIP_INTEREST_LABELS,
} from "@/lib/constants/survey";
import { COMMUNITY_CODE } from "@/lib/constants/community";
import {
  computeSurveyAggregation,
  toSurveyResultRows,
  getSurveyRatingBgClass,
} from "@/lib/helpers/survey-result";
import type { RatingCount } from "@/lib/helpers/survey-result";
import type {
  SerializedEventDetail,
  SerializedSurveyResult,
} from "@/lib/types/serialized";

// ============================================================
// 型定義
// ============================================================

interface TabSurveyProps {
  event: SerializedEventDetail;
  surveyResult: SerializedSurveyResult | null;
}

// ============================================================
// サブコンポーネント
// ============================================================

function RatingCell({
  rating,
  reason,
  labels,
}: {
  rating: string | null;
  reason: string | null;
  labels: Record<string, string>;
}) {
  if (!rating) {
    return <span className="text-muted-foreground">-</span>;
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

function RatingGrid({
  title,
  counts,
  cols,
}: {
  title: string;
  counts: RatingCount[];
  cols: number;
}) {
  const bgClasses = ["bg-gray-50", "bg-gray-100", "bg-gray-200", "bg-gray-300"];
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

// ============================================================
// メインコンポーネント
// ============================================================

export function TabSurvey({ event, surveyResult }: TabSurveyProps) {
  const aggregation = useMemo(
    () =>
      surveyResult
        ? computeSurveyAggregation(surveyResult, event.hasAfterParty, event.community.code)
        : null,
    [surveyResult, event.hasAfterParty, event.community.code]
  );

  const rows = useMemo(
    () => (surveyResult ? toSurveyResultRows(surveyResult) : []),
    [surveyResult]
  );

  // 空状態
  if (!surveyResult || surveyResult.respondents.length === 0) {
    return (
      <Card className="border-0">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              アンケート結果が存在しません。
            </p>
            <p className="text-sm text-muted-foreground">
              <Link
                href={`/admin/events/${event.id}/survey/create`}
                className="text-primary hover:underline"
              >
                アンケート管理画面
              </Link>
              からアンケート管理及び送付を行ってください。
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasNonMembers = surveyResult.respondents.some(
    (r) => !r.isMemberOfVentureAuditor
  );
  const showMembership =
    hasNonMembers &&
    event.community.code === COMMUNITY_CODE.VENTURE_AUDITOR;

  return (
    <>
      {/* 集計カード */}
      <Card className="border-0">
        <CardContent className="space-y-6">
          <SectionHeading>集計</SectionHeading>

          {/* カスタム設問 */}
          {aggregation!.questions.map((q) => (
            <RatingGrid
              key={q.questionId}
              title={q.title}
              counts={q.ratingCounts}
              cols={4}
            />
          ))}

          {/* 懇親会 */}
          {aggregation!.afterParty && (
            <div className="pt-4 border-t">
              <RatingGrid
                title="懇親会"
                counts={aggregation!.afterParty}
                cols={4}
              />
            </div>
          )}

          {/* 今後の参加について（非会員のみ） */}
          {aggregation!.futureParticipation && (
            <div className="pt-4 border-t">
              <RatingGrid
                title="今後の参加について"
                counts={aggregation!.futureParticipation}
                cols={3}
              />
            </div>
          )}

          {/* 入会について（非会員のみ） */}
          {aggregation!.membership && (
            <div className="pt-4 border-t">
              <RatingGrid
                title={`${event.community.name}への入会について`}
                counts={aggregation!.membership}
                cols={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 回答一覧カード */}
      <Card className="border-0">
        <CardContent>
          <div className="space-y-2 mb-4">
            <SectionHeading>回答一覧</SectionHeading>
            <p className="text-sm text-muted-foreground">
              回答者: {surveyResult.respondents.length}名
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table className="[&_th]:py-3 [&_td]:py-3">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 bg-white">
                    回答者
                  </TableHead>
                  <TableHead>会社名</TableHead>
                  {surveyResult.questions.map((q) => (
                    <TableHead key={q.id}>{q.title}</TableHead>
                  ))}
                  {event.hasAfterParty && <TableHead>懇親会</TableHead>}
                  {hasNonMembers && (
                    <TableHead>今後の参加について</TableHead>
                  )}
                  {showMembership && (
                    <TableHead>
                      {event.community.name}への入会について
                    </TableHead>
                  )}
                  <TableHead>ご意見・ご提案・感想等</TableHead>
                  <TableHead>回答日時</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.customerId}>
                    <TableCell className="sticky left-0 z-10 bg-white">
                      {row.lastName} {row.firstName}
                    </TableCell>
                    <TableCell>{row.company}</TableCell>
                    {surveyResult.questions.map((q) => {
                      const resp = row.questionResponses.get(q.id);
                      return (
                        <TableCell key={q.id}>
                          <RatingCell
                            rating={resp?.rating ?? null}
                            reason={resp?.reason ?? null}
                            labels={SURVEY_RATING_LABELS}
                          />
                        </TableCell>
                      );
                    })}
                    {event.hasAfterParty && (
                      <TableCell>
                        <RatingCell
                          rating={row.afterPartyRating}
                          reason={row.afterPartyReason}
                          labels={SURVEY_RATING_LABELS}
                        />
                      </TableCell>
                    )}
                    {hasNonMembers && (
                      <TableCell>
                        {!row.isMemberOfVentureAuditor ? (
                          <RatingCell
                            rating={row.futureParticipation}
                            reason={row.futureParticipationReason}
                            labels={FUTURE_PARTICIPATION_LABELS}
                          />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    )}
                    {showMembership && (
                      <TableCell>
                        {!row.isMemberOfVentureAuditor ? (
                          <RatingCell
                            rating={row.membership}
                            reason={row.membershipReason}
                            labels={MEMBERSHIP_INTEREST_LABELS}
                          />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {row.comments ? (
                        <div className="text-xs text-muted-foreground max-w-xs truncate">
                          {row.comments}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.respondedAt
                        ? formatDateTime(row.respondedAt)
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
