"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { Stack } from "@/components/ui/stack";
import { PageHeader } from "@/components/ui/page-header";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import { ActionButton } from "@/components/ui/action-button";
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
        <PageHeader
          backHref="/admin/events"
          title="イベント作成"
          description="新しいイベントを作成します。"
        />

        <form onSubmit={handleFormSubmit} className="space-y-8">
          <Card>
            <CardContent>
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

                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
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
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <ActionButton type="submit">作成</ActionButton>
          </div>
        </form>
      </div>
    );
  }

  // ステップ2: イベント作成成功
  if (step === "success") {
    return (
      <div className="max-w-4xl space-y-6">
        <PageHeader
          backHref="/admin/events"
          title="イベントを作成しました"
          description="イベント情報を保存しました。次に案内メールを送信しますか？"
        />

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
              <Button variant="default" onClick={handleStartInvite} className="cursor-pointer">
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
