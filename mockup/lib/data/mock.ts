export type Customer = {
  id: string;
  name: string;
  company: string;
  email: string;
  type: "監査役協会会員" | "ないかんMeetup会員" | "非会員";
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
};

export const customers: Customer[] = [
  {
    id: "C001",
    name: "山田 太郎",
    company: "株式会社東京貿易",
    email: "yamada@example.com",
    type: "監査役協会会員",
    status: "active",
    registeredAt: "2024-01-10",
  },
  {
    id: "C002",
    name: "鈴木 一郎",
    company: "マルコポーロ商事",
    email: "suzuki@example.com",
    type: "ないかんMeetup会員",
    status: "active",
    registeredAt: "2024-02-15",
  },
  {
    id: "C003",
    name: "佐藤 花子",
    company: "グローバルテック株式会社",
    email: "sato@example.com",
    type: "非会員",
    status: "active",
    registeredAt: "2024-03-05",
  },
  {
    id: "C004",
    name: "田中 次郎",
    company: "田中製作所",
    email: "tanaka@example.com",
    type: "監査役協会会員",
    status: "inactive",
    registeredAt: "2023-11-20",
  },
  {
    id: "C005",
    name: "伊藤 美咲",
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
    date: "2024-06-15 18:00",
    location: "東京都港区六本木 1-1-1 会議室A",
    description: "定例の監査役交流会です。今回のテーマは「ガバナンス改革」について。",
    status: "open",
    attendeesCount: 24,
  },
  {
    id: "E002",
    title: "ないかんMeetup 7月度",
    date: "2024-07-20 19:00",
    location: "オンライン (Zoom)",
    description: "若手内部監査人向けのミートアップイベント。",
    status: "planning",
    attendeesCount: 0,
  },
  {
    id: "E003",
    title: "【特別セミナー】DX時代の監査",
    date: "2024-05-10 15:00",
    location: "東京都千代田区大手町",
    description: "外部講師を招いての特別セミナー。",
    status: "closed",
    attendeesCount: 45,
  },
];
