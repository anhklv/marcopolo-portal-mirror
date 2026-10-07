import { describe, it, expect, vi, beforeEach } from "vitest";

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
});

describe("sendMailBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("異常系: subEmailsの一部が失敗した場合は顧客単位で失敗扱いにする", async () => {
    const customers: BatchMailCustomer[] = [
      { id: 1, lastName: "田中", firstName: "太郎", email: "tanaka@example.com", subEmails: ["tanaka-sub@example.com"] },
    ];
    sendMailMock
      .mockResolvedValueOnce({ messageId: "<msg>" })
      .mockRejectedValueOnce(new Error("SMTP error"));

    const result = await sendMailBatch({ ...baseParams, customers, tokenMap: new Map([[1, "token-1"]]) });

    expect(result.sentCount).toBe(0);
    expect(result.failedCount).toBe(1);
    expect(result.failedNames).toEqual(["田中 太郎"]);
    expect(result.successCustomerIds).toEqual([]);
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
