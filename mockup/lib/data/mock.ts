export type Customer = {
  id: string;
  name: string; // 氏名(姓名)
  nameKana?: string; // 氏名(セイメイ) - 任意
  company?: string; // 会社名・所属 - 任意
  email: string;
  phone?: string; // 電話番号 - 任意
  type: "監査役協会会員" | "ないかんMeetup会員" | "非会員";
  note?: string; // 備考 - 任意
  status: "active" | "inactive";
  registeredAt: string;
};

export type Event = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  status: "planning" | "open" | "closed";
  attendeesCount: number;
  responseDeadline?: string; // 回答期限
};

// 参加データ（中間テーブル）
export type RSVP = {
  eventId: string;
  customerId: string;
  token: string; // URL用の一意な文字列
  status: "未回答" | "参加" | "不参加";
  respondedAt?: string; // 回答日時
};

export const customers: Customer[] = [
  {
    id: "C001",
    name: "山田 太郎",
    nameKana: "ヤマダ タロウ",
    company: "株式会社東京貿易",
    email: "yamada@example.com",
    phone: "03-1234-5678",
    type: "監査役協会会員",
    note: "紹介者: 鈴木",
    status: "active",
    registeredAt: "2024-01-10",
  },
  {
    id: "C002",
    name: "鈴木 一郎",
    nameKana: "スズキ イチロウ",
    company: "マルコポーロ商事",
    email: "suzuki@example.com",
    phone: "03-2345-6789",
    type: "ないかんMeetup会員",
    status: "active",
    registeredAt: "2024-02-15",
  },
  {
    id: "C003",
    name: "佐藤 花子",
    nameKana: "サトウ ハナコ",
    company: "グローバルテック株式会社",
    email: "sato@example.com",
    phone: "03-3456-7890",
    type: "非会員",
    status: "active",
    registeredAt: "2024-03-05",
  },
  {
    id: "C004",
    name: "田中 次郎",
    nameKana: "タナカ ジロウ",
    company: "田中製作所",
    email: "tanaka@example.com",
    phone: "03-4567-8901",
    type: "監査役協会会員",
    status: "inactive",
    registeredAt: "2023-11-20",
  },
  {
    id: "C005",
    name: "伊藤 美咲",
    nameKana: "イトウ ミサキ",
    company: "フリーランス",
    email: "ito@example.com",
    type: "非会員",
    status: "active",
    registeredAt: "2024-04-01",
  },
];

export const events: Event[] = [
  {
    id: "E001",
    title: "第10回 監査役交流会",
    date: "2028-06-15 18:00",
    location: "東京都港区六本木 1-1-1 会議室A",
    description: "定例の監査役交流会です。今回のテーマは「ガバナンス改革」について。",
    status: "open",
    attendeesCount: 24,
    responseDeadline: "2028-06-10 23:59",
  },
  {
    id: "E002",
    title: "ないかんMeetup 7月度",
    date: "2028-07-20 19:00",
    location: "オンライン (Zoom)",
    description: "若手内部監査人向けのミートアップイベント。",
    status: "planning",
    attendeesCount: 0,
    responseDeadline: "2028-07-15 23:59",
  },
  {
    id: "E003",
    title: "【特別セミナー】DX時代の監査",
    date: "2028-05-10 15:00",
    location: "東京都千代田区大手町",
    description: "外部講師を招いての特別セミナー。",
    status: "closed",
    attendeesCount: 45,
    responseDeadline: "2028-05-05 23:59",
  },
];

// 参加データ（モック）
export const rsvps: RSVP[] = [
  {
    eventId: "E001",
    customerId: "C001",
    token: "token-yamada-e001",
    status: "参加",
    respondedAt: "2024-05-20 10:00",
  },
  {
    eventId: "E001",
    customerId: "C002",
    token: "token-suzuki-e001",
    status: "不参加",
    respondedAt: "2024-05-20 11:00",
  },
  {
    eventId: "E001",
    customerId: "C003",
    token: "token-sato-e001",
    status: "未回答",
  },
  {
    eventId: "E001",
    customerId: "C004",
    token: "token-tanaka-e001",
    status: "未回答",
  },
  {
    eventId: "E001",
    customerId: "C005",
    token: "token-ito-e001",
    status: "不参加",
    respondedAt: "2024-05-20 12:00",
  },
  {
    eventId: "E002",
    customerId: "C001",
    token: "token-yamada-e002",
    status: "未回答",
  },
];

// ヘルパー関数: トークンから顧客情報を取得
export function getCustomerByToken(eventId: string, token: string): Customer | null {
  const rsvp = rsvps.find((r) => r.eventId === eventId && r.token === token);
  if (!rsvp) return null;
  return customers.find((c) => c.id === rsvp.customerId) || null;
}

// ヘルパー関数: メールアドレスからイベントの招待情報を取得
export function getRSVPByEmail(eventId: string, email: string): RSVP | null {
  const customer = customers.find((c) => c.email === email);
  if (!customer) return null;
  return rsvps.find((r) => r.eventId === eventId && r.customerId === customer.id) || null;
}
