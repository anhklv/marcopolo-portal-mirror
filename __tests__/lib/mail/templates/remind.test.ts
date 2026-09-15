import { describe, it, expect } from "vitest";
import {
  generateRemindSubject,
  generateRemindBody,
} from "@/lib/mail/templates/remind";

const baseParams = {
  eventTitle: "第10回ベンチャー監査役の会",
  eventDate: "2026-06-15T18:00:00.000Z",
  eventLocation: "東京都千代田区",
  eventDescription: "今回のテーマは「IPO準備」です。",
  eventTimetable: "18:00 開場\n18:30 講演\n20:00 懇親会",
  eventNote: "参加費は無料です。",
};

describe("generateRemindSubject", () => {
  it("未回答者向けの件名を返す", () => {
    const subject = generateRemindSubject(baseParams);
    expect(subject).toBe("【第10回ベンチャー監査役の会】参加可否のご回答をお願いします");
  });

  it("再送対象者向けの件名を返す", () => {
    const subject = generateRemindSubject({
      ...baseParams,
      remindTarget: "invited",
    });
    expect(subject).toBe("【第10回ベンチャー監査役の会】ご案内（再送）");
  });
});

describe("generateRemindBody", () => {
  it("全フィールドを含む本文を生成する", () => {
    const body = generateRemindBody(baseParams);
    expect(body).toContain("{CUSTOMER_NAME}様");
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
    expect(body).toContain("まだ参加可否のご回答をいただいておりません");
  });

  it("オプション項目がnullの場合はセクションを省略する", () => {
    const body = generateRemindBody({
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
    expect(body).toContain("まだ参加可否のご回答をいただいておりません");
  });

  it("{RSVP_URL} プレースホルダを含む", () => {
    const body = generateRemindBody(baseParams);
    expect(body).toContain("{RSVP_URL}");
  });

  it("{CUSTOMER_NAME} プレースホルダを含む", () => {
    const body = generateRemindBody(baseParams);
    expect(body).toContain("{CUSTOMER_NAME}様");
  });

  it("未回答者向けの文言を含む", () => {
    const body = generateRemindBody({
      ...baseParams,
      remindTarget: "pending",
    });
    expect(body).toContain("まだ参加可否のご回答をいただいておりません");
    expect(body).toContain("お忙しい中恐縮ですが");
  });

  it.each(["invited", "all", "onsite", "online", "after_party"] as const)(
    "%s 向けは再送用の文言を含む",
    (remindTarget) => {
      const body = generateRemindBody({
        ...baseParams,
        remindTarget,
      });
      expect(body).toContain("先日ご案内いたしました本イベントについて、改めてご案内いたします");
      expect(body).toContain("ご回答内容の確認・変更は、以下のURLよりお願いいたします");
      expect(body).not.toContain("まだ参加可否のご回答をいただいておりません");
    }
  );
});
