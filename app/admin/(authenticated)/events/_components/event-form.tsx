"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Stack } from "@/components/ui/stack";
import { PageHeader } from "@/components/ui/page-header";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import { ActionButton } from "@/components/ui/action-button";
import { DatePickerWithInput } from "@/components/ui/date-picker-with-input";
import { Mail } from "lucide-react";
import type { CommunityOption } from "@/lib/types/serialized";
import { useEventForm } from "./use-event-form";
import type { EventInitialData } from "./use-event-form";

// ============================================================
// 型定義
// ============================================================

interface EventFormProps {
  mode: "create" | "edit";
  initialData?: EventInitialData;
  communities: CommunityOption[];
  isSuper: boolean;
  scopedCommunityIds: number[];
}

// ============================================================
// コンポーネント
// ============================================================

export function EventForm({
  mode,
  initialData,
  communities,
  isSuper,
  scopedCommunityIds,
}: EventFormProps) {
  const form = useEventForm({
    mode,
    initialData,
    communities,
    isSuper,
    scopedCommunityIds,
  });

  const pageTitle = mode === "create" ? "イベント作成" : "イベント編集";
  const pageDescription = mode === "create"
    ? "新しいイベントを作成します。"
    : initialData
      ? `${initialData.title}のイベント情報を編集・更新します。`
      : "イベント情報を編集・更新します。";
  const submitLabel = mode === "create" ? "作成" : "更新";
  const pendingLabel = mode === "create" ? "作成中..." : "更新中...";

  // 成功画面（create時のみ）
  if (form.step === "success" && mode === "create") {
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
              <div className="text-lg font-bold">{form.title}</div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={form.handleSkipInvite}>
                後で送信する
              </Button>
              <Button variant="default" onClick={form.handleStartInvite}>
                <Mail className="h-4 w-4" />
                案内メールを送信する
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // フォーム入力
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        backHref="/admin/events"
        title={pageTitle}
        description={pageDescription}
      />

      {form.generalError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {form.generalError}
        </div>
      )}

      <form onSubmit={form.handleSubmit} className="space-y-8">
        <Stack gap="lg">
          {/* イベント種別（コミュニティ選択） */}
          <FormField label="イベント種別" required error={form.fieldErrors["communityId"]?.[0]}>
            {form.communitySelectMode === "select" ? (
              <Select
                value={String(form.communityId)}
                onValueChange={(value) => {
                  form.setCommunityId(Number(value));
                  form.clearFieldError("communityId");
                }}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {form.availableCommunities.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="bg-white hover:bg-gray-100">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-foreground">
                {form.availableCommunities.map((c) => c.name).join("、")}
              </div>
            )}
          </FormField>

          {/* イベント名 */}
          <FormField label="イベント名" required error={form.fieldErrors["title"]?.[0]}>
            <Input
              placeholder="例: 第10回 監査役交流会"
              value={form.title}
              onChange={(e) => {
                form.setTitle(e.target.value);
                form.clearFieldError("title");
              }}
            />
          </FormField>

          {/* 開催日 + 時刻 */}
          <div className="grid grid-cols-2 items-start gap-6">
            <FormField label="開催日" required>
              <DatePickerWithInput
                value={form.eventDate}
                onChange={(v) => {
                  form.setEventDate(v);
                  form.clearFieldError("date");
                  form.clearFieldError("eventTime");
                }}
                error={form.fieldErrors["date"]?.[0]}
              />
            </FormField>
            <FormField label="時刻" required error={form.fieldErrors["eventTime"]?.[0]}>
              <Input
                type="time"
                step="60"
                value={form.eventTime}
                onChange={(e) => {
                  form.setEventTime(e.target.value);
                  form.clearFieldError("date");
                  form.clearFieldError("eventTime");
                }}
                className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
            </FormField>
          </div>

          {/* イベント概要 */}
          <FormField label="イベント概要" error={form.fieldErrors["description"]?.[0]}>
            <Textarea
              placeholder="イベントの概要を入力してください"
              rows={5}
              value={form.description}
              onChange={(e) => {
                form.setDescription(e.target.value);
                form.clearFieldError("description");
              }}
              className="min-h-[200px]"
            />
          </FormField>

          {/* タイムテーブル */}
          <FormField label="タイムテーブル" error={form.fieldErrors["timetable"]?.[0]}>
            <Textarea
              placeholder="タイムテーブルを入力してください"
              rows={5}
              value={form.timetable}
              onChange={(e) => {
                form.setTimetable(e.target.value);
                form.clearFieldError("timetable");
              }}
              className="min-h-[200px]"
            />
          </FormField>

          {/* 場所 */}
          <FormField label="場所" error={form.fieldErrors["location"]?.[0]}>
            <Textarea
              placeholder="例: 東京都港区六本木 1-1-1 会議室A"
              rows={3}
              value={form.location}
              onChange={(e) => {
                form.setLocation(e.target.value);
                form.clearFieldError("location");
              }}
              className="min-h-[100px]"
            />
          </FormField>

          {/* 備考 */}
          <FormField label="備考" error={form.fieldErrors["note"]?.[0]}>
            <Textarea
              placeholder="備考を入力してください"
              rows={5}
              value={form.note}
              onChange={(e) => {
                form.setNote(e.target.value);
                form.clearFieldError("note");
              }}
              className="min-h-[100px]"
            />
          </FormField>

          {/* 回答期限日 + 時刻 */}
          <div className="grid grid-cols-2 items-start gap-6">
            <FormField label="回答期限日">
              <DatePickerWithInput
                value={form.deadlineDate}
                onChange={(v) => {
                  form.setDeadlineDate(v);
                  form.clearFieldError("responseDeadline");
                }}
                error={form.fieldErrors["responseDeadline"]?.[0]}
              />
            </FormField>
            <FormField label="時刻">
              <Input
                type="time"
                step="60"
                value={form.deadlineTime}
                onChange={(e) => {
                  form.setDeadlineTime(e.target.value);
                  form.clearFieldError("responseDeadline");
                }}
                className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                disabled={!form.deadlineDate}
              />
            </FormField>
          </div>
          <p className="text-xs text-muted-foreground px-1">
            回答期限を設定しない場合、イベント開催日まで回答を受け付けます。
          </p>

          {/* チェックボックス */}
          <CheckboxItem
            id="allowsOnline"
            label="オンライン参加を可能にする"
            checked={form.allowsOnline}
            onCheckedChange={(checked) => form.setAllowsOnline(checked === true)}
          />

          <CheckboxItem
            id="hasAfterParty"
            label="懇親会を開催する"
            checked={form.hasAfterParty}
            onCheckedChange={(checked) => form.setHasAfterParty(checked === true)}
          />
        </Stack>

        <div className="flex justify-center">
          <ActionButton type="submit" disabled={form.isPending}>
            {form.isPending ? pendingLabel : submitLabel}
          </ActionButton>
        </div>
      </form>
    </div>
  );
}
