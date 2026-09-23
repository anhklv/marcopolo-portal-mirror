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
import { CheckCircle2, AlertCircle, Info, ExternalLink } from "lucide-react";
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
    requiresTermsAgreement,
    termsAgreed,
    antiSocialForcesAnswer,
    setAntiSocialForcesAnswer,
    participationRulesAnswer,
    setParticipationRulesAnswer,
    informationSharingAnswer,
    setInformationSharingAnswer,
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
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
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
                placeholder="遅刻の連絡など..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[150px]"
              />
            </FormField>

            {requiresTermsAgreement && (
              <section aria-labelledby="rsvp-agreement-heading" className="space-y-4">
                <div>
                  <h2 id="rsvp-agreement-heading" className="text-base font-semibold">
                    参加にあたっての確認事項
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    以下の3項目をご確認のうえ、それぞれご回答ください。
                  </p>
                </div>

                <AgreementItem
                  id="rsvp-anti-social-forces"
                  number="01"
                  title="反社会的勢力でないことの確約"
                  answer={antiSocialForcesAnswer}
                  onAnswerChange={setAntiSocialForcesAnswer}
                  agreeLabel="了承しました。"
                  disagreeLabel="了承できません。"
                >
                  私は、暴力団等の反社会的勢力に該当せず、今後においても反社会的勢力との関係を持つ意思がないことを確約します。また、反社会的勢力に該当し、もしくは暴力的な要求行為等に該当する行為をしたことが判明した場合にはイベントの参加を中止されても異議申し立てを行いません。
                </AgreementItem>

                <AgreementItem
                  id="rsvp-participation-rules"
                  number="02"
                  title="参加規約順守の確約"
                  answer={participationRulesAnswer}
                  onAnswerChange={setParticipationRulesAnswer}
                  agreeLabel="順守します。"
                  disagreeLabel="順守できません。"
                >
                  <p>
                    ないかんMeetupの参加規約（守秘義務・場づくりに対する確約）です。あり方を理解し、全ての規約の順守をお約束する方にのみご参加頂いております。
                  </p>
                  <p className="mt-2">
                    参加規約は以下リンクです。<strong>必ずご確認をお願いします。</strong>
                  </p>
                  <a
                    href="https://drive.google.com/file/d/1obYVxMOth6gHamYgqVIiA9liNc_243CX/view?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex max-w-full items-start gap-1 break-all font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    https://drive.google.com/file/d/1obYVxMOth6gHamYgqVIiA9liNc_243CX/view?usp=sharing
                    <ExternalLink aria-hidden="true" className="mt-1 h-3.5 w-3.5 shrink-0" />
                    <span className="sr-only">（新しいタブで開きます）</span>
                  </a>
                </AgreementItem>

                <AgreementItem
                  id="rsvp-information-sharing"
                  number="03"
                  title="イベント参加者内で開示したい情報について"
                  answer={informationSharingAnswer}
                  onAnswerChange={setInformationSharingAnswer}
                  agreeLabel="了承しました。"
                  disagreeLabel="了承できません。"
                >
                  所属会社名及び氏名について、双方向のコミュニケーションを行うためイベント参加者内での開示をお願いします。また事前にグループ分けリストを作成し、共有することがあります。
                </AgreementItem>
                {!termsAgreed && !isDeadlinePassed && (
                  <p className="text-sm text-muted-foreground" role="status">
                    送信するには、3項目すべてへの同意が必要です。
                  </p>
                )}
              </section>
            )}

            {/* 送信ボタン */}
            <div className="flex justify-center pt-4">
              <ActionButton
                onClick={handleSubmit}
                disabled={
                  isDeadlinePassed ||
                  isPending ||
                  (requiresTermsAgreement && !termsAgreed)
                }
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

function AgreementItem({
  id,
  number,
  title,
  answer,
  onAnswerChange,
  agreeLabel,
  disagreeLabel,
  children,
}: {
  id: string;
  number: string;
  title: string;
  answer: "agree" | "disagree" | null;
  onAnswerChange: (answer: "agree" | "disagree") => void;
  agreeLabel: string;
  disagreeLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`overflow-hidden rounded-lg border ${answer === "agree" ? "border-primary/50" : "border-border"}`}>
      <div className="flex items-start gap-3 bg-muted/50 px-4 py-3">
        <span className="text-sm font-semibold text-muted-foreground" aria-hidden="true">
          {number}
        </span>
        <h3 id={`${id}-title`} className="flex-1 text-sm font-semibold">{title}</h3>
        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          必須
        </span>
      </div>
      <div className="space-y-4 px-4 py-4">
        <div id={`${id}-description`} className="text-sm leading-6 text-muted-foreground">
          {children}
        </div>
        <RadioGroup
          value={answer ?? undefined}
          onValueChange={(value) =>
            onAnswerChange(value as "agree" | "disagree")
          }
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-description`}
          className="grid gap-2 sm:grid-cols-2"
        >
          <AgreementChoice
            id={`${id}-agree`}
            value="agree"
            label={agreeLabel}
            selected={answer === "agree"}
          />
          <AgreementChoice
            id={`${id}-disagree`}
            value="disagree"
            label={disagreeLabel}
            selected={answer === "disagree"}
          />
        </RadioGroup>
      </div>
    </div>
  );
}

function AgreementChoice({
  id,
  value,
  label,
  selected,
}: {
  id: string;
  value: "agree" | "disagree";
  label: string;
  selected: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-md border p-3 transition-colors ${selected ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
      <RadioGroupItem id={id} value={value} />
      <Label htmlFor={id} className="flex-1 cursor-pointer text-sm leading-5">
        {label}
      </Label>
    </div>
  );
}
