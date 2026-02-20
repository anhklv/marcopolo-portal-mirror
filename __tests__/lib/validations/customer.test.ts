import { describe, it, expect } from "vitest";
import {
  customerSchema,
  customerFormSchema,
  validateKatakana,
  validatePhone,
  validatePostalCode,
} from "@/lib/validations/customer";

describe("customerSchema", () => {
  it("正常系: 必須項目のみ（firstName, lastName, email）", () => {
    const result = customerSchema.safeParse({
      firstName: "田中",
      lastName: "太郎",
      email: "tanaka@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("正常系: 全項目入力", () => {
    const result = customerSchema.safeParse({
      firstName: "田中",
      lastName: "太郎",
      firstNameKana: "タナカ",
      lastNameKana: "タロウ",
      email: "tanaka@example.com",
      subEmails: ["sub1@example.com", "sub2@example.com"],
      company: "テスト株式会社",
      phone: "09012345678",
      postalCode: "1000001",
      prefecture: "東京都",
      city: "千代田区",
      gender: "male",
      listingCategory: "プライム",
      originIndustry: "事業会社",
      membershipQualification: "監査役",
      memberCategory: "member",
      contractType: "corporate",
      note: "備考テスト",
    });
    expect(result.success).toBe(true);
  });

  it("異常系: firstName が空", () => {
    const result = customerSchema.safeParse({
      firstName: "",
      lastName: "太郎",
      email: "tanaka@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: lastName が空", () => {
    const result = customerSchema.safeParse({
      firstName: "田中",
      lastName: "",
      email: "tanaka@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: email が無効な形式", () => {
    const result = customerSchema.safeParse({
      firstName: "田中",
      lastName: "太郎",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: サブメールアドレスが4つ以上", () => {
    const result = customerSchema.safeParse({
      firstName: "田中",
      lastName: "太郎",
      email: "tanaka@example.com",
      subEmails: ["a@a.com", "b@b.com", "c@c.com", "d@d.com"],
    });
    expect(result.success).toBe(false);
  });

  it("異常系: firstName が100文字超", () => {
    const result = customerSchema.safeParse({
      firstName: "あ".repeat(101),
      lastName: "太郎",
      email: "tanaka@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: lastName が100文字超", () => {
    const result = customerSchema.safeParse({
      firstName: "田中",
      lastName: "あ".repeat(101),
      email: "tanaka@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: email が255文字超", () => {
    const result = customerSchema.safeParse({
      firstName: "田中",
      lastName: "太郎",
      email: "a".repeat(250) + "@a.com",
    });
    expect(result.success).toBe(false);
  });

  it("正常系: optional フィールドが空文字", () => {
    const result = customerSchema.safeParse({
      firstName: "田中",
      lastName: "太郎",
      email: "tanaka@example.com",
      firstNameKana: "",
      lastNameKana: "",
      company: "",
      phone: "",
      postalCode: "",
      prefecture: "",
      city: "",
      note: "",
    });
    expect(result.success).toBe(true);
  });

  it("正常系: nullable フィールドが null", () => {
    const result = customerSchema.safeParse({
      firstName: "田中",
      lastName: "太郎",
      email: "tanaka@example.com",
      gender: null,
      memberCategory: null,
      contractType: null,
    });
    expect(result.success).toBe(true);
  });

  it("異常系: フリガナにひらがな", () => {
    const result = customerSchema.safeParse({
      firstName: "田中",
      lastName: "太郎",
      email: "tanaka@example.com",
      firstNameKana: "たなか",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: 電話番号にハイフン", () => {
    const result = customerSchema.safeParse({
      firstName: "田中",
      lastName: "太郎",
      email: "tanaka@example.com",
      phone: "03-1234-5678",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: 電話番号が10桁未満", () => {
    const result = customerSchema.safeParse({
      firstName: "田中",
      lastName: "太郎",
      email: "tanaka@example.com",
      phone: "031234567",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: 郵便番号にハイフン", () => {
    const result = customerSchema.safeParse({
      firstName: "田中",
      lastName: "太郎",
      email: "tanaka@example.com",
      postalCode: "100-0001",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: 郵便番号が7桁でない", () => {
    const result = customerSchema.safeParse({
      firstName: "田中",
      lastName: "太郎",
      email: "tanaka@example.com",
      postalCode: "10000011",
    });
    expect(result.success).toBe(false);
  });
});

describe("validateKatakana", () => {
  it("空文字は許可", () => expect(validateKatakana("")).toBeNull());
  it("カタカナのみは許可", () => expect(validateKatakana("タナカ")).toBeNull());
  it("長音記号は許可", () => expect(validateKatakana("タナカー")).toBeNull());
  it("中黒は許可", () => expect(validateKatakana("ジョン・スミス")).toBeNull());
  it("ひらがなはNG", () => expect(validateKatakana("たなか")).not.toBeNull());
  it("英字混在はNG", () => expect(validateKatakana("アオキk")).not.toBeNull());
  it("漢字はNG", () => expect(validateKatakana("田中")).not.toBeNull());
});

describe("validatePhone", () => {
  it("空文字は許可", () => expect(validatePhone("")).toBeNull());
  it("11桁数字は許可", () => expect(validatePhone("09012345678")).toBeNull());
  it("10桁数字は許可", () => expect(validatePhone("0312345678")).toBeNull());
  it("9桁はNG", () => expect(validatePhone("031234567")).not.toBeNull());
  it("12桁はNG", () => expect(validatePhone("090123456789")).not.toBeNull());
  it("ハイフン付きはNG", () => expect(validatePhone("03-1234-5678")).not.toBeNull());
  it("英字はNG", () => expect(validatePhone("0901234567a")).not.toBeNull());
});

describe("validatePostalCode", () => {
  it("空文字は許可", () => expect(validatePostalCode("")).toBeNull());
  it("7桁数字は許可", () => expect(validatePostalCode("1000001")).toBeNull());
  it("6桁はNG", () => expect(validatePostalCode("100001")).not.toBeNull());
  it("ハイフン付きはNG", () => expect(validatePostalCode("100-0001")).not.toBeNull());
  it("英字はNG", () => expect(validatePostalCode("100000a")).not.toBeNull());
});

describe("customerFormSchema", () => {
  const validBase = {
    firstName: "田中",
    lastName: "太郎",
    email: "tanaka@example.com",
  };

  it("正常系: communities 配列あり", () => {
    const result = customerFormSchema.safeParse({
      ...validBase,
      communities: [
        {
          communityId: 1,
          joinedAt: "2024-04-01",
          auditMemberType: "regular",
          auditMemberPremium: true,
          affiliation: null,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("正常系: communities 省略（非会員登録）", () => {
    const result = customerFormSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("正常系: communities 空配列", () => {
    const result = customerFormSchema.safeParse({
      ...validBase,
      communities: [],
    });
    expect(result.success).toBe(true);
  });

  it("異常系: communityId が負数", () => {
    const result = customerFormSchema.safeParse({
      ...validBase,
      communities: [{ communityId: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it("正常系: コミュニティ詳細のオプショナルフィールド", () => {
    const result = customerFormSchema.safeParse({
      ...validBase,
      communities: [
        {
          communityId: 2,
          joinedAt: "2024-06-01",
          resignedAt: null,
          auditMemberType: null,
          auditMemberPremium: null,
          affiliation: "内部監査部門",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("正常系: 日付フィールドが null", () => {
    const result = customerFormSchema.safeParse({
      ...validBase,
      communities: [
        {
          communityId: 1,
          joinedAt: null,
          resignedAt: null,
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
