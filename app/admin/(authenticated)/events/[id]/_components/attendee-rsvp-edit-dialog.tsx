"use client";

import { useState, useTransition } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Stack } from "@/components/ui/stack";
import { Textarea } from "@/components/ui/textarea";
import { adminUpdateRsvpAction } from "@/lib/actions/rsvp.actions";
import type { AttendeeRow } from "@/lib/helpers/event-detail";
import { buildRsvpUrl } from "@/lib/helpers/invite";
import {
  dbStatusToFormStatus,
  formStatusToDbStatus,
  type FormRsvpStatus,
} from "@/lib/helpers/rsvp-status";

type FormAfterPartyStatus = "attending" | "not_attending";
type EditableAttendee = AttendeeRow & { token: string };

interface AttendeeRsvpEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: number;
    title: string;
    allowsOnline: boolean;
    hasAfterParty: boolean;
  };
  attendee: EditableAttendee | null;
  onSaved: () => void;
}

export function AttendeeRsvpEditDialog({
  open,
  onOpenChange,
  event,
  attendee,
  onSaved,
}: AttendeeRsvpEditDialogProps) {
  const attendeeName = attendee
    ? `${attendee.lastName} ${attendee.firstName}`
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-x-hidden overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>参加ステータスの変更</DialogTitle>
          <DialogDescription>
            {attendeeName} — {event.title}
          </DialogDescription>
        </DialogHeader>

        {attendee ? (
          <AttendeeRsvpEditForm
            key={attendee.rsvpId}
            attendee={attendee}
            event={event}
            onSaved={onSaved}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AttendeeRsvpEditForm({
  attendee,
  event,
  onSaved,
  onClose,
}: {
  attendee: EditableAttendee;
  event: AttendeeRsvpEditDialogProps["event"];
  onSaved: () => void;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<FormRsvpStatus | null>(() =>
    dbStatusToFormStatus(attendee.status)
  );
  const [afterPartyStatus, setAfterPartyStatus] =
    useState<FormAfterPartyStatus | null>(
      () => (attendee.afterPartyStatus as FormAfterPartyStatus) ?? null
    );
  const [comment, setComment] = useState(() => attendee.comment ?? "");
  const rsvpUrl = buildRsvpUrl(
    globalThis.location?.origin ?? "",
    event.id,
    attendee.token
  );

  const handleStatusChange = (value: string) => {
    const nextStatus = value as FormRsvpStatus;
    setStatus(nextStatus);
    if (nextStatus !== "attend") {
      setAfterPartyStatus(null);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(rsvpUrl);
      toast.success("参加URLをコピーしました");
    } catch {
      toast.error("URLのコピーに失敗しました");
    }
  };

  const handleSave = () => {
    if (!status) {
      toast.error("出欠を選択してください");
      return;
    }

    if (
      event.hasAfterParty &&
      status === "attend" &&
      !afterPartyStatus
    ) {
      toast.error("懇親会の参加可否を選択してください");
      return;
    }

    startTransition(async () => {
      try {
        const result = await adminUpdateRsvpAction({
          rsvpId: attendee.rsvpId,
          eventId: event.id,
          status: formStatusToDbStatus(status),
          afterPartyStatus:
            status === "attend" ? afterPartyStatus : null,
          comment: comment || undefined,
        });

        if (result.success) {
          toast.success("参加ステータスを更新しました");
          onSaved();
          onClose();
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("参加ステータスの更新に失敗しました");
      }
    });
  };

  return (
    <>
      <Stack gap="md">
        <Stack gap="md">
          <Label className="text-base">出欠を選択してください</Label>
          <RadioGroup
            value={status ?? undefined}
            onValueChange={handleStatusChange}
            className={`grid gap-3 ${event.allowsOnline ? "grid-cols-3" : "grid-cols-2"}`}
          >
            <RadioOption
              value="attend"
              label={event.allowsOnline ? "現地参加" : "参加する"}
              selected={status === "attend"}
              colorClass="border-green-500 bg-green-50 text-green-900"
            />
            {event.allowsOnline ? (
              <RadioOption
                value="online"
                label="オンライン参加"
                selected={status === "online"}
                colorClass="border-blue-500 bg-blue-50 text-blue-900"
              />
            ) : null}
            <RadioOption
              value="decline"
              label="参加しない"
              selected={status === "decline"}
              colorClass="border-red-500 bg-red-50 text-red-900"
            />
          </RadioGroup>
        </Stack>

        {event.hasAfterParty && status === "attend" ? (
          <Stack gap="md">
            <Label className="text-base">懇親会も参加しますか？</Label>
            <RadioGroup
              value={afterPartyStatus ?? undefined}
              onValueChange={(value) =>
                setAfterPartyStatus(value as FormAfterPartyStatus)
              }
              className="grid grid-cols-2 gap-3"
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
        ) : null}

        <FormField label="メッセージ・連絡事項（任意）">
          <Textarea
            placeholder="遅刻の連絡など..."
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="min-h-[120px]"
          />
        </FormField>
      </Stack>

      <DialogFooter className="gap-2 sm:gap-0">
        <ActionButton variant="outline" onClick={onClose} disabled={isPending}>
          キャンセル
        </ActionButton>
        <ActionButton onClick={handleSave} disabled={isPending}>
          {isPending ? "保存中..." : "保存"}
        </ActionButton>
      </DialogFooter>

      <div className="min-w-0 border-t pt-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-sm text-muted-foreground">参加URL</span>
            <p className="mt-1 break-all text-sm">{rsvpUrl}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={handleCopyUrl}
            aria-label="参加URLをコピー"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

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
  const inputId = `admin-rsvp-${value}`;

  return (
    <div>
      <RadioGroupItem value={value} id={inputId} className="peer sr-only" />
      <Label
        htmlFor={inputId}
        className={`flex h-full cursor-pointer flex-col items-center justify-between rounded-md border-2 px-3 py-4 text-center transition-colors ${
          selected
            ? colorClass
            : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
        }`}
      >
        <span className="text-sm font-semibold">{label}</span>
      </Label>
    </div>
  );
}
