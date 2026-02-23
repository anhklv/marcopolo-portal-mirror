import { describe, it, expect } from "vitest";
import {
  generateInviteSubject,
  generateInviteBody,
} from "@/lib/mail/templates/invite";

const baseParams = {
  eventTitle: "第10回ベンチャー監査役の会",
  eventDate: "2026-06-15T18:00:00.000Z",
  eventLocation: "東京都千代田区",
  eventDescription: "今回のテーマは「IPO準備」です。",
  eventTimetable: "18:00 開場\n18:30 講演\n20:00 懇親会",
  eventNote: "参加費は無料です。",
};

describe("generateInviteSubject", () => {
  it("イベントタイトルを含む件名を返す", () => {
    const subject = generateInviteSubject(baseParams);
    expect(subject).toBe("【第10回ベンチャー監査役の会】ご案内");
  });
});

describe("generateInviteBody", () => {
  it("全フィールドを含む本文を生成する", () => {
    const body = generateInviteBody(baseParams);
    expect(body).toContain("お世話になっております");
    expect(body).toContain("第10回ベンチャー監査役の会のご案内です。");
    expect(body).toContain("【イベント概要】");
    expect(body).toContain("IPO準備");
    expect(body).toContain("【開催日時】");
    expect(body).toContain("【タイムテーブル】");
    expect(body).toContain("【場所】");
    expect(body).toContain("東京都千代田区");
    expect(body).toContain("{RSVP_URL}");
    expect(body).toContain("【備考】");
    expect(body).toContain("参加費は無料です。");
  });

  it("オプション項目がnullの場合はセクションを省略する", () => {
    const body = generateInviteBody({
      ...baseParams,
      eventLocation: null,
      eventDescription: null,
      eventTimetable: null,
      eventNote: null,
    });
    expect(body).not.toContain("【イベント概要】");
    expect(body).not.toContain("【タイムテーブル】");
    expect(body).not.toContain("【場所】");
    expect(body).not.toContain("【備考】");
    expect(body).toContain("{RSVP_URL}");
  });

  it("{RSVP_URL} プレースホルダを含む", () => {
    const body = generateInviteBody(baseParams);
    expect(body).toContain("{RSVP_URL}");
  });
});
