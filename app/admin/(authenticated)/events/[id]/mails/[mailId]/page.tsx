import { notFound } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { canAccessEvent, getAuthenticatedAdmin } from "@/lib/auth/permissions";
import { findEventMailById } from "@/lib/repositories/event-mail.repository";
import { serializeEventMail } from "@/lib/serializers/event-mail";
import { formatDateTime } from "@/lib/utils/event";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "メール送信結果" };

export default async function MailSendDetailPage({
  params,
}: {
  params: Promise<{ id: string; mailId: string }>;
}) {
  const { admin } = await getAuthenticatedAdmin();
  const { id, mailId } = await params;
  const eventId = Number(id);
  const eventMailId = Number(mailId);

  if (Number.isNaN(eventId) || Number.isNaN(eventMailId)) notFound();
  if (!(await canAccessEvent(admin, eventId))) notFound();

  const record = await findEventMailById(eventId, eventMailId);
  if (!record || record.state !== "sent") notFound();
  const mail = serializeEventMail(record);

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        backHref={`/admin/events/${eventId}?tab=mails`}
        title={mail.subject}
        description={mail.sentAt ? `${formatDateTime(mail.sentAt)} 送信` : undefined}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">メール内容</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">件名</div>
            <div className="font-medium">{mail.subject}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">本文</div>
            <div className="mt-1 whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm">
              {mail.body}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">送信先一覧</h2>
        <div className="rounded-lg bg-card">
          <Table className="[&_th]:py-4 [&_td]:py-4">
            <TableHeader>
              <TableRow>
                <TableHead>顧客名</TableHead>
                <TableHead>メールアドレス</TableHead>
                <TableHead>種別</TableHead>
                <TableHead>結果</TableHead>
                <TableHead>理由</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mail.deliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-medium">
                    {delivery.lastName} {delivery.firstName}
                  </TableCell>
                  <TableCell className="break-all text-muted-foreground">
                    {delivery.emailAddress}
                  </TableCell>
                  <TableCell>
                    {delivery.emailType === "main"
                      ? "メイン"
                      : `サブ${delivery.subEmailOrder ?? ""}`}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      {delivery.status === "success" ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          成功
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          失敗
                        </>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs break-words text-muted-foreground">
                    {delivery.errorMessage || delivery.errorCode || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
