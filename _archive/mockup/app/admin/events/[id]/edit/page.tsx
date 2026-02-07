"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";
import { FormField } from "@/components/ui/form-field";
import { Stack } from "@/components/ui/stack";
import { PageHeader } from "@/components/ui/page-header";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import { ActionButton } from "@/components/ui/action-button";
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
        <PageHeader
          backHref="/admin/events"
          title="イベントが見つかりません"
          description="指定されたイベントIDの情報が見つかりませんでした。"
        />
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

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        backHref={`/admin/events/${id}`}
        title="イベント編集"
        description="イベント情報を編集・更新します。"
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <Stack gap="lg">
          <FormField label="イベント種別" required>
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
              </FormField>

              <FormField label="イベント名" required>
                <Input
                  placeholder="例: 第10回 監査役交流会"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </FormField>

              <div className="grid grid-cols-2 gap-6">
                <FormField label="開催日" required>
                  <DatePickerWithInput
                    date={eventDate}
                    setDate={setEventDate}
                  />
                </FormField>
                <FormField label="時刻" required>
                  <Input
                    type="time"
                    step="60"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    required={!!eventDate}
                  />
                </FormField>
              </div>

              <FormField label="イベント概要">
                <Textarea
                  placeholder="イベントの概要を入力してください"
                  rows={5}
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  className="min-h-[200px]"
                />
              </FormField>

              <FormField label="タイムテーブル">
                <Textarea
                  placeholder="タイムテーブルを入力してください"
                  rows={5}
                  value={timetable}
                  onChange={(e) => setTimetable(e.target.value)}
                  className="min-h-[200px]"
                />
              </FormField>

              <FormField label="場所">
                <Textarea
                  placeholder="例: 東京都港区六本木 1-1-1 会議室A"
                  rows={3}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="min-h-[100px]"
                />
              </FormField>

              <FormField label="備考">
                <Textarea
                  placeholder="備考を入力してください"
                  rows={5}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-h-[100px]"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-6">
                <FormField label="回答期限日">
                  <DatePickerWithInput
                    date={deadlineDate}
                    setDate={setDeadlineDate}
                  />
                </FormField>
                <FormField label="時刻">
                  <Input
                    type="time"
                    step="60"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    disabled={!deadlineDate}
                  />
                </FormField>
              </div>
              <p className="text-xs text-muted-foreground px-1">
                回答期限を設定しない場合、イベント開催日まで回答を受け付けます。
              </p>

              <CheckboxItem
                id="allowsOnline"
                label="オンライン参加を可能にする"
                checked={allowsOnline}
                onCheckedChange={(checked) => setAllowsOnline(checked === true)}
              />

              <CheckboxItem
                id="hasAfterParty"
                label="懇親会を開催する"
                checked={hasAfterParty}
                onCheckedChange={(checked) => setHasAfterParty(checked === true)}
              />
        </Stack>

        <div className="flex justify-center">
          <ActionButton type="submit">更新</ActionButton>
        </div>
      </form>
    </div>
  );
}
