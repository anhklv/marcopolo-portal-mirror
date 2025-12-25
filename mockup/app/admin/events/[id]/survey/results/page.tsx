"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { events, customers, getSurveyByEventId, getSurveyResponses, getFixedSurveyResponses, FixedSurveyResponse } from "@/lib/data/mock";
import { formatEventDate, formatDateTime } from "@/lib/utils";

export default function SurveyResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const event = events.find((e) => e.id === id);
  const survey = getSurveyByEventId(id);

  if (!event) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">イベントが見つかりませんでした。</p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/admin/events">イベント一覧に戻る</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/events/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">アンケート結果</h1>
            <p className="text-muted-foreground">
              このイベントにはアンケートが作成されていません。
            </p>
          </div>
        </div>
      </div>
    );
  }

  const responses = getSurveyResponses(survey.id);
  const fixedResponses = getFixedSurveyResponses(survey.id);
  const respondedCustomerIds = new Set(responses.map((r) => r.customerId));
  const respondedCustomers = Array.from(respondedCustomerIds).map((customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    const customerResponses = responses.filter((r) => r.customerId === customerId);
    const customerFixedResponse = fixedResponses.find((fr) => fr.customerId === customerId);
    const respondedAt = customerResponses[0]?.respondedAt || customerFixedResponse?.respondedAt;
    return { customer, responses: customerResponses, fixedResponse: customerFixedResponse, respondedAt };
  }).filter((item) => item.customer !== undefined);

  // 集計データ
  const summary = survey.questions.map((question: any) => {
    const questionResponses = responses.filter((r) => r.questionId === question.id);
    const ratingCounts = {
      よかった: questionResponses.filter((r) => r.rating === "よかった").length,
      まぁよかった: questionResponses.filter((r) => r.rating === "まぁよかった").length,
      あまりよくなかった: questionResponses.filter((r) => r.rating === "あまりよくなかった").length,
      よくなかった: questionResponses.filter((r) => r.rating === "よくなかった").length,
    };
    return { question, ratingCounts, total: questionResponses.length };
  });

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/events/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">アンケート結果</h1>
          <p className="text-muted-foreground">
            {event.title} のアンケート回答結果
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>集計</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {summary.map((item, index) => (
            <div key={item.question.id} className="space-y-2">
              <div className="font-medium">
                {item.question.title}
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{item.ratingCounts.よかった}</div>
                  <div className="text-xs text-green-800">よかった</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{item.ratingCounts.まぁよかった}</div>
                  <div className="text-xs text-blue-800">まぁよかった</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{item.ratingCounts.あまりよくなかった}</div>
                  <div className="text-xs text-yellow-800">あまりよくなかった</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{item.ratingCounts.よくなかった}</div>
                  <div className="text-xs text-red-800">よくなかった</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                回答数: {item.total}件
              </div>
            </div>
          ))}

          {/* 固定設問: 懇親会 */}
          {event.hasAfterParty && (
            <div className="space-y-2 pt-4 border-t">
              <div className="font-medium">懇親会</div>
              {(() => {
                const afterPartyResponses = fixedResponses.filter((fr) => fr.afterParty);
                const ratingCounts = {
                  よかった: afterPartyResponses.filter((fr) => fr.afterParty?.rating === "よかった").length,
                  まぁよかった: afterPartyResponses.filter((fr) => fr.afterParty?.rating === "まぁよかった").length,
                  あまりよくなかった: afterPartyResponses.filter((fr) => fr.afterParty?.rating === "あまりよくなかった").length,
                  よくなかった: afterPartyResponses.filter((fr) => fr.afterParty?.rating === "よくなかった").length,
                };
                return (
                  <>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{ratingCounts.よかった}</div>
                        <div className="text-xs text-green-800">よかった</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{ratingCounts.まぁよかった}</div>
                        <div className="text-xs text-blue-800">まぁよかった</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{ratingCounts.あまりよくなかった}</div>
                        <div className="text-xs text-yellow-800">あまりよくなかった</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{ratingCounts.よくなかった}</div>
                        <div className="text-xs text-red-800">よくなかった</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      回答数: {afterPartyResponses.length}件
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* 固定設問: 今後の参加について */}
          <div className="space-y-2 pt-4 border-t">
            <div className="font-medium">今後の参加について</div>
            {(() => {
              const futureResponses = fixedResponses.filter((fr) => fr.futureParticipation);
              const ratingCounts = {
                ぜひ参加したい: futureResponses.filter((fr) => fr.futureParticipation?.rating === "ぜひ参加したい").length,
                参加を検討したい: futureResponses.filter((fr) => fr.futureParticipation?.rating === "参加を検討したい").length,
                参加しない: futureResponses.filter((fr) => fr.futureParticipation?.rating === "参加しない").length,
              };
              return (
                <>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{ratingCounts.ぜひ参加したい}</div>
                      <div className="text-xs text-green-800">ぜひ参加したい</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{ratingCounts.参加を検討したい}</div>
                      <div className="text-xs text-blue-800">参加を検討したい</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{ratingCounts.参加しない}</div>
                      <div className="text-xs text-yellow-800">参加しない</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    回答数: {futureResponses.length}件
                  </div>
                </>
              );
            })()}
          </div>

          {/* 固定設問: ベンチャー監査役協会への入会について */}
          {respondedCustomers.some((item) => item.customer!.memberTypes.length === 0) && (
            <div className="space-y-2 pt-4 border-t">
              <div className="font-medium">ベンチャー監査役協会への入会について</div>
              {(() => {
                const membershipResponses = fixedResponses.filter((fr) => {
                  const customer = customers.find((c) => c.id === fr.customerId);
                  return customer && customer.memberTypes.length === 0 && fr.membership;
                });
                const ratingCounts = {
                  入会をしたい: membershipResponses.filter((fr) => fr.membership?.rating === "入会をしたい").length,
                  入会を検討したい: membershipResponses.filter((fr) => fr.membership?.rating === "入会を検討したい").length,
                  関心がない: membershipResponses.filter((fr) => fr.membership?.rating === "関心がない").length,
                };
                return (
                  <>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{ratingCounts.入会をしたい}</div>
                        <div className="text-xs text-green-800">入会をしたい</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{ratingCounts.入会を検討したい}</div>
                        <div className="text-xs text-blue-800">入会を検討したい</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{ratingCounts.関心がない}</div>
                        <div className="text-xs text-yellow-800">関心がない</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      回答数: {membershipResponses.length}件
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>回答一覧</CardTitle>
          <CardDescription>
            回答者: {respondedCustomers.length}名
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>回答者</TableHead>
                <TableHead>会社名</TableHead>
                {survey.questions
                  .sort((a: any, b: any) => a.order - b.order)
                  .map((q: any, index: number) => (
                    <TableHead key={q.id}>{q.title}</TableHead>
                  ))}
                {event.hasAfterParty && <TableHead>懇親会</TableHead>}
                <TableHead>今後の参加について</TableHead>
                {respondedCustomers.some((item) => item.customer!.memberTypes.length === 0) && (
                  <TableHead>ベンチャー監査役協会への入会について</TableHead>
                )}
                <TableHead>ご意見・ご提案・感想等</TableHead>
                <TableHead>回答日時</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {respondedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={survey.questions.length + (event.hasAfterParty ? 1 : 0) + 2 + (respondedCustomers.some((item) => item.customer!.memberTypes.length === 0) ? 1 : 0) + 2} className="text-center text-muted-foreground">
                    まだ回答がありません
                  </TableCell>
                </TableRow>
              ) : (
                respondedCustomers.map((item) => (
                  <TableRow key={item.customer!.id}>
                    <TableCell>{item.customer!.name}</TableCell>
                    <TableCell>{item.customer!.company}</TableCell>
                    {survey.questions
                      .sort((a: any, b: any) => a.order - b.order)
                      .map((q: any) => {
                        const response = item.responses.find((r) => r.questionId === q.id);
                        return (
                          <TableCell key={q.id}>
                            {response ? (
                              <div className="space-y-1">
                                <Badge
                                  variant={
                                    response.rating === "よかった"
                                      ? "default"
                                      : response.rating === "まぁよかった"
                                      ? "secondary"
                                      : response.rating === "あまりよくなかった"
                                      ? "outline"
                                      : "destructive"
                                  }
                                >
                                  {response.rating}
                                </Badge>
                                {response.reason && (
                                  <div className="text-xs text-muted-foreground max-w-xs truncate">
                                    {response.reason}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        );
                      })}
                    {event.hasAfterParty && (
                      <TableCell>
                        {item.fixedResponse?.afterParty ? (
                          <div className="space-y-1">
                            <Badge
                              variant={
                                item.fixedResponse.afterParty.rating === "よかった"
                                  ? "default"
                                  : item.fixedResponse.afterParty.rating === "まぁよかった"
                                  ? "secondary"
                                  : item.fixedResponse.afterParty.rating === "あまりよくなかった"
                                  ? "outline"
                                  : "destructive"
                              }
                            >
                              {item.fixedResponse.afterParty.rating}
                            </Badge>
                            {item.fixedResponse.afterParty.reason && (
                              <div className="text-xs text-muted-foreground max-w-xs truncate">
                                {item.fixedResponse.afterParty.reason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {item.fixedResponse?.futureParticipation ? (
                        <div className="space-y-1">
                          <Badge variant="secondary">
                            {item.fixedResponse.futureParticipation.rating}
                          </Badge>
                          {item.fixedResponse.futureParticipation.reason && (
                            <div className="text-xs text-muted-foreground max-w-xs truncate">
                              {item.fixedResponse.futureParticipation.reason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {respondedCustomers.some((i) => i.customer!.memberTypes.length === 0) && (
                      <TableCell>
                        {item.customer!.memberTypes.length === 0 && item.fixedResponse?.membership ? (
                          <div className="space-y-1">
                            <Badge variant="secondary">
                              {item.fixedResponse.membership.rating}
                            </Badge>
                            {item.fixedResponse.membership.reason && (
                              <div className="text-xs text-muted-foreground max-w-xs truncate">
                                {item.fixedResponse.membership.reason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {item.fixedResponse?.comments ? (
                        <div className="text-xs text-muted-foreground max-w-xs truncate">
                          {item.fixedResponse.comments}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.respondedAt ? formatDateTime(item.respondedAt) : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

