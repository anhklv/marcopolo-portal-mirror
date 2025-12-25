"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { events, surveys, SurveyQuestion, getSurveyByEventId } from "@/lib/data/mock";

export default function SurveyCreatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const event = events.find((e) => e.id === id);
  const existingSurvey = getSurveyByEventId(id);
  
  const [questions, setQuestions] = useState<SurveyQuestion[]>(
    existingSurvey?.questions || []
  );

  const handleSave = () => {
    // 設問がある場合、タイトルが空でないことを確認
    if (questions.length > 0 && questions.some((q) => !q.title.trim())) {
      toast.error("すべての設問にタイトルを入力してください");
      return;
    }

    if (existingSurvey) {
      // 既存のアンケートを更新
      const surveyIndex = surveys.findIndex((s) => s.id === existingSurvey.id);
      if (surveyIndex !== -1) {
        surveys[surveyIndex] = {
          ...existingSurvey,
          questions: questions.map((q, index) => ({ ...q, order: index + 1 })),
        };
      }
      toast.success("アンケートを保存しました");
    } else {
      // 新規アンケートを作成
      const surveyId = `SUR${String(Date.now()).slice(-6)}`;
      const newSurvey = {
        id: surveyId,
        eventId: id,
        questions: questions.map((q, index) => ({ ...q, order: index + 1 })),
        createdAt: new Date().toISOString(),
      };
      surveys.push(newSurvey);
      toast.success("アンケートを保存しました");
    }
    // メール送信画面へ遷移
    router.push(`/admin/events/${id}/survey`);
  };

  const addQuestion = () => {
    const newQuestion: SurveyQuestion = {
      id: `q-${Date.now()}-${Math.random()}`,
      title: "",
      order: questions.length + 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter((q) => q.id !== questionId).map((q, index) => ({ ...q, order: index + 1 })));
  };

  const updateQuestionTitle = (questionId: string, title: string) => {
    setQuestions(questions.map((q) => (q.id === questionId ? { ...q, title } : q)));
  };



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

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/events/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">アンケート編集</h1>
          <p className="text-muted-foreground">
            アンケートの設問を編集します。固定の質問があるため、設問を設定しなくてもアンケート案内は可能です。
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>アンケート設問</CardTitle>
          <CardDescription>
            設問を追加してアンケートを作成します。各設問には評価と理由を入力してもらいます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`question-${question.id}`}>
                  設問 {index + 1}
                </Label>
                <Input
                  id={`question-${question.id}`}
                  value={question.title}
                  onChange={(e) => updateQuestionTitle(question.id, e.target.value)}
                  placeholder="設問タイトルを入力"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => removeQuestion(question.id)}
                className="mt-8 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addQuestion}
            className="w-full cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            設問を追加
          </Button>

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" asChild>
              <Link href={`/admin/events/${id}`}>キャンセル</Link>
            </Button>
            <Button variant="outline" onClick={() => router.push(`/admin/events/${id}/survey`)} className="cursor-pointer">
              スキップしてアンケートを送る
            </Button>
            <Button variant="outline" onClick={handleSave} className="cursor-pointer">
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

