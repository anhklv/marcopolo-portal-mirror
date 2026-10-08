import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPrisma } from "@/__tests__/helpers/mock-prisma";

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const mockRequireAuthenticatedAdmin = vi.fn();
const mockCanAccessEvent = vi.fn();
vi.mock("@/lib/auth/permissions", () => ({
  requireAuthenticatedAdmin: (...args: unknown[]) =>
    mockRequireAuthenticatedAdmin(...args),
  canAccessEvent: (...args: unknown[]) => mockCanAccessEvent(...args),
}));

import {
  deleteEventMailDraftAction,
  duplicateEventMailAction,
  updateEventMailDraftAction,
} from "@/lib/actions/event-mail.actions";

const sourceMail = {
  id: 10,
  eventId: 1,
  templateNameSnapshot: "回答リマインド",
  kind: "rsvp",
  state: "sent",
  subject: "テスト件名",
  body: "テスト本文",
  fromAddress: "noreply@example.com",
  targetCount: 1,
  deliveries: [
    {
      id: 100,
      customerId: 20,
      lastNameSnapshot: "田中",
      firstNameSnapshot: "太郎",
      emailAddress: "tanaka@example.com",
      emailType: "main",
      subEmailOrder: null,
    },
  ],
};

describe("event-mail actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedAdmin.mockResolvedValue({
      admin: { id: 7, role: "super" },
    });
    mockCanAccessEvent.mockResolvedValue(true);
  });

  it("送信済みメールを未送信として複製する", async () => {
    mockPrisma.eventMail.findFirst.mockResolvedValue(sourceMail);
    mockPrisma.eventMail.create.mockResolvedValue({ id: 11 });

    const result = await duplicateEventMailAction(1, 10);

    expect(result).toEqual({ success: true, id: 11 });
    expect(mockPrisma.eventMail.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventId: 1,
        state: "draft",
        subject: "テスト件名",
        sentByAdminId: null,
        sendStatus: null,
        sentAt: null,
        deliveries: {
          create: [
            expect.objectContaining({
              customerId: 20,
              emailAddress: "tanaka@example.com",
              status: "pending",
            }),
          ],
        },
      }),
      select: { id: true },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/events/1");
  });

  it("未送信メールを編集する", async () => {
    mockPrisma.eventMail.updateMany.mockResolvedValue({ count: 1 });

    const result = await updateEventMailDraftAction({
      eventId: 1,
      mailId: 11,
      subject: " 更新件名 ",
      body: " 更新本文 ",
    });

    expect(result).toEqual({ success: true, id: 11 });
    expect(mockPrisma.eventMail.updateMany).toHaveBeenCalledWith({
      where: { id: 11, eventId: 1, state: "draft" },
      data: { subject: "更新件名", body: "更新本文" },
    });
  });

  it("未送信メールを削除する", async () => {
    mockPrisma.eventMail.deleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteEventMailDraftAction(1, 11);

    expect(result).toEqual({ success: true });
    expect(mockPrisma.eventMail.deleteMany).toHaveBeenCalledWith({
      where: { id: 11, eventId: 1, state: "draft" },
    });
  });

  it("イベントへのアクセス権がない場合は操作しない", async () => {
    mockCanAccessEvent.mockResolvedValue(false);

    const result = await duplicateEventMailAction(1, 10);

    expect(result).toEqual({
      success: false,
      error: "このイベントへのアクセス権がありません",
    });
    expect(mockPrisma.eventMail.findFirst).not.toHaveBeenCalled();
  });
});
