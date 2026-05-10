import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  getAuthenticatedAdmin,
  canManageSurvey,
} from "@/lib/auth/permissions";
import { findEventForSurveySend } from "@/lib/repositories/survey.repository";
import {
  serializeEventForSurvey,
  serializeAttendee,
} from "@/lib/serializers/survey";
import {
  generateSurveySubject,
  generateSurveyBody,
} from "@/lib/mail/templates/survey";
import { getEventDisplayStatus } from "@/lib/utils/event";
import { prisma } from "@/lib/prisma";
import { SurveySendForm } from "./_components/survey-send-form";

export default async function SurveySendPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = Number(id);
  if (isNaN(eventId)) notFound();

  const { admin } = await getAuthenticatedAdmin();
  const hasPermission = await canManageSurvey(admin, eventId);
  if (!hasPermission) notFound();

  const event = await findEventForSurveySend(eventId);
  if (!event) notFound();

  // 終了していないイベントはアンケート送信不可
  const status = getEventDisplayStatus(event);
  if (status !== "closed") {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            アンケートメールは終了したイベントのみ送信できます。
          </p>
          <Button variant="outline" asChild className="mt-4">
            <Link href={`/admin/events/${eventId}`}>イベント詳細に戻る</Link>
          </Button>
        </div>
      </div>
    );
  }

  // 参加者がいない場合
  if (event.rsvps.length === 0) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            参加者がいません。アンケートメールの送信先がありません。
          </p>
          <Button variant="outline" asChild className="mt-4">
            <Link href={`/admin/events/${eventId}`}>イベント詳細に戻る</Link>
          </Button>
        </div>
      </div>
    );
  }

  // 管理者メール取得（テスト送信先用）
  const adminRecord = await prisma.admin.findUnique({
    where: { id: admin.id },
    select: { email: true },
  });

  // テンプレート生成
  const defaultEmailTitle = generateSurveySubject({
    eventTitle: event.title,
  });
  const defaultEmailBody = generateSurveyBody({
    eventTitle: event.title,
  });

  return (
    <SurveySendForm
      event={serializeEventForSurvey(event)}
      attendees={event.rsvps.map(serializeAttendee)}
      adminEmail={adminRecord?.email ?? ""}
      defaultEmailTitle={defaultEmailTitle}
      defaultEmailBody={defaultEmailBody}
    />
  );
}
