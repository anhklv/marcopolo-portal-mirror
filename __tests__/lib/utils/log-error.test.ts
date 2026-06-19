import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logServerError } from "@/lib/utils/log-error";

describe("logServerError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("通常の Error をログ出力する", () => {
    const error = new Error("something failed");
    logServerError("testAction", error);

    expect(console.error).toHaveBeenCalledWith(
      "[testAction] something failed",
      error
    );
  });

  it("Prisma エラーは code / target を付与してログ出力する", () => {
    const error = Object.assign(new Error("Unique constraint failed"), {
      code: "P2002",
      meta: { target: ["email"] },
    });

    logServerError("createCustomerAction", error);

    expect(console.error).toHaveBeenCalledWith(
      "[createCustomerAction] Unique constraint failed (code=P2002, fields=[\"email\"])",
      error.stack
    );
  });

  it("文字列エラーをログ出力する", () => {
    logServerError("testAction", "plain error");

    expect(console.error).toHaveBeenCalledWith(
      "[testAction] plain error",
      "plain error"
    );
  });
});
