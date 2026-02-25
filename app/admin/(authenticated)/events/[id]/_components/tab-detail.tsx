"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DataItem } from "@/components/ui/data-item";
import { SectionHeading } from "@/components/ui/section-heading";
import { Stack } from "@/components/ui/stack";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getCommunityBadgeVariant } from "@/lib/constants/community";
import { isRedirectError } from "@/lib/utils";
import { formatEventDate } from "@/lib/utils/event";
import { deleteEventAction } from "@/lib/actions/event.actions";
import type { SerializedEventDetail } from "@/lib/types/serialized";

interface TabDetailProps {
  event: SerializedEventDetail;
}

export function TabDetail({ event }: TabDetailProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteEventAction(event.id);
        if (result && !result.success) {
          toast.error(result.error);
        }
      } catch (err) {
        if (isRedirectError(err)) {
          return;
        }
        toast.error("削除に失敗しました");
      }
    });
  };

  return (
    <>
      <Card className="border-0">
        <CardContent>
          <Stack gap="lg">
            <SectionHeading>イベント情報</SectionHeading>
            <div className="grid grid-cols-2 gap-6">
              <DataItem label="イベント種別">
                <Badge
                  variant={getCommunityBadgeVariant(
                    event.community.code
                  )}
                >
                  {event.community.name}
                </Badge>
              </DataItem>
              <DataItem label="開催日時">
                {formatEventDate(event.date)}
              </DataItem>
              {event.location && (
                <DataItem label="場所">
                  <span className="whitespace-pre-wrap">
                    {event.location}
                  </span>
                </DataItem>
              )}
              {event.responseDeadline && (
                <DataItem label="回答期限">
                  {formatEventDate(event.responseDeadline)}
                </DataItem>
              )}
              <DataItem label="オンライン参加">
                {event.allowsOnline ? "可能" : "不可"}
              </DataItem>
              <DataItem label="懇親会">
                {event.hasAfterParty ? "あり" : "なし"}
              </DataItem>
            </div>
            {event.description && (
              <>
                <SectionHeading>イベント概要</SectionHeading>
                <div className="text-base whitespace-pre-wrap">
                  {event.description}
                </div>
              </>
            )}
            {event.timetable && (
              <>
                <SectionHeading>タイムテーブル</SectionHeading>
                <div className="text-base whitespace-pre-wrap">
                  {event.timetable}
                </div>
              </>
            )}
            {event.note && (
              <>
                <SectionHeading>備考</SectionHeading>
                <div className="text-base whitespace-pre-wrap">
                  {event.note}
                </div>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* 削除ボタン */}
      <div className="flex justify-end pt-4 border-t">
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="border-destructive text-destructive bg-white hover:bg-white hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              削除
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>イベントを削除</DialogTitle>
              <DialogDescription>
                このイベントを削除してもよろしいですか？この操作は取り消せません。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? "削除中..." : "削除"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
