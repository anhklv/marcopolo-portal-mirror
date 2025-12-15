export type MemberType = "監査役協会" | "ないかんMeetup";
export type MemberFilterValue = MemberType | "非会員"; // フィルター用（非会員を含む）

export type Customer = {
  id: string;
  name: string; // 氏名(姓名)
  nameKana?: string; // 氏名(セイメイ) - 任意
  company?: string; // 会社名・所属 - 任意
  email: string;
  phone?: string; // 電話番号 - 任意
  memberTypes: MemberType[]; // 会員区分（配列で複数所属可能、空配列=非会員）
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
  attendeesCount: number;
  responseDeadline?: string; // 回答期限
  isPaused?: boolean; // 一時停止中かどうか
};

// イベントのステータスを自動判定する関数
export function getEventStatus(event: Event): "open" | "waiting" | "closed" {
  const now = new Date();
  const eventDate = new Date(event.date);
  const responseDeadline = event.responseDeadline ? new Date(event.responseDeadline) : null;

  // 開催日時を過ぎている場合は終了
  if (now >= eventDate) {
    return "closed";
  }

  // 回答期限が設定されている場合
  if (responseDeadline) {
    if (now < responseDeadline) {
      return "open"; // 現在日時 < 回答期限: 受付中
    } else {
      return "waiting"; // 回答期限 ≤ 現在日時 < 開催日時: 開催待ち
    }
  }

  // 回答期限が設定されていない場合は、開催日時まで受付中
  return "open";
}

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
    memberTypes: ["監査役協会"],
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
    memberTypes: ["ないかんMeetup"],
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
    memberTypes: [],
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
    memberTypes: ["監査役協会"],
    status: "inactive",
    registeredAt: "2023-11-20",
  },
  {
    id: "C005",
    name: "伊藤 美咲",
    nameKana: "イトウ ミサキ",
    company: "フリーランス",
    email: "ito@example.com",
    memberTypes: [],
    status: "active",
    registeredAt: "2024-04-01",
  },
  {
    id: "C006",
    name: "高橋 健太",
    nameKana: "タカハシ ケンタ",
    company: "株式会社サンライズ",
    email: "takahashi@example.com",
    phone: "03-5678-9012",
    memberTypes: ["監査役協会", "ないかんMeetup"],
    note: "新規入会（両方の会員）",
    status: "active",
    registeredAt: "2024-05-12",
  },
  {
    id: "C007",
    name: "渡辺 麻衣",
    nameKana: "ワタナベ マイ",
    company: "テクノロジーソリューションズ株式会社",
    email: "watanabe@example.com",
    phone: "03-6789-0123",
    memberTypes: ["ないかんMeetup"],
    status: "active",
    registeredAt: "2024-06-03",
  },
  {
    id: "C008",
    name: "中村 雄一",
    nameKana: "ナカムラ ユウイチ",
    company: "株式会社ファイナンスパートナーズ",
    email: "nakamura@example.com",
    phone: "03-7890-1234",
    memberTypes: ["監査役協会"],
    note: "紹介者: 山田",
    status: "active",
    registeredAt: "2024-07-18",
  },
  {
    id: "C009",
    name: "小林 さくら",
    nameKana: "コバヤシ サクラ",
    company: "デジタルイノベーション株式会社",
    email: "kobayashi@example.com",
    phone: "03-8901-2345",
    memberTypes: ["ないかんMeetup"],
    status: "active",
    registeredAt: "2024-08-22",
  },
  {
    id: "C010",
    name: "加藤 大輔",
    nameKana: "カトウ ダイスケ",
    company: "株式会社ストラテジックアドバイザーズ",
    email: "kato@example.com",
    phone: "03-9012-3456",
    memberTypes: ["監査役協会"],
    status: "active",
    registeredAt: "2024-09-10",
  },
  {
    id: "C011",
    name: "吉田 由美",
    nameKana: "ヨシダ ユミ",
    company: "フリーランス",
    email: "yoshida@example.com",
    memberTypes: [],
    note: "イベント参加希望",
    status: "active",
    registeredAt: "2024-10-05",
  },
  {
    id: "C012",
    name: "松本 健一",
    nameKana: "マツモト ケンイチ",
    company: "株式会社コーポレートガバナンス",
    email: "matsumoto@example.com",
    phone: "03-1111-2222",
    memberTypes: ["監査役協会", "ないかんMeetup"],
    note: "両方の会員",
    status: "active",
    registeredAt: "2024-11-01",
  },
];

