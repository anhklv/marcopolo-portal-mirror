import { describe, it, expect } from "vitest";
import {
  isPrismaUniqueError,
  isPrismaUniqueViolationOnField,
} from "@/lib/utils/prisma-error";

describe("isPrismaUniqueError", () => {
  it("P2002 を true と判定する", () => {
    expect(isPrismaUniqueError({ code: "P2002" })).toBe(true);
  });

  it("P2002 以外は false", () => {
    expect(isPrismaUniqueError({ code: "P2025" })).toBe(false);
    expect(isPrismaUniqueError(new Error("fail"))).toBe(false);
  });
});

describe("isPrismaUniqueViolationOnField", () => {
  it("email フィールドの P2002 を true と判定する", () => {
    expect(
      isPrismaUniqueViolationOnField(
        { code: "P2002", meta: { target: ["email"] } },
        "email"
      )
    ).toBe(true);
  });

  it("id（主キー）の P2002 は email 判定で false", () => {
    expect(
      isPrismaUniqueViolationOnField(
        { code: "P2002", meta: { target: ["id"] } },
        "email"
      )
    ).toBe(false);
  });

  it("P2002 以外は false", () => {
    expect(
      isPrismaUniqueViolationOnField({ code: "P2025" }, "email")
    ).toBe(false);
  });

  it("Prisma 7 driver adapter 形式の email P2002 を true と判定する", () => {
    expect(
      isPrismaUniqueViolationOnField(
        {
          code: "P2002",
          meta: {
            modelName: "Customer",
            driverAdapterError: {
              cause: {
                constraint: { fields: ["email"] },
              },
            },
          },
        },
        "email"
      )
    ).toBe(true);
  });
});
