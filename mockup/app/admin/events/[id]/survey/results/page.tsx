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
import { events, customers, getSurveyByEventId, getSurveyResponses } from "@/lib/data/mock";
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
  const respondedCustomerIds = new Set(responses.map((r) => r.customerId));
  const respondedCustomers = Array.from(respondedCustomerIds).map((customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    const customerResponses = responses.filter((r) => r.customerId === customerId);
    const respondedAt = customerResponses[0]?.respondedAt;
    return { customer, responses: customerResponses, respondedAt };
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
                設問 {index + 1}: {item.question.title}
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
                    <TableHead key={q.id}>設問{index + 1}</TableHead>
                  ))}
                <TableHead>回答日時</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {respondedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={survey.questions.length + 3} className="text-center text-muted-foreground">
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
                                <div className="text-xs text-muted-foreground max-w-xs truncate">
                                  {response.reason}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        );
                      })}
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

