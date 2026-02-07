import { describe, it, expect } from "vitest";
import { loginSchema } from "@/lib/validations/login";

describe("loginSchema", () => {
  it("正常系: 有効なメール・パスワード", () => {
    const result = loginSchema.safeParse({
      email: "admin@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("異常系: メールアドレスが空", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: メールアドレスの形式が不正", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: パスワードが空", () => {
    const result = loginSchema.safeParse({
      email: "admin@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});
