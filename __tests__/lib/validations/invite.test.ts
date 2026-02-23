import { describe, it, expect } from "vitest";
import { inviteSchema, testInviteSchema } from "@/lib/validations/invite";

describe("inviteSchema", () => {
  const validData = {
    eventId: 1,
    customerIds: [1, 2, 3],
    emailTitle: "【テストイベント】ご案内",
    emailBody: "テスト本文\n{RSVP_URL}",
  };

  it("正常系: 全項目入力", () => {
    const result = inviteSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("正常系: customerIds が1名", () => {
    const result = inviteSchema.safeParse({
      ...validData,
      customerIds: [1],
    });
    expect(result.success).toBe(true);
  });

  it("異常系: customerIds が空配列", () => {
    const result = inviteSchema.safeParse({
      ...validData,
      customerIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("異常系: eventId が0", () => {
    const result = inviteSchema.safeParse({
      ...validData,
      eventId: 0,
    });
    expect(result.success).toBe(false);
  });

  it("異常系: emailTitle が空", () => {
    const result = inviteSchema.safeParse({
      ...validData,
      emailTitle: "",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: emailTitle が空白のみ → trim後に失敗", () => {
    const result = inviteSchema.safeParse({
      ...validData,
      emailTitle: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: emailTitle が200文字超", () => {
    const result = inviteSchema.safeParse({
      ...validData,
      emailTitle: "あ".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("正常系: emailTitle が200文字ちょうど", () => {
    const result = inviteSchema.safeParse({
      ...validData,
      emailTitle: "あ".repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it("異常系: emailBody が空", () => {
    const result = inviteSchema.safeParse({
      ...validData,
      emailBody: "",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: eventId が負数", () => {
    const result = inviteSchema.safeParse({
      ...validData,
      eventId: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("testInviteSchema", () => {
  const validData = {
    eventId: 1,
    emailTitle: "【テストイベント】ご案内",
    emailBody: "テスト本文\n{RSVP_URL}",
  };

  it("正常系: 全項目入力", () => {
    const result = testInviteSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("異常系: emailTitle が空", () => {
    const result = testInviteSchema.safeParse({
      ...validData,
      emailTitle: "",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: emailBody が空", () => {
    const result = testInviteSchema.safeParse({
      ...validData,
      emailBody: "",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: eventId が欠落", () => {
    const result = testInviteSchema.safeParse({
      emailTitle: "タイトル",
      emailBody: "本文",
    });
    expect(result.success).toBe(false);
  });
});
