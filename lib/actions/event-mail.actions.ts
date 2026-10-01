"use server";

import { revalidatePath } from "next/cache";
import { canAccessEvent, requireAuthenticatedAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/utils/log-error";

type EventMailActionResult =
  | { success: true; id?: number }
  | { success: false; error: string };

async function authorizeEvent(eventId: number) {
  const { admin } = await requireAuthenticatedAdmin();
  return {
    admin,
    allowed: await canAccessEvent(admin, eventId),
  };
}

export async function duplicateEventMailAction(
  eventId: number,
  mailId: number
): Promise<EventMailActionResult> {
  const { admin, allowed } = await authorizeEvent(eventId);
  if (!allowed) return { success: false, error: "このイベントへのアクセス権がありません" };

  try {
    const source = await prisma.eventMail.findFirst({
      where: { id: mailId, eventId, state: "sent" },
      include: { deliveries: { orderBy: { id: "asc" } } },
    });
    if (!source) return { success: false, error: "送信済みメールが見つかりません" };

    const draft = await prisma.eventMail.create({
      data: {
        eventId,
        templateNameSnapshot: source.templateNameSnapshot,
        kind: source.kind,
        state: "draft",
        subject: source.subject,
        body: source.body,
        fromAddress: source.fromAddress,
        createdByAdminId: admin.id,
        sentByAdminId: null,
        sendStatus: null,
        targetCount: source.targetCount,
        successCount: 0,
        failedCount: 0,
        sentAt: null,
        deliveries: {
          create: source.deliveries.map((delivery) => ({
            customerId: delivery.customerId,
            lastNameSnapshot: delivery.lastNameSnapshot,
            firstNameSnapshot: delivery.firstNameSnapshot,
            emailAddress: delivery.emailAddress,
            emailType: delivery.emailType,
            subEmailOrder: delivery.subEmailOrder,
            status: "pending",
          })),
        },
      },
      select: { id: true },
    });

    revalidatePath(`/admin/events/${eventId}`);
    return { success: true, id: draft.id };
  } catch (error) {
    logServerError("duplicateEventMailAction", error);
    return { success: false, error: "メールの複製に失敗しました" };
  }
}

export async function updateEventMailDraftAction(input: {
  eventId: number;
  mailId: number;
  subject: string;
  body: string;
}): Promise<EventMailActionResult> {
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!subject) return { success: false, error: "件名を入力してください" };
  if (!body) return { success: false, error: "本文を入力してください" };
  if (subject.length > 500) {
    return { success: false, error: "件名は500文字以内で入力してください" };
  }

  const { allowed } = await authorizeEvent(input.eventId);
  if (!allowed) return { success: false, error: "このイベントへのアクセス権がありません" };

  try {
    const result = await prisma.eventMail.updateMany({
      where: { id: input.mailId, eventId: input.eventId, state: "draft" },
      data: { subject, body },
    });
    if (result.count === 0) {
      return { success: false, error: "未送信メールが見つかりません" };
    }
    revalidatePath(`/admin/events/${input.eventId}`);
    return { success: true, id: input.mailId };
  } catch (error) {
    logServerError("updateEventMailDraftAction", error);
    return { success: false, error: "未送信メールの保存に失敗しました" };
  }
}

export async function deleteEventMailDraftAction(
  eventId: number,
  mailId: number
): Promise<EventMailActionResult> {
  const { allowed } = await authorizeEvent(eventId);
  if (!allowed) return { success: false, error: "このイベントへのアクセス権がありません" };

  try {
    const result = await prisma.eventMail.deleteMany({
      where: { id: mailId, eventId, state: "draft" },
    });
    if (result.count === 0) {
      return { success: false, error: "未送信メールが見つかりません" };
    }
    revalidatePath(`/admin/events/${eventId}`);
    return { success: true };
  } catch (error) {
    logServerError("deleteEventMailDraftAction", error);
    return { success: false, error: "未送信メールの削除に失敗しました" };
  }
}
