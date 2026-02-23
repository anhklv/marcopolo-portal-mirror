import { describe, it, expect } from "vitest";
import {
  generateRsvpToken,
  buildRsvpUrl,
  replacePlaceholders,
} from "@/lib/helpers/invite";

describe("generateRsvpToken", () => {
  it("UUID形式のトークンを返す", () => {
    const token = generateRsvpToken();
    expect(token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it("毎回異なるトークンを生成する", () => {
    const token1 = generateRsvpToken();
    const token2 = generateRsvpToken();
    expect(token1).not.toBe(token2);
  });
});

describe("buildRsvpUrl", () => {
  it("ベースURL + /events/{eventId}/rsvp?token={token} でURLを生成する", () => {
    const url = buildRsvpUrl("http://localhost:3000", 10, "abc-123");
    expect(url).toBe("http://localhost:3000/events/10/rsvp?token=abc-123");
  });

  it("末尾スラッシュなしのベースURLで正しく動作する", () => {
    const url = buildRsvpUrl("https://example.com", 5, "token-xyz");
    expect(url).toBe("https://example.com/events/5/rsvp?token=token-xyz");
  });
});

describe("replacePlaceholders", () => {
  it("{RSVP_URL} をRSVP URLに置換する", () => {
    const body = "以下のURLからご回答ください。\n{RSVP_URL}";
    const result = replacePlaceholders(body, {
      rsvpUrl: "http://localhost:3000/rsvp/abc",
    });
    expect(result).toBe(
      "以下のURLからご回答ください。\nhttp://localhost:3000/rsvp/abc"
    );
  });

  it("複数の {RSVP_URL} を全て置換する", () => {
    const body = "URL1: {RSVP_URL}\nURL2: {RSVP_URL}";
    const result = replacePlaceholders(body, {
      rsvpUrl: "http://test.com/rsvp/x",
    });
    expect(result).toBe(
      "URL1: http://test.com/rsvp/x\nURL2: http://test.com/rsvp/x"
    );
  });

  it("{CUSTOMER_NAME} を顧客名に置換する", () => {
    const body = "{CUSTOMER_NAME}様\n{RSVP_URL}";
    const result = replacePlaceholders(body, {
      rsvpUrl: "http://test.com/rsvp/x",
      customerName: "山田太郎",
    });
    expect(result).toBe("山田太郎様\nhttp://test.com/rsvp/x");
  });

  it("customerName未指定時は {CUSTOMER_NAME} をそのまま残す", () => {
    const body = "{CUSTOMER_NAME}様";
    const result = replacePlaceholders(body, {
      rsvpUrl: "http://test.com/rsvp/x",
    });
    expect(result).toBe("{CUSTOMER_NAME}様");
  });
});
