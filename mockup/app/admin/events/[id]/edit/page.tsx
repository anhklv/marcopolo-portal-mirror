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
import type { EventType, CommunityScope } from "@/lib/types";
import { EVENT_TYPES } from "@/lib/constants/event";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/contexts/auth.context";
import { DatePickerWithInput } from "@/components/ui/date-picker-with-input";

export default function EventEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { hasPermission, currentAdmin } = useAuth();
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

  // datetime-local形式から日付と時刻を取得
  const parseDateTime = (dateTime: string): { date: Date | undefined; time: string } => {
    if (!dateTime) return { date: undefined, time: "" };
    const formatted = dateTime.slice(0, 16); // YYYY-MM-DDTHH:MM形式に統一
    const [datePart, timePart] = formatted.split("T");
    if (!datePart || !timePart) return { date: undefined, time: "" };
    const date = new Date(datePart + "T" + timePart);
    const time = timePart.slice(0, 5); // HH:MM形式（秒を削除）
    return { date: isNaN(date.getTime()) ? undefined : date, time };
  };

  // 日付と時刻をdatetime-local形式に変換
  const formatDateTime = (date: Date | undefined, time: string): string => {
    if (!date || !time) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}T${time}`;
  };

  // 初期値の設定（コミュニティ管理者の場合、権限のあるコミュニティを優先）
  const getInitialEventType = (): EventType => {
    const existingEventType = (event as any).eventType || "ベンチャー監査役の会";
    if (currentAdmin?.role === "super") {
      return existingEventType;
    }
    if (currentAdmin?.role === "community_admin" && currentAdmin.communityScopes && currentAdmin.communityScopes.length > 0) {
      // 既存のイベント種別が権限内の場合はそのまま、権限外の場合は最初の権限を設定
      if (currentAdmin.communityScopes.includes(existingEventType as CommunityScope)) {
        return existingEventType;
      }
      return currentAdmin.communityScopes[0] as EventType;
    }
    return existingEventType;
  };

  // 既存のイベントデータから日付と時刻を初期化
  const initialEventDateTime = parseDateTime(event.date);
  const initialDeadlineDateTime = event.responseDeadline ? parseDateTime(event.responseDeadline) : { date: undefined, time: "" };

  const [eventType, setEventType] = useState<EventType>(getInitialEventType());
  const [title, setTitle] = useState(event.title);
  
  // 開催日時: 日付と時刻を分けて管理
  const [eventDate, setEventDate] = useState<Date | undefined>(initialEventDateTime.date);
  const [eventTime, setEventTime] = useState(initialEventDateTime.time);
  
  // 回答期限: 日付と時刻を分けて管理
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(initialDeadlineDateTime.date);
  const [deadlineTime, setDeadlineTime] = useState(initialDeadlineDateTime.time);
  
  const [overview, setOverview] = useState(event.description);
  const [timetable, setTimetable] = useState((event as any).timetable || "");
  const [location, setLocation] = useState(event.location);
  const [note, setNote] = useState((event as any).note || "");
  const [allowsOnline, setAllowsOnline] = useState(event.allowsOnline ?? false);
  const [hasAfterParty, setHasAfterParty] = useState(event.hasAfterParty ?? false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const date = formatDateTime(eventDate, eventTime);
    if (!title || !date) {
      toast.error("イベント名と開催日時は必須です");
      return;
    }

    // 権限チェック
    const eventData = {
      eventType: eventType as CommunityScope,
    };

    if (!hasPermission("event", eventData)) {
      toast.error("このイベントを編集する権限がありません");
      return;
    }

    const responseDeadline = formatDateTime(deadlineDate, deadlineTime);

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
            {currentAdmin?.role === "super" || 
             (currentAdmin?.role === "community_admin" && 
              currentAdmin.communityScopes && 
              currentAdmin.communityScopes.length > 1) ? (
              <Select value={eventType} onValueChange={(value) => setEventType(value as EventType)}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {(currentAdmin?.role === "super" 
                    ? EVENT_TYPES 
                    : EVENT_TYPES.filter((type) => 
                        currentAdmin?.communityScopes?.includes(type as CommunityScope)
                      )
                  ).map((type) => (
                    <SelectItem key={type} value={type} className="bg-white hover:bg-gray-100">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-foreground">
                {currentAdmin?.communityScopes?.map((scope, index) => (
                  <span key={scope}>
                    {index > 0 && "、"}
                    {scope}
                  </span>
                ))}
              </div>
            )}
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

          <div className="flex gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="date-picker" className="px-1">
                開催日 <span className="text-red-500">*</span>
              </Label>
              <DatePickerWithInput
                id="date-picker"
                date={eventDate}
                setDate={setEventDate}
                className="w-32"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="time-picker" className="px-1">
                時刻 <span className="text-red-500">*</span>
              </Label>
              <Input
                type="time"
                id="time-picker"
                step="60"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none w-32"
                required={!!eventDate}
              />
            </div>
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

          <div className="flex gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="deadline-date-picker" className="px-1">
                回答期限日
              </Label>
              <DatePickerWithInput
                id="deadline-date-picker"
                date={deadlineDate}
                setDate={setDeadlineDate}
                className="w-32"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="deadline-time-picker" className="px-1">
                時刻
              </Label>
              <Input
                type="time"
                id="deadline-time-picker"
                step="60"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none w-32"
                disabled={!deadlineDate}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground px-1">
            回答期限を設定しない場合、イベント開催日まで回答を受け付けます。
          </p>

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
