"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";
import { events } from "@/lib/data/mock";
import type { EventType, CommunityScope } from "@/lib/types";
import { EVENT_TYPES } from "@/lib/constants/event";
import { formatEventDate } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/contexts/auth.context";
import { DatePickerWithInput } from "@/components/ui/date-picker-with-input";

export default function NewEventPage() {
  const router = useRouter();
  const { hasPermission, currentAdmin } = useAuth();
  const [step, setStep] = useState<"form" | "success">("form");
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  // 初期値の設定
  const getInitialEventType = (): EventType => {
    if (currentAdmin?.role === "super") {
      return "ベンチャー監査役の会"; // デフォルト値
    }
    if (currentAdmin?.role === "community_admin" && currentAdmin.communityScopes && currentAdmin.communityScopes.length > 0) {
      return currentAdmin.communityScopes[0] as EventType;
    }
    return "ベンチャー監査役の会";
  };

  // フォームデータ
  const [eventType, setEventType] = useState<EventType>(getInitialEventType());
  const [title, setTitle] = useState("");
  
  // 開催日時: 日付と時刻を分けて管理
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [eventTime, setEventTime] = useState("");
  
  // 回答期限: 日付と時刻を分けて管理
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
  const [deadlineTime, setDeadlineTime] = useState("");
  
  const [overview, setOverview] = useState("");
  const [timetable, setTimetable] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [allowsOnline, setAllowsOnline] = useState(false);
  const [hasAfterParty, setHasAfterParty] = useState(false);

  // 日付と時刻をdatetime-local形式に変換
  const formatDateTime = (date: Date | undefined, time: string): string => {
    if (!date || !time) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}T${time}`;
  };

  // datetime-local形式から日付と時刻を取得
  const parseDateTime = (dateTime: string): { date: Date | undefined; time: string } => {
    if (!dateTime) return { date: undefined, time: "" };
    const [datePart, timePart] = dateTime.split("T");
    if (!datePart || !timePart) return { date: undefined, time: "" };
    const date = new Date(datePart + "T" + timePart);
    const time = timePart.slice(0, 5); // HH:MM形式（秒を削除）
    return { date: isNaN(date.getTime()) ? undefined : date, time };
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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
      toast.error("このイベントを登録する権限がありません");
      return;
    }

    // イベントを保存（モック: 実際はAPI呼び出し）
    // イベントIDを生成（モック: 実際はサーバーから返される）
    const eventId = `E${String(Date.now()).slice(-6)}`;

    const responseDeadline = formatDateTime(deadlineDate, deadlineTime);

    // モックデータへ即時反映して、遷移先でも参照できるようにする
    events.push({
      id: eventId,
      title,
      date,
      location: location || "",
      description: overview || "",
      eventType,
      attendeesCount: 0,
      responseDeadline: responseDeadline || undefined,
      isPaused: false,
      allowsOnline,
      hasAfterParty,
      ...(timetable ? { timetable } : {}),
      ...(note ? { note } : {}),
    } as any);

    setCreatedEventId(eventId);

    // 成功メッセージを表示
    toast.success("イベントを作成しました");

    // 成功画面へ
    setStep("success");
  };

  const handleStartInvite = () => {
    // 案内ページへ遷移
    if (createdEventId) {
      router.push(`/admin/events/${createdEventId}/invite`);
    }
  };

  const handleSkipInvite = () => {
    // イベント詳細ページへ遷移
    if (createdEventId) {
      router.push(`/admin/events/${createdEventId}`);
    } else {
      router.push("/admin/events");
    }
  };

  // ステップ1: フォーム入力
  if (step === "form") {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">イベント作成</h1>
            <p className="text-sm text-muted-foreground">
              新しいイベントを作成します。
            </p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-8 rounded-lg border p-8 shadow-sm">
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

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/admin/events">キャンセル</Link>
            </Button>
            <Button type="submit" variant="outline" className="cursor-pointer">作成する</Button>
          </div>
        </form>
      </div>
    );
  }

  // ステップ2: イベント作成成功
  if (step === "success") {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">イベントを作成しました</h1>
            <p className="text-sm text-muted-foreground">
              イベント情報を保存しました。次に案内メールを送信しますか？
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>次のステップ</CardTitle>
            <CardDescription>
              作成したイベントに案内メールを送信するか、後で送信することができます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-lg font-bold">{title}</div>
              <div className="text-sm text-muted-foreground">
                開催日時: {formatEventDate(formatDateTime(eventDate, eventTime))}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={handleSkipInvite} className="cursor-pointer">
                後で送信する
              </Button>
              <Button variant="outline" onClick={handleStartInvite} className="cursor-pointer">
                <Mail className="h-4 w-4" />
                案内メールを送信する
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
