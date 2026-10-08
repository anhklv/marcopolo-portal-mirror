"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { updateEventMailDraftAction } from "@/lib/actions/event-mail.actions";
import type { SerializedEventMail } from "@/lib/types/serialized";

export function MailDraftEditForm({ mail }: { mail: SerializedEventMail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState(mail.subject);
  const [body, setBody] = useState(mail.body);

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateEventMailDraftAction({
        eventId: mail.eventId,
        mailId: mail.id,
        subject,
        body,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("保存しました");
      router.push(`/admin/events/${mail.eventId}?tab=mails`);
      router.refresh();
    });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        backHref={`/admin/events/${mail.eventId}?tab=mails`}
        title="メール送信の編集"
        description="複製した未送信メールを編集します。"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">メール内容</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mail-subject">件名</Label>
            <Input
              id="mail-subject"
              value={subject}
              maxLength={500}
              onChange={(event) => setSubject(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mail-body">本文</Label>
            <Textarea
              id="mail-body"
              value={body}
              rows={20}
              onChange={(event) => setBody(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">送信対象</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>顧客名</TableHead>
                  <TableHead>メールアドレス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mail.deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>
                      {delivery.lastName} {delivery.firstName}
                    </TableCell>
                    <TableCell>{delivery.emailAddress}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Button variant="outline" asChild disabled={isPending}>
          <Link href={`/admin/events/${mail.eventId}?tab=mails`}>キャンセル</Link>
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          <Save className="h-4 w-4" />
          {isPending ? "保存中..." : "保存"}
        </Button>
      </div>
    </div>
  );
}
