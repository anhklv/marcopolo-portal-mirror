// 参加データ（中間テーブル）
export type RSVP = {
  eventId: string;
  customerId: string;
  token: string; // URL用の一意な文字列
  status: "未回答" | "参加" | "オンライン参加" | "不参加";
  respondedAt?: string; // 回答日時
  attendanceType?: "通常参加" | "オンライン参加"; // 参加タイプ（参加の場合のみ）
  afterPartyStatus?: "参加" | "不参加"; // 懇親会の参加状況（イベントに懇親会があり、通常参加を選択した場合のみ）
  comment?: string; // メッセージ・連絡事項
};

