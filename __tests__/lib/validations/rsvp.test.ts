import { describe, it, expect } from "vitest";
import { rsvpResponseSchema } from "@/lib/validations/rsvp";

describe("rsvpResponseSchema", () => {
  it("正常系: 全フィールド有効（参加+懇親会参加）", () => {
    const result = rsvpResponseSchema.safeParse({
      token: "550e8400-e29b-41d4-a716-446655440000",
      status: "attending",
      afterPartyStatus: "attending",
      comment: "楽しみにしています",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("attending");
      expect(result.data.afterPartyStatus).toBe("attending");
      expect(result.data.comment).toBe("楽しみにしています");
    }
  });

  it("正常系: オンライン参加", () => {
    const result = rsvpResponseSchema.safeParse({
      token: "550e8400-e29b-41d4-a716-446655440000",
      status: "online",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("online");
      expect(result.data.afterPartyStatus).toBeNull();
      expect(result.data.comment).toBeNull();
    }
  });

  it("正常系: 不参加", () => {
    const result = rsvpResponseSchema.safeParse({
      token: "550e8400-e29b-41d4-a716-446655440000",
      status: "absent",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("absent");
    }
  });

  it("正常系: comment省略 → null変換", () => {
    const result = rsvpResponseSchema.safeParse({
      token: "test-token",
      status: "attending",
      afterPartyStatus: "attending",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.comment).toBeNull();
    }
  });

  it("正常系: comment空文字 → null変換", () => {
    const result = rsvpResponseSchema.safeParse({
      token: "test-token",
      status: "attending",
      afterPartyStatus: "attending",
      comment: "   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.comment).toBeNull();
    }
  });

  it("正常系: afterPartyStatus省略 → null変換", () => {
    const result = rsvpResponseSchema.safeParse({
      token: "test-token",
      status: "attending",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.afterPartyStatus).toBeNull();
    }
  });

  it("正常系: afterPartyStatus=not_attending", () => {
    const result = rsvpResponseSchema.safeParse({
      token: "test-token",
      status: "attending",
      afterPartyStatus: "not_attending",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.afterPartyStatus).toBe("not_attending");
    }
  });

  it("正常系: comment 1000文字", () => {
    const result = rsvpResponseSchema.safeParse({
      token: "test-token",
      status: "attending",
      comment: "あ".repeat(1000),
    });
    expect(result.success).toBe(true);
  });

  it("異常系: token空文字", () => {
    const result = rsvpResponseSchema.safeParse({
      token: "",
      status: "attending",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: token未指定", () => {
    const result = rsvpResponseSchema.safeParse({
      status: "attending",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: status未指定", () => {
    const result = rsvpResponseSchema.safeParse({
      token: "test-token",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: status不正値", () => {
    const result = rsvpResponseSchema.safeParse({
      token: "test-token",
      status: "maybe",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: comment 1001文字超", () => {
    const result = rsvpResponseSchema.safeParse({
      token: "test-token",
      status: "attending",
      comment: "あ".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("異常系: afterPartyStatus不正値", () => {
    const result = rsvpResponseSchema.safeParse({
      token: "test-token",
      status: "attending",
      afterPartyStatus: "maybe",
    });
    expect(result.success).toBe(false);
  });
});
