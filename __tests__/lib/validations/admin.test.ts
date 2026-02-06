import { describe, it, expect } from "vitest";
import { adminCreateSchema, adminUpdateSchema, passwordChangeSchema } from "@/lib/validations/admin";

describe("adminCreateSchema", () => {
  it("正常系: 全項目入力", () => {
    const result = adminCreateSchema.safeParse({
      firstName: "太郎",
      lastName: "管理",
      email: "admin@example.com",
      password: "password12345",
      passwordConfirm: "password12345",
      role: "super",
      communityIds: [1, 2],
    });
    expect(result.success).toBe(true);
  });

  it("異常系: パスワードが一致しない", () => {
    const result = adminCreateSchema.safeParse({
      firstName: "太郎",
      lastName: "管理",
      email: "admin@example.com",
      password: "password12345",
      passwordConfirm: "different1234",
      role: "super",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: パスワードが12文字未満", () => {
    const result = adminCreateSchema.safeParse({
      firstName: "太郎",
      lastName: "管理",
      email: "admin@example.com",
      password: "short123",
      passwordConfirm: "short123",
      role: "super",
    });
    expect(result.success).toBe(false);
  });

  it("正常系: パスワードがちょうど12文字", () => {
    const result = adminCreateSchema.safeParse({
      firstName: "太郎",
      lastName: "管理",
      email: "admin@example.com",
      password: "abcdefghijkl",
      passwordConfirm: "abcdefghijkl",
      role: "super",
    });
    expect(result.success).toBe(true);
  });

  it("異常系: 名が空", () => {
    const result = adminCreateSchema.safeParse({
      firstName: "",
      lastName: "管理",
      email: "admin@example.com",
      password: "password12345",
      passwordConfirm: "password12345",
      role: "super",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: メールアドレスが不正", () => {
    const result = adminCreateSchema.safeParse({
      firstName: "太郎",
      lastName: "管理",
      email: "not-email",
      password: "password12345",
      passwordConfirm: "password12345",
      role: "super",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: ロールが不正", () => {
    const result = adminCreateSchema.safeParse({
      firstName: "太郎",
      lastName: "管理",
      email: "admin@example.com",
      password: "password12345",
      passwordConfirm: "password12345",
      role: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: community_adminでコミュニティ未選択", () => {
    const result = adminCreateSchema.safeParse({
      firstName: "太郎",
      lastName: "管理",
      email: "admin@example.com",
      password: "password12345",
      passwordConfirm: "password12345",
      role: "community_admin",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: community_adminでコミュニティ空配列", () => {
    const result = adminCreateSchema.safeParse({
      firstName: "太郎",
      lastName: "管理",
      email: "admin@example.com",
      password: "password12345",
      passwordConfirm: "password12345",
      role: "community_admin",
      communityIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("正常系: community_adminでコミュニティ選択あり", () => {
    const result = adminCreateSchema.safeParse({
      firstName: "太郎",
      lastName: "管理",
      email: "admin@example.com",
      password: "password12345",
      passwordConfirm: "password12345",
      role: "community_admin",
      communityIds: [1],
    });
    expect(result.success).toBe(true);
  });

  it("正常系: superはコミュニティ未選択でもOK", () => {
    const result = adminCreateSchema.safeParse({
      firstName: "太郎",
      lastName: "管理",
      email: "admin@example.com",
      password: "password12345",
      passwordConfirm: "password12345",
      role: "super",
    });
    expect(result.success).toBe(true);
  });
});

describe("adminUpdateSchema", () => {
  it("正常系: 全項目入力", () => {
    const result = adminUpdateSchema.safeParse({
      firstName: "太郎",
      lastName: "管理",
      email: "admin@example.com",
      role: "community_admin",
      communityIds: [1],
    });
    expect(result.success).toBe(true);
  });

  it("異常系: 姓が空", () => {
    const result = adminUpdateSchema.safeParse({
      firstName: "太郎",
      lastName: "",
      email: "admin@example.com",
      role: "super",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: community_adminでコミュニティ未選択", () => {
    const result = adminUpdateSchema.safeParse({
      firstName: "太郎",
      lastName: "管理",
      email: "admin@example.com",
      role: "community_admin",
    });
    expect(result.success).toBe(false);
  });
});

describe("passwordChangeSchema", () => {
  it("正常系: パスワード変更", () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: "oldpassword12",
      newPassword: "newpassword123",
      newPasswordConfirm: "newpassword123",
    });
    expect(result.success).toBe(true);
  });

  it("異常系: 新パスワードが一致しない", () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: "oldpassword12",
      newPassword: "newpassword123",
      newPasswordConfirm: "different12345",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: 新パスワードが12文字未満", () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: "oldpassword12",
      newPassword: "short123",
      newPasswordConfirm: "short123",
    });
    expect(result.success).toBe(false);
  });

  it("異常系: 現在のパスワードが空", () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: "",
      newPassword: "newpassword123",
      newPasswordConfirm: "newpassword123",
    });
    expect(result.success).toBe(false);
  });
});