export const events: Event[] = [
  {
    id: "E001",
    title: "第10回 監査役交流会",
    date: "2028-06-15T18:00:00+09:00",
    location: "東京都港区六本木 1-1-1 会議室A",
    description: "定例の監査役交流会です。今回のテーマは「ガバナンス改革」について。",
    attendeesCount: 24,
    responseDeadline: "2028-06-10T23:59:00+09:00",
  },
  {
    id: "E002",
    title: "ないかんMeetup 7月度",
    date: "2028-07-20T19:00:00+09:00",
    location: "オンライン (Zoom)",
    description: "若手内部監査人向けのミートアップイベント。",
    attendeesCount: 0,
    responseDeadline: "2028-07-15T23:59:00+09:00",
  },
  {
    id: "E003",
    title: "【特別セミナー】DX時代の監査",
    date: "2028-05-10T15:00:00+09:00",
    location: "東京都千代田区大手町",
    description: "外部講師を招いての特別セミナー。",
    attendeesCount: 45,
    responseDeadline: "2028-05-05T23:59:00+09:00",
  },
  {
    id: "E004",
    title: "第9回 監査役交流会",
    date: "2024-03-20T18:00:00+09:00",
    location: "東京都港区六本木 1-1-1 会議室A",
    description: "定例の監査役交流会です。今回のテーマは「リスク管理の実践」について。",
    attendeesCount: 28,
    responseDeadline: "2024-03-15T23:59:00+09:00",
  },
  {
    id: "E005",
    title: "ないかんMeetup 3月度",
    date: "2024-02-15T19:00:00+09:00",
    location: "オンライン (Zoom)",
    description: "若手内部監査人向けのミートアップイベント。",
    attendeesCount: 15,
    responseDeadline: "2024-02-10T23:59:00+09:00",
  },
  {
    id: "E006",
    title: "【新年会】監査役・内部監査人交流会",
    date: "2024-01-25T18:30:00+09:00",
    location: "東京都中央区銀座 レストラン",
    description: "新年を祝う交流会。親睦を深めながら情報交換を行います。",
    attendeesCount: 35,
    responseDeadline: "2024-01-20T23:59:00+09:00",
  },
  {
    id: "E007",
    title: "第11回 監査役交流会",
    date: "2028-08-25T18:00:00+09:00",
    location: "東京都港区六本木 1-1-1 会議室A",
    description: "定例の監査役交流会です。今回のテーマは「ESG経営と監査の役割」について。",
    attendeesCount: 18,
    responseDeadline: "2028-08-20T23:59:00+09:00",
    isPaused: true,
  },
  {
    id: "E008",
    title: "ないかんMeetup 8月度",
    date: "2028-09-15T19:00:00+09:00",
    location: "オンライン (Zoom)",
    description: "若手内部監査人向けのミートアップイベント。今回は「リモート監査の実践」をテーマにします。",
    attendeesCount: 0,
    responseDeadline: "2028-09-10T23:59:00+09:00",
  },
  {
    id: "E009",
    title: "【秋のセミナー】内部監査の最新動向",
    date: "2028-10-12T14:00:00+09:00",
    location: "東京都千代田区丸の内 セミナールーム",
    description: "内部監査の最新動向について、専門家を招いてセミナーを開催します。",
    attendeesCount: 32,
    responseDeadline: "2028-10-05T23:59:00+09:00",
  },
  {
    id: "E010",
    title: "第12回 監査役交流会",
    date: "2026-11-14T22:00:00+09:00",
    location: "東京都港区六本木 1-1-1 会議室A",
    description: "定例の監査役交流会です。今回のテーマは「コーポレートガバナンスの実践」について。",
    attendeesCount: 20,
    responseDeadline: "2024-12-01T23:59:00+09:00",
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
  // 過去のイベント E004: 第9回 監査役交流会 (2024-03-20)
  {
    eventId: "E004",
    customerId: "C001",
    token: "token-yamada-e004",
    status: "参加",
    respondedAt: "2024-03-15 10:00",
  },
  {
    eventId: "E004",
    customerId: "C002",
    token: "token-suzuki-e004",
    status: "不参加",
    respondedAt: "2024-03-15 11:00",
  },
  {
    eventId: "E004",
    customerId: "C003",
    token: "token-sato-e004",
    status: "未回答",
  },
  {
    eventId: "E004",
    customerId: "C004",
    token: "token-tanaka-e004",
    status: "参加",
    respondedAt: "2024-03-16 09:00",
  },
  {
    eventId: "E004",
    customerId: "C005",
    token: "token-ito-e004",
    status: "不参加",
    respondedAt: "2024-03-16 14:00",
  },
  // 過去のイベント E005: ないかんMeetup 3月度 (2024-02-15)
  {
    eventId: "E005",
    customerId: "C001",
    token: "token-yamada-e005",
    status: "参加",
    respondedAt: "2024-02-10 10:00",
  },
  {
    eventId: "E005",
    customerId: "C002",
    token: "token-suzuki-e005",
    status: "参加",
    respondedAt: "2024-02-10 11:00",
  },
  {
    eventId: "E005",
    customerId: "C003",
    token: "token-sato-e005",
    status: "未回答",
  },
  {
    eventId: "E005",
    customerId: "C004",
    token: "token-tanaka-e005",
    status: "不参加",
    respondedAt: "2024-02-11 09:00",
  },
  {
    eventId: "E005",
    customerId: "C005",
    token: "token-ito-e005",
    status: "参加",
    respondedAt: "2024-02-11 15:00",
  },
  // 過去のイベント E006: 【新年会】監査役・内部監査人交流会 (2024-01-25)
  {
    eventId: "E006",
    customerId: "C001",
    token: "token-yamada-e006",
    status: "参加",
    respondedAt: "2024-01-20 10:00",
  },
  {
    eventId: "E006",
    customerId: "C002",
    token: "token-suzuki-e006",
    status: "参加",
    respondedAt: "2024-01-20 11:00",
  },
  {
    eventId: "E006",
    customerId: "C003",
    token: "token-sato-e006",
    status: "未回答",
  },
  {
    eventId: "E006",
    customerId: "C004",
    token: "token-tanaka-e006",
    status: "参加",
    respondedAt: "2024-01-21 09:00",
  },
  {
    eventId: "E006",
    customerId: "C005",
    token: "token-ito-e006",
    status: "不参加",
    respondedAt: "2024-01-21 14:00",
  },
  // 新規追加顧客のRSVPデータ
  {
    eventId: "E001",
    customerId: "C006",
    token: "token-takahashi-e001",
    status: "参加",
    respondedAt: "2024-05-21 09:00",
  },
  {
    eventId: "E001",
    customerId: "C007",
    token: "token-watanabe-e001",
    status: "未回答",
  },
  {
    eventId: "E001",
    customerId: "C008",
    token: "token-nakamura-e001",
    status: "参加",
    respondedAt: "2024-05-21 14:00",
  },
  {
    eventId: "E001",
    customerId: "C009",
    token: "token-kobayashi-e001",
    status: "不参加",
    respondedAt: "2024-05-22 10:00",
  },
  {
    eventId: "E001",
    customerId: "C010",
    token: "token-kato-e001",
    status: "参加",
    respondedAt: "2024-05-22 11:00",
  },
  {
    eventId: "E001",
    customerId: "C011",
    token: "token-yoshida-e001",
    status: "未回答",
  },
  {
    eventId: "E002",
    customerId: "C006",
    token: "token-takahashi-e002",
    status: "未回答",
  },
  {
    eventId: "E002",
    customerId: "C007",
    token: "token-watanabe-e002",
    status: "未回答",
  },
  {
    eventId: "E002",
    customerId: "C008",
    token: "token-nakamura-e002",
    status: "未回答",
  },
  {
    eventId: "E002",
    customerId: "C009",
    token: "token-kobayashi-e002",
    status: "未回答",
  },
  {
    eventId: "E002",
    customerId: "C010",
    token: "token-kato-e002",
    status: "未回答",
  },
  {
    eventId: "E002",
    customerId: "C011",
    token: "token-yoshida-e002",
    status: "未回答",
  },
];

// ヘルパー関数: トークンから顧客情報を取得
export function getCustomerByToken(eventId: string, token: string): Customer | null {
  const rsvp = rsvps.find((r) => r.eventId === eventId && r.token === token);
  if (!rsvp) return null;
  return customers.find((c) => c.id === rsvp.customerId) || null;
}

// ヘルパー関数: メールアドレスからイベントの案内情報を取得
export function getRSVPByEmail(eventId: string, email: string): RSVP | null {
  const customer = customers.find((c) => c.email === email);
  if (!customer) return null;
  return rsvps.find((r) => r.eventId === eventId && r.customerId === customer.id) || null;
}

// ヘルパー関数: 会員区分の表示名を取得
export function getMemberTypeDisplayName(memberTypes: MemberType[]): string {
  if (memberTypes.length === 0) return "非会員";

  // ソートして表示順を固定（監査役協会が先）
  const sorted = [...memberTypes].sort();

  if (sorted.length === 2) return "監査役協会・ないかんMeetup";
  return sorted[0];
}

// ヘルパー関数: 会員かどうかを判定
export function isMember(memberTypes: MemberType[]): boolean {
  return memberTypes.length > 0;
}

// ヘルパー関数: 特定の会員区分を持っているか判定
export function hasMemberType(memberTypes: MemberType[], type: MemberType): boolean {
  return memberTypes.includes(type);
}
