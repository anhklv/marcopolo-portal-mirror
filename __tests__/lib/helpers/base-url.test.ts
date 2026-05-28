import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockHeaders = vi.fn();

vi.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}));

import { getBaseUrl } from "@/lib/helpers/base-url";

describe("getBaseUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.APP_BASE_URL;
    delete process.env.VERCEL_URL;
    mockHeaders.mockResolvedValue(new Headers());
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("APP_BASE_URL を最優先する", async () => {
    process.env.APP_BASE_URL = "https://marcopolo-portal.jp";

    await expect(getBaseUrl()).resolves.toBe("https://marcopolo-portal.jp");
  });

  it("APP_BASE_URL がなければ headers から組み立てる", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        host: "staging.marcopolo-portal.jp",
        "x-forwarded-proto": "https",
      })
    );

    await expect(getBaseUrl()).resolves.toBe("https://staging.marcopolo-portal.jp");
  });

  it("headers だけのとき proto 未設定なら http を使う", async () => {
    mockHeaders.mockResolvedValue(new Headers({ host: "localhost:3000" }));

    await expect(getBaseUrl()).resolves.toBe("http://localhost:3000");
  });

  it("headers が使えなければ VERCEL_URL に進む", async () => {
    process.env.VERCEL_URL = "marcopolo-portal-staging-eo0ry9dk0.vercel.app";
    mockHeaders.mockRejectedValue(new Error("outside request scope"));

    await expect(getBaseUrl()).resolves.toBe(
      "https://marcopolo-portal-staging-eo0ry9dk0.vercel.app"
    );
  });

  it("headers が取れなければ VERCEL_URL を使う", async () => {
    process.env.VERCEL_URL = "marcopolo-portal-staging-eo0ry9dk0.vercel.app";
    mockHeaders.mockResolvedValue(new Headers());

    await expect(getBaseUrl()).resolves.toBe(
      "https://marcopolo-portal-staging-eo0ry9dk0.vercel.app"
    );
  });

  it("どれもなければ localhost にフォールバックする", async () => {
    mockHeaders.mockResolvedValue(new Headers());

    await expect(getBaseUrl()).resolves.toBe("http://localhost:3000");
  });
});
