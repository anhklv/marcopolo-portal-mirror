"use client";

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
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { RadioItem } from "@/components/ui/radio-item";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Plus, Trash2 } from "lucide-react";
import type { CommunityOption } from "@/lib/types/serialized";
import { useEventForm } from "./use-event-form";
import type {
  EventInitialData,
  ParticipationOptionInitialData,
} from "./use-event-form";

// ============================================================
// 型定義
// ============================================================

interface EventFormProps {
  mode: "create" | "edit";
  initialData?: EventInitialData;
  initialParticipationOptions?: ParticipationOptionInitialData[];
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
  initialParticipationOptions,
  communities,
  isSuper,
  scopedCommunityIds,
}: EventFormProps) {
  const router = useRouter();
  const form = useEventForm({
    mode,
    initialData,
    initialParticipationOptions,
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
        backAction={() => router.back()}
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

          {form.isNaikanMeetup && (
            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <Label className="text-base">参加の選択肢</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  参加・オンライン参加時に表示される選択肢です。
                </p>
              </div>

              <RadioGroup
                value={form.participationMode}
                onValueChange={(value) =>
                  form.setParticipationMode(value as "optional" | "required")
                }
              >
                <div className="flex items-center gap-6">
                  <RadioItem
                    value="required"
                    label="必須"
                    id="participation-options-required"
                  />
                  <RadioItem
                    value="optional"
                    label="任意"
                    id="participation-options-optional"
                  />
                </div>
              </RadioGroup>

              {form.participationOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  選択肢がありません。
                </p>
              ) : (
                <div className="space-y-2">
                  {form.participationOptions.map((option) => (
                    <div key={option.key} className="flex items-center gap-2">
                      <Input
                        value={option.label}
                        maxLength={200}
                        onChange={(event) =>
                          form.updateParticipationOptionLabel(
                            option.key,
                            event.target.value
                          )
                        }
                        placeholder="例: 講演のみ参加"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          form.removeParticipationOption(option.key)
                        }
                        aria-label="選択肢を削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={form.addParticipationOption}
              >
                <Plus className="h-4 w-4" />
                選択肢を追加
              </Button>
            </div>
          )}
        </Stack>

        <div className="flex justify-center">
          <ActionButton type="submit" disabled={form.isPending}>
            {form.isPending ? pendingLabel : submitLabel}
          </ActionButton>
        </div>
      </form>

      <Dialog
        open={form.participationOptionPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) form.cancelParticipationOptionDelete();
        }}
      >
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>参加の選択肢を削除</DialogTitle>
            <DialogDescription>
              「{form.participationOptionPendingDelete?.label}」は
              {form.participationOptionPendingDelete?.rsvpCount}
              件のRSVPで使用されています。
              <br />
              削除後も既存の回答には「
              {form.participationOptionPendingDelete?.label}
              （削除済み）」として保持されます。新しい回答では選択できなくなります。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={form.cancelParticipationOptionDelete}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={form.confirmParticipationOptionDelete}
            >
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
