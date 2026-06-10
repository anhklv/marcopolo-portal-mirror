import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mail/send", () => ({
  sendMail: vi.fn(),
}));

import { sendMail } from "@/lib/mail/send";
import { sendSurveyMailBatch, type SurveyMailCustomer } from "@/lib/mail/survey-send";

const mockSendMail = vi.mocked(sendMail);

describe("sendSurveyMailBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseParams = {
    tokenMap: new Map([[1, "survey-token-1"]]),
    eventId: 100,
    baseUrl: "http://localhost:3000",
    from: "noreply@example.com",
    emailTitle: "アンケート",
    emailBody: "本文\n{SURVEY_URL}\n{CUSTOMER_NAME}様",
  };

  it("正常系: subEmailsがある顧客はメインとサブを個別送信し、人数は1名で集計する", async () => {
    const customers: SurveyMailCustomer[] = [
      {
        id: 1,
        lastName: "田中",
        firstName: "太郎",
        email: "tanaka@example.com",
        subEmails: ["tanaka-sub@example.com"],
      },
    ];
    mockSendMail.mockResolvedValue({ success: true });

    const result = await sendSurveyMailBatch({ ...baseParams, customers });

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "tanaka@example.com" })
    );
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "tanaka-sub@example.com" })
    );
    expect(mockSendMail).toHaveBeenCalledTimes(2);
    expect(result.sentCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(result.successCustomerIds).toEqual([1]);
  });

  it("異常系: subEmailsの一部が失敗した場合は顧客単位で失敗扱いにする", async () => {
    const customers: SurveyMailCustomer[] = [
      {
        id: 1,
        lastName: "田中",
        firstName: "太郎",
        email: "tanaka@example.com",
        subEmails: ["tanaka-sub@example.com"],
      },
    ];
    mockSendMail
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: "SMTP error" });

    const result = await sendSurveyMailBatch({ ...baseParams, customers });

    expect(result.sentCount).toBe(0);
    expect(result.failedCount).toBe(1);
    expect(result.failedNames).toEqual(["田中 太郎"]);
    expect(result.successCustomerIds).toEqual([]);
  });
});
