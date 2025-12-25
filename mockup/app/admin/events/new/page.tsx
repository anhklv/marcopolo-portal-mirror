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
import { events, EventType } from "@/lib/data/mock";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NewEventPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "success">("form");
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  // フォームデータ
  const [eventType, setEventType] = useState<EventType>("ベンチャー監査役協会");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [overview, setOverview] = useState("");
  const [timetable, setTimetable] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [responseDeadline, setResponseDeadline] = useState("");
  const [allowsOnline, setAllowsOnline] = useState(false);
  const [hasAfterParty, setHasAfterParty] = useState(false);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !date) {
      toast.error("イベント名と開催日時は必須です");
      return;
    }

    // イベントを保存（モック: 実際はAPI呼び出し）
    // イベントIDを生成（モック: 実際はサーバーから返される）
    const eventId = `E${String(Date.now()).slice(-6)}`;

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
            <h1 className="text-3xl font-bold tracking-tight">イベント作成</h1>
            <p className="text-muted-foreground">
              新しいイベントを作成します。
            </p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-8 rounded-lg border p-8 shadow-sm">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="eventType">イベント種別 <span className="text-red-500">*</span></Label>
              <Select value={eventType} onValueChange={(value) => setEventType(value as EventType)}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="ベンチャー監査役協会" className="bg-white hover:bg-gray-100">
                    ベンチャー監査役協会
                  </SelectItem>
                  <SelectItem value="ないかんMeetup" className="bg-white hover:bg-gray-100">
                    ないかんMeetup
                  </SelectItem>
                  <SelectItem value="その他" className="bg-white hover:bg-gray-100">
                    その他
                  </SelectItem>
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
            <h1 className="text-3xl font-bold tracking-tight">イベントを作成しました</h1>
            <p className="text-muted-foreground">
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
              <div className="text-sm text-muted-foreground">作成したイベント:</div>
              <div className="text-lg font-medium">{title}</div>
              <div className="text-sm text-muted-foreground">{date}</div>
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
