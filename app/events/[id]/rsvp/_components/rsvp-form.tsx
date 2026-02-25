"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/ui/stack";
import { FormField } from "@/components/ui/form-field";
import { ActionButton } from "@/components/ui/action-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { formatEventDate } from "@/lib/utils/event";
import { useRsvpForm } from "./use-rsvp-form";
import type { SerializedRsvpPageData } from "@/lib/types/serialized";

interface RsvpFormProps {
  data: SerializedRsvpPageData;
}

export function RsvpForm({ data }: RsvpFormProps) {
  const {
    isPending,
    submitted,
    status,
    afterPartyStatus,
    setAfterPartyStatus,
    comment,
    setComment,
    isDeadlinePassed,
    handleStatusChange,
    handleSubmit,
    handleChangeResponse,
  } = useRsvpForm({ data });

  const { event, customer } = data;
  const customerName = `${customer.lastName} ${customer.firstName}`;

  // 完了画面
  if (submitted) {
    return (
      <div className="min-h-screen bg-muted py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-lg border bg-card p-6 shadow-sm text-center">
            <Stack gap="lg">
              <Stack gap="md">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  回答を受け付けました
                </h1>
                <p className="text-sm text-muted-foreground">
                  ご回答ありがとうございます。
                  {status === "attend" && (
                    <>
                      <br />
                      当日お会いできるのを楽しみにしています。
                    </>
                  )}
                  {status === "online" && (
                    <>
                      <br />
                      オンラインでのご参加をお待ちしています。
                    </>
                  )}
                </p>
              </Stack>
              <Stack gap="sm">
                <p className="text-sm text-muted-foreground">
                  この画面を閉じてください
                </p>
                {!isDeadlinePassed && (
                  <div className="flex justify-center">
                    <ActionButton
                      variant="outline"
                      onClick={handleChangeResponse}
                    >
                      回答を変更する
                    </ActionButton>
                  </div>
                )}
              </Stack>
            </Stack>
          </div>
        </div>
      </div>
    );
  }

  // 回答フォーム
  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <Stack gap="lg">
            {/* イベント情報ヘッダ */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {event.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                開催日時: {formatEventDate(event.date)}
              </p>
              {event.location && (
                <p className="mt-1 text-sm text-muted-foreground">
                  場所: {event.location}
                </p>
              )}
              <div className="mt-4">
                <EventDetailDialog event={event} />
              </div>
            </div>

            {/* 回答者情報 */}
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium">回答者: {customerName}様</p>
            </div>

            {/* 回答期限切れ警告 */}
            {isDeadlinePassed && (
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">回答期限を過ぎています</p>
                  {event.responseDeadline && (
                    <p className="text-xs mt-1">
                      回答期限: {formatEventDate(event.responseDeadline)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 出欠選択 */}
            <Stack gap="md">
              <Label className="text-base">出欠を選択してください</Label>
              <RadioGroup
                value={status ?? undefined}
                onValueChange={handleStatusChange}
                className={`grid gap-4 ${event.allowsOnline ? "grid-cols-3" : "grid-cols-2"}`}
              >
                <RadioOption
                  value="attend"
                  label={event.allowsOnline ? "現地参加" : "参加する"}
                  selected={status === "attend"}
                  colorClass="border-green-500 bg-green-50 text-green-900"
                />
                {event.allowsOnline && (
                  <RadioOption
                    value="online"
                    label="オンライン参加"
                    selected={status === "online"}
                    colorClass="border-blue-500 bg-blue-50 text-blue-900"
                  />
                )}
                <RadioOption
                  value="decline"
                  label="参加しない"
                  selected={status === "decline"}
                  colorClass="border-red-500 bg-red-50 text-red-900"
                />
              </RadioGroup>
            </Stack>

            {/* 懇親会（条件付き表示） */}
            {event.hasAfterParty && status === "attend" && (
              <Stack gap="md">
                <Label className="text-base">
                  懇親会も参加しますか？
                </Label>
                <RadioGroup
                  value={afterPartyStatus ?? undefined}
                  onValueChange={(v) =>
                    setAfterPartyStatus(
                      v as "attending" | "not_attending"
                    )
                  }
                  className="grid grid-cols-2 gap-4"
                >
                  <RadioOption
                    value="attending"
                    label="参加する"
                    selected={afterPartyStatus === "attending"}
                    colorClass="border-green-500 bg-green-50 text-green-900"
                  />
                  <RadioOption
                    value="not_attending"
                    label="参加しない"
                    selected={afterPartyStatus === "not_attending"}
                    colorClass="border-red-500 bg-red-50 text-red-900"
                  />
                </RadioGroup>
              </Stack>
            )}

            {/* コメント */}
            <FormField label="メッセージ・連絡事項（任意）">
              <Textarea
                id="comment"
                placeholder="アレルギーや遅刻の連絡など..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[150px]"
              />
            </FormField>

            {/* 送信ボタン */}
            <div className="flex justify-center pt-4">
              <ActionButton
                onClick={handleSubmit}
                disabled={isDeadlinePassed || isPending}
              >
                {isPending
                  ? "送信中..."
                  : isDeadlinePassed
                    ? "回答期限を過ぎています"
                    : "送信"}
              </ActionButton>
            </div>
          </Stack>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// サブコンポーネント
// ============================================================

function RadioOption({
  value,
  label,
  selected,
  colorClass,
}: {
  value: string;
  label: string;
  selected: boolean;
  colorClass: string;
}) {
  return (
    <div>
      <RadioGroupItem value={value} id={value} className="peer sr-only" />
      <Label
        htmlFor={value}
        className={`flex flex-col items-center justify-between rounded-md border-2 px-4 py-6 cursor-pointer text-center h-full transition-colors ${
          selected
            ? colorClass
            : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
        }`}
      >
        <span className="font-semibold">{label}</span>
      </Label>
    </div>
  );
}

function EventDetailDialog({
  event,
}: {
  event: SerializedRsvpPageData["event"];
}) {
  const hasContent =
    event.description || event.timetable || event.location || event.note;

  if (!hasContent) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Info className="h-4 w-4 mr-2" />
          イベント詳細を見る
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
          <DialogDescription>イベントの詳細情報</DialogDescription>
        </DialogHeader>
        <Stack gap="md" className="mt-4">
          {event.description && (
            <div>
              <h3 className="font-semibold mb-2">イベント概要</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}
          {event.timetable && (
            <div>
              <h3 className="font-semibold mb-2">タイムテーブル</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {event.timetable}
              </p>
            </div>
          )}
          {event.location && (
            <div>
              <h3 className="font-semibold mb-2">場所</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {event.location}
              </p>
            </div>
          )}
          {event.note && (
            <div>
              <h3 className="font-semibold mb-2">備考</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {event.note}
              </p>
            </div>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
