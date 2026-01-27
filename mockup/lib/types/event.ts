export type EventType = "ベンチャー監査役の会" | "ないかんMeetup" | "その他";

export type Event = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  eventType: EventType; // イベント種別
  timetable?: string; // タイムテーブル
  note?: string; // 備考
  attendeesCount: number;
  responseDeadline?: string; // 回答期限
  isPaused?: boolean; // 一時停止中かどうか
  allowsOnline?: boolean; // オンライン参加を可能にするか
  hasAfterParty?: boolean; // 懇親会を開催するか
};

