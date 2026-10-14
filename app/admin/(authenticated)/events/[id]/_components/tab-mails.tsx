"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Mail, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils/event";
import type { SerializedEventMail } from "@/lib/types/serialized";
import {
  getDeliveryFailureReason,
  isAwaitingResendResult,
  isFailedDelivery,
} from "@/lib/mail/delivery-status";
import {
  deleteEventMailDraftAction,
  duplicateEventMailAction,
} from "@/lib/actions/event-mail.actions";

interface TabMailsProps {
  eventId: number;
  mails: SerializedEventMail[];
}

const RESULT_REFRESH_INTERVAL_MS = 10_000;
const RESULT_REFRESH_WINDOW_MS = 10 * 60 * 1000;

function isRecentMail(mail: SerializedEventMail): boolean {
  const sentAt = new Date(mail.sentAt ?? mail.createdAt).getTime();
  return (
    Number.isFinite(sentAt) && Date.now() - sentAt <= RESULT_REFRESH_WINDOW_MS
  );
}

export function TabMails({ eventId, mails }: TabMailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [failureDialogMailId, setFailureDialogMailId] = useState<number | null>(
    null
  );
  const failureDialogMail =
    mails.find((mail) => mail.id === failureDialogMailId) ?? null;
  const failedDeliveries =
    failureDialogMail?.deliveries.filter(isFailedDelivery) ?? [];
  const hasRecentPendingResendResult = mails.some(
    (mail) =>
      mail.state === "sent" &&
      isRecentMail(mail) &&
      mail.deliveries.some(isAwaitingResendResult)
  );

  useEffect(() => {
    if (!hasRecentPendingResendResult) return;

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    const intervalId = window.setInterval(
      refreshWhenVisible,
      RESULT_REFRESH_INTERVAL_MS
    );
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [hasRecentPendingResendResult, router]);

  const handleDuplicate = (mail: SerializedEventMail) => {
    startTransition(async () => {
      const result = await duplicateEventMailAction(eventId, mail.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`「${mail.subject}」を複製しました`);
      router.refresh();
    });
  };

  const handleDelete = (mail: SerializedEventMail) => {
    startTransition(async () => {
      const result = await deleteEventMailDraftAction(eventId, mail.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`「${mail.subject}」を削除しました`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-card">
        <Table className="[&_th]:py-3 [&_td]:py-3">
          <TableHeader>
            <TableRow>
              <TableHead>件名</TableHead>
              <TableHead>送信日時</TableHead>
              <TableHead className="text-right">対象</TableHead>
              <TableHead className="text-right">失敗</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mails.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  <Mail className="mx-auto mb-2 h-6 w-6 opacity-50" />
                  まだメール送信がありません。
                </TableCell>
              </TableRow>
            ) : (
              mails.map((mail) => {
                const isDraft = mail.state === "draft";
                const isAwaitingResult =
                  mail.deliveries.some(isAwaitingResendResult);
                return (
                <TableRow key={mail.id}>
                  <TableCell className="max-w-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      {isDraft && (
                        <Badge variant="outline" className="shrink-0">
                          未送信
                        </Badge>
                      )}
                      <Link
                        href={
                          isDraft
                            ? `/admin/events/${eventId}/mails/new?draftId=${mail.id}`
                            : `/admin/events/${eventId}/mails/${mail.id}`
                        }
                        className="block truncate text-primary hover:underline"
                      >
                        {mail.subject}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(mail.sentAt ?? mail.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {mail.targetCount}
                  </TableCell>
                  <TableCell className="text-right" aria-live="polite">
                    {isDraft ? (
                      <span className="text-muted-foreground">—</span>
                    ) : mail.failedCount > 0 ? (
                      <button
                        type="button"
                        className="font-medium text-destructive hover:underline"
                        onClick={() => setFailureDialogMailId(mail.id)}
                      >
                        {mail.failedCount}
                        {isAwaitingResult && "（確認中）"}
                      </button>
                    ) : isAwaitingResult ? (
                      <span className="text-muted-foreground">確認中…</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label="操作"
                          disabled={isPending}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card">
                        {isDraft ? (
                          <>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/events/${eventId}/mails/new?draftId=${mail.id}`}
                                className="flex items-center gap-2"
                              >
                                <Pencil className="h-4 w-4" />
                                編集
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(mail)}
                            >
                              <Trash2 className="h-4 w-4" />
                              削除
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={() => handleDuplicate(mail)}>
                            <Copy className="h-4 w-4" />
                            複製
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={failureDialogMail !== null}
        onOpenChange={(open) => {
          if (!open) setFailureDialogMailId(null);
        }}
      >
        <DialogContent className="max-w-[calc(100%-2rem)] overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>送信失敗</DialogTitle>
            <DialogDescription className="break-words">
              {failureDialogMail?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="min-w-0 overflow-x-auto rounded-lg border">
            <Table className="w-full [&_td]:whitespace-normal [&_th]:whitespace-nowrap [&_th]:py-3 [&_td]:py-3">
              <TableHeader>
                <TableRow>
                  <TableHead>顧客名</TableHead>
                  <TableHead>メールアドレス</TableHead>
                  <TableHead>理由</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>
                      {delivery.lastName} {delivery.firstName}
                    </TableCell>
                    <TableCell className="break-all text-muted-foreground">
                      {delivery.emailAddress}
                    </TableCell>
                    <TableCell className="break-words text-muted-foreground">
                      {getDeliveryFailureReason(delivery) ||
                        "送信に失敗しました"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
