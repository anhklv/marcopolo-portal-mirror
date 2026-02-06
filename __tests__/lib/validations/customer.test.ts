import { describe, it, expect } from "vitest";
import { customerSchema } from "@/lib/validations/customer";

describe("customerSchema", () => {
  it("正常系: 必須項目のみ", () => {
    const result = customerSchema.safeParse({
      name: "山田太郎",
      email: "yamada@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("正常系: 全項目入力", () => {
    const result = customerSchema.safeParse({
      name: "山田太郎",
      nameKana: "ヤマダタロウ",
      email: "yamada@example.com",
      subEmails: ["sub1@example.com", "sub2@example.com"],
      company: "テスト株式会社",
      phone: "03-1234-5678",
      postalCode: "100-0001",
      prefecture: "東京都",
      city: "千代田区",
      gender: "male",
      listingCategory: "プライム",
      originIndustry: "事業会社",
      membershipQualification: "監査役",
      memberCategory: "member",
      contractType: "corporate",
      note: "備考テスト",
      communityIds: [1, 2],
    });
    expect(result.success).toBe(true);
  });

  it("異常系: 氏名が空", () => {
    const result = customerSchema.safeParse({
      name: "",
      email: "yamada@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: メールアドレスが不正", () => {
    const result = customerSchema.safeParse({
      name: "山田太郎",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: サブメールアドレスが4つ以上", () => {
    const result = customerSchema.safeParse({
      name: "山田太郎",
      email: "yamada@example.com",
      subEmails: ["a@a.com", "b@b.com", "c@c.com", "d@d.com"],
    });
    expect(result.success).toBe(false);
  });

  it("異常系: 氏名が100文字超", () => {
    const result = customerSchema.safeParse({
      name: "あ".repeat(101),
      email: "yamada@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("正常系: gender が null", () => {
    const result = customerSchema.safeParse({
      name: "山田太郎",
      email: "yamada@example.com",
      gender: null,
    });
    expect(result.success).toBe(true);
  });
});
