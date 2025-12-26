"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { events } from "@/lib/data/mock";
import type { EventType } from "@/lib/types";
import { EVENT_TYPES } from "@/lib/constants/event";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  // 日付フォーマットを変換（ISO8601 → YYYY-MM-DDTHH:MM）
  const formatDateForInput = (dateStr: string) => {
    return dateStr.slice(0, 16);
  };

  const [eventType, setEventType] = useState<EventType>((event as any).eventType || "ベンチャー監査役協会");
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(formatDateForInput(event.date));
  const [overview, setOverview] = useState(event.description);
  const [timetable, setTimetable] = useState((event as any).timetable || "");
  const [location, setLocation] = useState(event.location);
  const [note, setNote] = useState((event as any).note || "");
  const [responseDeadline, setResponseDeadline] = useState(
    event.responseDeadline ? formatDateForInput(event.responseDeadline) : ""
  );
  const [allowsOnline, setAllowsOnline] = useState(event.allowsOnline ?? false);
  const [hasAfterParty, setHasAfterParty] = useState(event.hasAfterParty ?? false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !date) {
      toast.error("イベント名と開催日時は必須です");
      return;
    }
    // モックデータを更新
    const eventIndex = events.findIndex((e) => e.id === id);
    if (eventIndex !== -1) {
      (events[eventIndex] as any).eventType = eventType;
      (events[eventIndex] as any).title = title;
      (events[eventIndex] as any).date = date;
      (events[eventIndex] as any).description = overview;
      (events[eventIndex] as any).location = location;
      (events[eventIndex] as any).timetable = timetable;
      (events[eventIndex] as any).note = note;
      (events[eventIndex] as any).responseDeadline = responseDeadline || undefined;
      (events[eventIndex] as any).allowsOnline = allowsOnline;
      (events[eventIndex] as any).hasAfterParty = hasAfterParty;
    }
    toast.success("イベント情報を更新しました");
    router.push(`/admin/events/${id}`);
  };

  const handleDelete = () => {
    toast.success("イベントを削除しました");
    router.push("/admin/events");
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
            <Label htmlFor="eventType">イベント種別 <span className="text-red-500">*</span></Label>
            <Select value={eventType} onValueChange={(value) => setEventType(value as EventType)}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type} className="bg-white hover:bg-gray-100">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <Label htmlFor="overview">イベント概要</Label>
            <Textarea
              id="overview"
              placeholder="イベントの概要を入力してください"
              rows={5}
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              style={{ height: '200px' }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="timetable">タイムテーブル</Label>
            <Textarea
              id="timetable"
              placeholder="タイムテーブルを入力してください"
              rows={5}
              value={timetable}
              onChange={(e) => setTimetable(e.target.value)}
              style={{ height: '200px' }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">場所</Label>
            <Textarea
              id="location"
              placeholder="例: 東京都港区六本木 1-1-1 会議室A"
              rows={3}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ height: '100px' }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note">備考</Label>
            <Textarea
              id="note"
              placeholder="備考を入力してください"
              rows={5}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ height: '100px' }}
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowsOnline"
              checked={allowsOnline}
              onCheckedChange={(checked) => setAllowsOnline(checked === true)}
            />
            <Label htmlFor="allowsOnline" className="cursor-pointer">
              オンライン参加を可能にする
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasAfterParty"
              checked={hasAfterParty}
              onCheckedChange={(checked) => setHasAfterParty(checked === true)}
            />
            <Label htmlFor="hasAfterParty" className="cursor-pointer">
              懇親会を開催する
            </Label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="outline" className="cursor-pointer">
            更新する
          </Button>
        </div>
      </form>

      <div className="pt-4 box-border">
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer">
              <Trash2 className="h-4 w-4 mr-2" />
              削除
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>イベントを削除</DialogTitle>
              <DialogDescription>
                このイベントを削除してもよろしいですか？この操作は取り消せません。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="cursor-pointer"
              >
                キャンセル
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="cursor-pointer text-destructive hover:text-destructive"
              >
                削除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
