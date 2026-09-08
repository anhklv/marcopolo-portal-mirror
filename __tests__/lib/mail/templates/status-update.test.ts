import { describe, expect, it } from "vitest";
import {
  generateStatusUpdateBody,
  generateStatusUpdateSubject,
} from "@/lib/mail/templates/status-update";

const baseParams = {
  eventTitle: "参加ステータス変更テスト",
  eventDate: "2026-10-16T15:00:00.000Z",
  participationStatus: "現地参加",
  afterPartyStatus: "参加する",
};

describe("generateStatusUpdateSubject", () => {
  it("イベントタイトルを含む件名を返す", () => {
    expect(generateStatusUpdateSubject(baseParams)).toBe(
      "【参加ステータス変更テスト】参加ステータス更新のお知らせ"
    );
  });
});

describe("generateStatusUpdateBody", () => {
  it("通知に必要な項目と受信者別プレースホルダを含む", () => {
    const body = generateStatusUpdateBody(baseParams);

    expect(body).toContain("{CUSTOMER_NAME} 様");
    expect(body).toContain("■イベント名\n参加ステータス変更テスト");
    expect(body).toContain("■開催日時");
    expect(body).toContain("■参加ステータス\n現地参加");
    expect(body).toContain("■懇親会\n参加する");
    expect(body).toContain("{RSVP_URL}");
  });

  it("懇親会ステータスがない場合は懇親会セクションを省略する", () => {
    const body = generateStatusUpdateBody({
      ...baseParams,
      afterPartyStatus: null,
    });

    expect(body).not.toContain("■懇親会");
  });
});
