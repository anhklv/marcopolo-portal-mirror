"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { events } from "@/lib/data/mock";

export default function EventEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const event = events.find((e) => e.id === id);

  if (!event) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">イベントが見つかりません</h1>
            <p className="text-muted-foreground">
              指定されたイベントIDの情報が見つかりませんでした。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 日付フォーマットを変換（YYYY-MM-DD HH:MM → YYYY-MM-DDTHH:MM）
  const formatDateForInput = (dateStr: string) => {
    return dateStr.replace(" ", "T");
  };

  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(formatDateForInput(event.date));
  const [location, setLocation] = useState(event.location);
  const [description, setDescription] = useState(event.description);
  const [responseDeadline, setResponseDeadline] = useState(
    event.responseDeadline ? formatDateForInput(event.responseDeadline) : ""
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success("イベント情報を更新しました");
    router.push(`/admin/events/${id}`);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/events/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">イベント編集</h1>
          <p className="text-muted-foreground">
            イベント情報を編集・更新します。
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border p-8 shadow-sm">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">イベント名 <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              placeholder="例: 第10回 監査役交流会"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">開催日時 <span className="text-red-500">*</span></Label>
            <Input
              id="date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">場所 <span className="text-red-500">*</span></Label>
            <Input
              id="location"
              placeholder="例: 東京都港区六本木 1-1-1 会議室A"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">詳細説明</Label>
            <Textarea
              id="description"
              placeholder="イベントの詳細やテーマなどを入力してください"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="responseDeadline">回答期限</Label>
            <Input
              id="responseDeadline"
              type="datetime-local"
              value={responseDeadline}
              onChange={(e) => setResponseDeadline(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              回答期限を設定しない場合、イベント開催日まで回答を受け付けます。
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="outline" className="cursor-pointer">
            更新する
          </Button>
        </div>
      </form>
    </div>
  );
}


