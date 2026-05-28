import { describe, it, expect } from "vitest";
import {
  devCustomerEmail,
  devCustomerSubEmails,
} from "@/lib/helpers/dev-customer-email";

describe("devCustomerEmail", () => {
  it("id ベースの calme.dev アドレスを返す", () => {
    expect(devCustomerEmail(2)).toBe("takashi.aoki+2@calme.dev");
  });
});

describe("devCustomerSubEmails", () => {
  it("サブメールを連番で生成する", () => {
    expect(devCustomerSubEmails(1, 2)).toEqual([
      "takashi.aoki+1_1@calme.dev",
      "takashi.aoki+1_2@calme.dev",
    ]);
  });

  it("count=0 のとき空配列を返す", () => {
    expect(devCustomerSubEmails(3, 0)).toEqual([]);
  });
});
