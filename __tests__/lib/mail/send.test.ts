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
import { sendMail } from "@/lib/mail/send";
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
