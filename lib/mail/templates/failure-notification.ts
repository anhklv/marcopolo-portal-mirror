interface FailureNotificationItem {
  customerName: string;
  emailAddress: string;
  emailType: "main" | "sub";
  subEmailOrder: number | null;
  reason: string;
}

interface FailureNotificationTemplateParams {
  communityName: string;
  eventTitle: string;
  mailSubject: string;
  sentAt: Date;
  targetCount: number;
  returnedCount: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  failures: FailureNotificationItem[];
  detailUrl?: string;
  isAdditional: boolean;
}

const JAPAN_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function emailTypeLabel(item: FailureNotificationItem): string {
  if (item.emailType === "main") return "メイン";
  return `サブ${item.subEmailOrder ?? ""}`;
}

export function generateFailureNotificationSubject(
  params: FailureNotificationTemplateParams
): string {
  const suffix = params.isAdditional ? "（追加）" : "";
  return `【メール送信エラー通知${suffix}】【${params.communityName}】${params.eventTitle}`;
}

export function generateFailureNotificationBody(
  params: FailureNotificationTemplateParams
): string {
  const sections = [
    `${params.communityName} ご担当者様`,
    "以下のイベントメール送信において、送信エラーが検出されましたのでお知らせいたします。",
    [
      "■イベント情報",
      `イベント名：${params.eventTitle}`,
      `メール件名：${params.mailSubject}`,
      `送信日時：${JAPAN_DATE_TIME_FORMATTER.format(params.sentAt)}`,
    ].join("\n"),
    [
      "■送信結果",
      `対象：${params.targetCount}件`,
      `結果確認済：${params.returnedCount}件`,
      `成功：${params.successCount}件`,
      `失敗：${params.failedCount}件`,
      `結果待ち：${params.pendingCount}件`,
      `今回通知：${params.failures.length}件`,
    ].join("\n"),
    [
      "■エラー一覧",
      ...params.failures.map((failure, index) =>
        [
          `${index + 1}.`,
          `顧客名：${failure.customerName}`,
          `メールアドレス：${failure.emailAddress}`,
          `種別：${emailTypeLabel(failure)}`,
          `理由：${failure.reason}`,
        ].join("\n")
      ),
    ].join("\n\n"),
  ];

  if (params.detailUrl) {
    sections.push(
      `■管理画面\n${params.detailUrl}\n\n詳細は管理画面の「送信メール」タブよりご確認ください。`
    );
  }

  sections.push(
    "※本メールはシステムから自動送信されています。\n※本メールへの返信は受け付けておりません。"
  );

  return sections.join("\n\n");
}

