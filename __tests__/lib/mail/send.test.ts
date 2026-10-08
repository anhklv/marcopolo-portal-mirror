import { describe, it, expect, vi, beforeEach } from "vitest";

const { resendSendMock } = vi.hoisted(() => ({
  resendSendMock: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: resendSendMock };
  },
}));

// nodemailer をモック
vi.mock("nodemailer", () => {
  const sendMailMock = vi.fn();
  return {
    default: {
      createTransport: vi.fn(() => ({
        sendMail: sendMailMock,
      })),
    },
    __sendMailMock: sendMailMock,
  };
});

// client.ts 経由で transporter を使う send.ts をテスト
// モック後にインポート
import { sendMail, sendMailBatch } from "@/lib/mail/send";
import type { BatchMailCustomer } from "@/lib/mail/send";
import { transporter } from "@/lib/mail/client";

const sendMailMock = transporter.sendMail as ReturnType<typeof vi.fn>;

describe("sendMail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MAIL_PROVIDER = "mailpit";
    delete process.env.RESEND_API_KEY;
  });

  it("正常系: メール送信成功時にsuccess=trueとmessageIdを返す", async () => {
    sendMailMock.mockResolvedValue({ messageId: "<test-id@mail>" });

    const result = await sendMail({
      from: "from@example.com",
      to: "to@example.com",
      subject: "テスト件名",
      text: "テスト本文",
    });

    expect(result).toEqual({
      success: true,
      messageId: "<test-id@mail>",
    });
    expect(sendMailMock).toHaveBeenCalledWith({
      from: "from@example.com",
      to: "to@example.com",
      subject: "テスト件名",
      text: "テスト本文",
    });
  });

  it("異常系: 送信エラー時にsuccess=falseとerrorを返す", async () => {
    sendMailMock.mockRejectedValue(new Error("Connection refused"));

    const result = await sendMail({
      from: "from@example.com",
      to: "to@example.com",
      subject: "テスト件名",
      text: "テスト本文",
    });

    expect(result).toEqual({
      success: false,
      error: "Connection refused",
    });
  });

  it("異常系: Error以外の例外時にデフォルトメッセージを返す", async () => {
    sendMailMock.mockRejectedValue("unknown error");

    const result = await sendMail({
      from: "from@example.com",
      to: "to@example.com",
      subject: "テスト件名",
      text: "テスト本文",
    });

    expect(result).toEqual({
      success: false,
      error: "メール送信に失敗しました",
    });
  });

  it("異常系: 不正なメールアドレスはSMTP送信前に失敗として返す", async () => {
    const result = await sendMail({
      from: "from@example.com",
      to: "invalid-address",
      subject: "テスト件名",
      text: "テスト本文",
    });

    expect(result).toEqual({
      success: false,
      errorCode: "INVALID_EMAIL",
      error: "Invalid email address",
    });
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("正常系: Resend APIのemail IDをproviderEmailIdとして返す", async () => {
    process.env.MAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "re_test";
    resendSendMock.mockResolvedValue({
      data: { id: "resend-email-1" },
      error: null,
    });

    const result = await sendMail({
      from: "from@example.com",
      to: "to@example.com",
      subject: "テスト件名",
      text: "テスト本文",
    });

    expect(result).toEqual({
      success: true,
      providerEmailId: "resend-email-1",
    });
    expect(resendSendMock).toHaveBeenCalledWith({
      from: "from@example.com",
      to: "to@example.com",
      subject: "テスト件名",
      text: "テスト本文",
    });
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("異常系: Resend APIエラーを同期送信失敗として返す", async () => {
    process.env.MAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "re_test";
    resendSendMock.mockResolvedValue({
      data: null,
      error: {
        name: "validation_error",
        message: "Invalid recipient",
        statusCode: 422,
      },
    });

    const result = await sendMail({
      from: "from@example.com",
      to: "to@example.com",
      subject: "テスト件名",
      text: "テスト本文",
    });

    expect(result).toEqual({
      success: false,
      errorCode: "validation_error",
      error: "Invalid recipient",
    });
  });

  it("複数の通知先、タグ、idempotency keyをResendへ渡す", async () => {
    process.env.MAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "re_test";
    resendSendMock.mockResolvedValue({
      data: { id: "notification-email-1" },
      error: null,
    });

    await sendMail({
      from: "from@example.com",
      to: ["first@example.com", "second@example.com"],
      subject: "通知",
      text: "本文",
      tags: [{ name: "category", value: "community_notification" }],
      idempotencyKey: "event-mail-failure-10-1",
    });

    expect(resendSendMock).toHaveBeenCalledWith(
      {
        from: "from@example.com",
        to: ["first@example.com", "second@example.com"],
        subject: "通知",
        text: "本文",
        tags: [{ name: "category", value: "community_notification" }],
      },
      { idempotencyKey: "event-mail-failure-10-1" }
    );
  });
});

describe("sendMailBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MAIL_PROVIDER = "mailpit";
    delete process.env.RESEND_API_KEY;
  });

  const baseCustomers: BatchMailCustomer[] = [
    { id: 1, lastName: "田中", firstName: "太郎", email: "tanaka@example.com", subEmails: null },
    { id: 2, lastName: "佐藤", firstName: "花子", email: "sato@example.com", subEmails: null },
  ];

  const baseParams = {
    tokenMap: new Map([[1, "token-1"], [2, "token-2"]]),
    eventId: 100,
    baseUrl: "http://localhost:3000",
    from: "noreply@example.com",
    emailTitle: "テスト件名",
    emailBody: "テスト本文\n{RSVP_URL}\n{CUSTOMER_NAME}様",
  };

  it("正常系: 全員に送信成功", async () => {
    sendMailMock.mockResolvedValue({ messageId: "<msg>" });

    const result = await sendMailBatch({ ...baseParams, customers: baseCustomers });

    expect(result.sentCount).toBe(2);
    expect(result.failedCount).toBe(0);
    expect(result.failedNames).toEqual([]);
    expect(result.successCustomerIds).toEqual([1, 2]);
    expect(sendMailMock).toHaveBeenCalledTimes(2);
  });

  it("正常系: 1通目成功、2通目失敗", async () => {
    sendMailMock
      .mockResolvedValueOnce({ messageId: "<msg>" })
      .mockRejectedValueOnce(new Error("SMTP error"));

    const result = await sendMailBatch({ ...baseParams, customers: baseCustomers });

    expect(result.sentCount).toBe(1);
    expect(result.failedCount).toBe(1);
    expect(result.failedNames).toEqual(["佐藤 花子"]);
    expect(result.successCustomerIds).toEqual([1]);
  });

  it("正常系: subEmailsがある顧客はメインとサブを個別送信し、人数は1名で集計する", async () => {
    const customers: BatchMailCustomer[] = [
      { id: 1, lastName: "田中", firstName: "太郎", email: "tanaka@example.com", subEmails: ["tanaka-sub@example.com"] },
    ];
    sendMailMock.mockResolvedValue({ messageId: "<msg>" });

    const result = await sendMailBatch({ ...baseParams, customers, tokenMap: new Map([[1, "token-1"]]) });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "tanaka@example.com",
      })
    );
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "tanaka-sub@example.com",
      })
    );
    expect(sendMailMock).toHaveBeenCalledTimes(2);
    expect(result.sentCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(result.successCustomerIds).toEqual([1]);
  });

  it("正常系: subEmailsの一部が失敗しても成功した宛先があれば顧客は成功扱いにする", async () => {
    const customers: BatchMailCustomer[] = [
      { id: 1, lastName: "田中", firstName: "太郎", email: "tanaka@example.com", subEmails: ["tanaka-sub@example.com"] },
    ];
    sendMailMock
      .mockResolvedValueOnce({ messageId: "<msg>" })
      .mockRejectedValueOnce(new Error("SMTP error"));

    const result = await sendMailBatch({ ...baseParams, customers, tokenMap: new Map([[1, "token-1"]]) });

    expect(result.sentCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(result.failedNames).toEqual([]);
    expect(result.successCustomerIds).toEqual([1]);
    expect(result.addressSuccessCount).toBe(1);
    expect(result.addressFailedCount).toBe(1);
    expect(result.deliveries).toEqual([
      expect.objectContaining({
        customerId: 1,
        email: "tanaka@example.com",
        emailType: "main",
        success: true,
      }),
      expect.objectContaining({
        customerId: 1,
        email: "tanaka-sub@example.com",
        emailType: "sub",
        success: false,
      }),
    ]);
  });

  it("正常系: subEmailsが空配列の場合はメインアドレスのみで送信される", async () => {
    const customers: BatchMailCustomer[] = [
      { id: 1, lastName: "田中", firstName: "太郎", email: "tanaka@example.com", subEmails: [] },
    ];
    sendMailMock.mockResolvedValue({ messageId: "<msg>" });

    await sendMailBatch({ ...baseParams, customers, tokenMap: new Map([[1, "token-1"]]) });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "tanaka@example.com",
      })
    );
  });

  it("正常系: 11名以上で複数バッチに分かれて送信される", async () => {
    const customers: BatchMailCustomer[] = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      lastName: `姓${i + 1}`,
      firstName: `名${i + 1}`,
      email: `user${i + 1}@example.com`,
      subEmails: null,
    }));
    const tokenMap = new Map(customers.map((c) => [c.id, `token-${c.id}`]));
    sendMailMock.mockResolvedValue({ messageId: "<msg>" });

    const result = await sendMailBatch({ ...baseParams, customers, tokenMap });

    expect(result.sentCount).toBe(12);
    expect(result.failedCount).toBe(0);
    expect(result.successCustomerIds).toHaveLength(12);
    expect(sendMailMock).toHaveBeenCalledTimes(12);
  });

  it("正常系: RSVP URLとプレースホルダが本文に反映される", async () => {
    const customers: BatchMailCustomer[] = [
      { id: 1, lastName: "田中", firstName: "太郎", email: "tanaka@example.com", subEmails: null },
    ];
    sendMailMock.mockResolvedValue({ messageId: "<msg>" });

    await sendMailBatch({ ...baseParams, customers, tokenMap: new Map([[1, "test-token"]]) });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("http://localhost:3000/events/100/rsvp?token=test-token"),
      })
    );
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("田中 太郎様"),
      })
    );
  });
});
