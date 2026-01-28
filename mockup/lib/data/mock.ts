// 型定義は @/lib/types からインポート
import type {
  Community,
  CommunityFilterValue,
  MemberCategory,
  ContractType,
  Customer,
  EventType,
  Event,
  RSVP,
  SurveyQuestion,
  Survey,
  SurveyResponse,
  FixedSurveyResponse,
  SurveyToken,
  Admin,
} from "@/lib/types";

// 型定義を再エクスポート（既存コードとの互換性のため）
export type {
  Community,
  CommunityFilterValue,
  MemberCategory,
  ContractType,
  Customer,
  EventType,
  Event,
  RSVP,
  SurveyQuestion,
  Survey,
  SurveyResponse,
  FixedSurveyResponse,
  SurveyToken,
  Admin,
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
      return "waiting"; // 回答期限 ≤ 現在日時 < 開催日時: 受付終了
    }
  }

  // 回答期限が設定されていない場合は、開催日時まで受付中
  return "open";
}


export const customers: Customer[] = [
  {
    id: "C001",
    name: "山田 太郎",
    nameKana: "ヤマダ タロウ",
    company: "株式会社東京貿易",
    email: "yamada@example.com",
    subEmails: ["yamada.sub@example.com"],
    phone: "0312345678",
    postalCode: "1000001",
    prefecture: "東京都",
    city: "千代田区千代田1-1-1",
    gender: "male",
    listingCategory: "東京証券取引所-プライム",
    originIndustry: "事業会社",
    membershipQualification: "監査役",
    memberCategory: "member",
    communities: ["ベンチャー監査役の会", "ないかんMeetup"],
    contractType: "corporate",
    auditMemberType: "regular",
    auditMemberPremium: false,
    auditJoinedAt: "2023-12-01",
    naikanJoinedAt: "2023-12-15",
    note: "紹介者: 鈴木",
    registeredAt: "2024-01-10",
  },
  {
    id: "C002",
    name: "鈴木 一郎",
    nameKana: "スズキ イチロウ",
    company: "マルコポーロ商事",
    email: "suzuki@example.com",
    phone: "0323456789",
    postalCode: "1000002",
    prefecture: "東京都",
    city: "千代田区皇居外苑1-1",
    originIndustry: "事業会社",
    membershipQualification: "内部監査人",
    memberCategory: "member",
    communities: ["ないかんMeetup"],
    contractType: "corporate",
    naikanJoinedAt: "2024-01-20",
    naikanAffiliation: "内部監査部門",
    registeredAt: "2024-02-15",
  },
  {
    id: "C003",
    name: "佐藤 花子",
    nameKana: "サトウ ハナコ",
    company: "グローバルテック株式会社",
    email: "sato@example.com",
    phone: "0334567890",
    postalCode: "1500001",
    prefecture: "東京都",
    city: "渋谷区神宮前1-1-1",
    originIndustry: "IT・テクノロジー",
    communities: [],
    registeredAt: "2024-03-05",
  },
  {
    id: "C004",
    name: "田中 次郎",
    nameKana: "タナカ ジロウ",
    company: "田中製作所",
    email: "tanaka@example.com",
    phone: "0345678901",
    postalCode: "2200001",
    prefecture: "神奈川県",
    city: "横浜市西区みなとみらい1-1-1",
    originIndustry: "製造業",
    membershipQualification: "監査役",
    memberCategory: "member",
    communities: ["ベンチャー監査役の会"],
    contractType: "corporate",
    auditMemberType: "regular",
    auditJoinedAt: "2023-10-01",
    auditResignedAt: "2024-06-30",
    registeredAt: "2023-11-20",
  },
  {
    id: "C005",
    name: "伊藤 美咲",
    nameKana: "イトウ ミサキ",
    company: "フリーランス",
    email: "ito@example.com",
    postalCode: "4600001",
    prefecture: "愛知県",
    city: "名古屋市中区錦1-1-1",
    originIndustry: "コンサルティング",
    communities: [],
    registeredAt: "2024-04-01",
  },
  {
    id: "C006",
    name: "高橋 健太",
    nameKana: "タカハシ ケンタ",
    company: "株式会社サンライズ",
    email: "takahashi@example.com",
    phone: "0356789012",
    postalCode: "5300001",
    prefecture: "大阪府",
    city: "大阪市北区梅田1-1-1",
    originIndustry: "事業会社",
    membershipQualification: "監査役",
    memberCategory: "member",
    communities: ["ベンチャー監査役の会", "ないかんMeetup"],
    contractType: "corporate",
    auditMemberType: "regular",
    auditJoinedAt: "2024-04-01",
    naikanJoinedAt: "2024-04-15",
    naikanAffiliation: "管理部門長",
    note: "新規入会（両方の会員）",
    registeredAt: "2024-05-12",
  },
  {
    id: "C007",
    name: "渡辺 麻衣",
    nameKana: "ワタナベ マイ",
    company: "テクノロジーソリューションズ株式会社",
    email: "watanabe@example.com",
    phone: "0367890123",
    postalCode: "1000003",
    prefecture: "東京都",
    city: "千代田区丸の内1-1-1",
    originIndustry: "IT・テクノロジー",
    membershipQualification: "内部監査人",
    memberCategory: "member",
    communities: ["ないかんMeetup"],
    contractType: "individual",
    naikanJoinedAt: "2024-05-20",
    naikanAffiliation: "経理部門",
    registeredAt: "2024-06-03",
  },
  {
    id: "C008",
    name: "中村 雄一",
    nameKana: "ナカムラ ユウイチ",
    company: "株式会社ファイナンスパートナーズ",
    email: "nakamura@example.com",
    phone: "0378901234",
    postalCode: "1000004",
    prefecture: "東京都",
    city: "千代田区大手町1-1-1",
    originIndustry: "金融機関",
    membershipQualification: "監査役",
    memberCategory: "member",
    communities: ["ベンチャー監査役の会"],
    contractType: "corporate",
    auditMemberType: "online",
    auditJoinedAt: "2024-06-15",
    note: "紹介者: 山田",
    registeredAt: "2024-07-18",
  },
  {
    id: "C009",
    name: "小林 さくら",
    nameKana: "コバヤシ サクラ",
    company: "デジタルイノベーション株式会社",
    email: "kobayashi@example.com",
    phone: "0389012345",
    postalCode: "1000005",
    prefecture: "東京都",
    city: "千代田区神田神保町1-1-1",
    originIndustry: "IT・テクノロジー",
    membershipQualification: "内部監査人",
    memberCategory: "member",
    communities: ["ないかんMeetup"],
    contractType: "individual",
    naikanJoinedAt: "2024-08-01",
    naikanAffiliation: "法務部門",
    registeredAt: "2024-08-22",
  },
  {
    id: "C010",
    name: "加藤 大輔",
    nameKana: "カトウ ダイスケ",
    company: "株式会社ストラテジックアドバイザーズ",
    email: "kato@example.com",
    phone: "0390123456",
    postalCode: "1000006",
    prefecture: "東京都",
    city: "千代田区丸の内2-2-2",
    originIndustry: "IT・テクノロジー",
    membershipQualification: "内部監査人",
    memberCategory: "member",
    communities: ["AI部会"],
    contractType: "corporate",
    aiJoinedAt: "2024-09-01",
    aiAffiliation: "情報システム部門",
    registeredAt: "2024-09-15",
  },
  {
    id: "C011",
    name: "吉田 由美",
    nameKana: "ヨシダ ユミ",
    company: "フリーランス",
    email: "yoshida@example.com",
    postalCode: "6500001",
    prefecture: "兵庫県",
    city: "神戸市中央区三宮町1-1-1",
    originIndustry: "コンサルティング",
    communities: [],
    note: "イベント参加希望",
    registeredAt: "2024-10-05",
  },
  {
    id: "C012",
    name: "松本 健一",
    nameKana: "マツモト ケンイチ",
    company: "株式会社コーポレートガバナンス",
    email: "matsumoto@example.com",
    phone: "0311112222",
    postalCode: "1000007",
    prefecture: "東京都",
    city: "千代田区霞が関1-1-1",
    originIndustry: "事業会社",
    membershipQualification: "監査役",
    memberCategory: "member",
    communities: ["ベンチャー監査役の会", "ないかんMeetup"],
    contractType: "corporate",
    auditMemberType: "regular",
    auditJoinedAt: "2024-10-01",
    naikanJoinedAt: "2024-10-10",
    naikanAffiliation: "CFO",
    note: "両方の会員",
    registeredAt: "2024-11-01",
  },
];

export const events: Event[] = [
  {
    id: "E001",
    title: "第10回 監査役交流会",
    date: "2028-06-15T18:00:00+09:00",
    location: "東京都港区六本木 1-1-1 会議室A",
    description: "定例の監査役交流会です。今回のテーマは「ガバナンス改革」について。\n\n企業のガバナンス改革において、監査役が果たすべき役割について、実務経験豊富な監査役の方々と意見交換を行います。近年のコーポレートガバナンス・コードの改訂や、ESG経営の重要性が高まる中、監査役としてどのような視点で経営を監視すべきか、具体的な事例を交えながら議論します。",
    eventType: "ベンチャー監査役の会",
    timetable: "18:00-18:30  受付・名刺交換\n18:30-19:00  開会挨拶・テーマ説明\n19:00-20:30  パネルディスカッション「ガバナンス改革と監査役の役割」\n20:30-21:00  質疑応答・意見交換\n21:00-       懇親会",
    note: "会場は最寄り駅から徒歩5分です。\n駐車場はございませんので、公共交通機関をご利用ください。\n懇親会は別会場で開催いたします。\nオンライン参加の方にはZoomのURLを別途お送りいたします。",
    attendeesCount: 24,
    responseDeadline: "2028-06-10T23:59:00+09:00",
    allowsOnline: true,
    hasAfterParty: true,
  },
  {
    id: "E002",
    title: "ないかんMeetup 7月度",
    date: "2028-07-20T19:00:00+09:00",
    location: "オンライン (Zoom)",
    description: "若手内部監査人向けのミートアップイベント。\n\n内部監査の実務に携わる若手の方々が集まり、日々の業務で感じている課題や疑問を共有し、先輩監査人や他社の実務経験者からアドバイスを得られる場です。カジュアルな雰囲気で、気軽に質問や相談ができる環境を提供します。",
    eventType: "ないかんMeetup",
    timetable: "19:00-19:15  開会・自己紹介\n19:15-20:00  テーマトーク「内部監査の実務でよくある課題」\n20:00-20:45  グループディスカッション\n20:45-21:00  まとめ・閉会",
    note: "ZoomのURLは参加確定後、開催前日にメールでお送りいたします。\nカメラは任意ですが、可能な限りONにしていただけると交流が深まります。\n途中参加・途中退出も可能です。",
    attendeesCount: 0,
    responseDeadline: "2028-07-15T23:59:00+09:00",
  },
  {
    id: "E003",
    title: "【特別セミナー】DX時代の監査",
    date: "2024-05-10T15:00:00+09:00",
    location: "東京都千代田区大手町",
    description: "外部講師を招いての特別セミナー。\n\nデジタルトランスフォーメーション（DX）が進む中、監査業務も大きく変化しています。本セミナーでは、DX時代における監査のあり方について、監査法人の実務経験豊富な講師をお招きし、最新の動向と実践的なアプローチについてお話しいただきます。\n\nAIやデータ分析を活用した監査手法、リモート監査の実践、サイバーセキュリティ監査など、現代の監査業務に必要な知識とスキルを学ぶことができます。",
    eventType: "その他",
    timetable: "14:30-15:00  受付\n15:00-15:10  開会挨拶\n15:10-16:40  講演「DX時代の監査手法と実践」\n16:40-17:00  休憩\n17:00-17:50  質疑応答・ディスカッション\n17:50-18:00  閉会挨拶",
    note: "会場の詳細な住所は参加確定後にお知らせいたします。\nセミナー資料は事前にPDFでお送りいたします。\nオンライン参加も可能です（Zoom）。\nCPE（継続専門教育）単位の申請を予定しています。",
    attendeesCount: 45,
    responseDeadline: "2028-05-05T23:59:00+09:00",
  },
  {
    id: "E004",
    title: "第9回 監査役交流会",
    date: "2024-03-20T18:00:00+09:00",
    location: "東京都港区六本木 1-1-1 会議室A",
    description: "定例の監査役交流会です。今回のテーマは「リスク管理の実践」について。\n\n企業経営においてリスク管理は重要なテーマです。監査役として、経営陣が適切にリスクを識別・評価・対応しているかを監視する立場から、実践的なリスク管理のあり方について議論します。特に、新興リスク（サイバーセキュリティ、気候変動リスクなど）への対応についても取り上げます。",
    eventType: "ベンチャー監査役の会",
    timetable: "18:00-18:30  受付・名刺交換\n18:30-19:00  開会挨拶・テーマ説明\n19:00-20:30  パネルディスカッション「リスク管理の実践」\n20:30-21:00  質疑応答・意見交換\n21:00-       懇親会",
    note: "会場は最寄り駅から徒歩5分です。\n駐車場はございませんので、公共交通機関をご利用ください。\n懇親会は別会場で開催いたします。",
    attendeesCount: 28,
    responseDeadline: "2024-03-15T23:59:00+09:00",
  },
  {
    id: "E005",
    title: "ないかんMeetup 3月度",
    date: "2024-02-15T19:00:00+09:00",
    location: "オンライン (Zoom)",
    description: "若手内部監査人向けのミートアップイベント。\n\n内部監査の実務に携わる若手の方々が集まり、日々の業務で感じている課題や疑問を共有し、先輩監査人や他社の実務経験者からアドバイスを得られる場です。カジュアルな雰囲気で、気軽に質問や相談ができる環境を提供します。",
    eventType: "ないかんMeetup",
    timetable: "19:00-19:15  開会・自己紹介\n19:15-20:00  テーマトーク「内部監査の実務でよくある課題」\n20:00-20:45  グループディスカッション\n20:45-21:00  まとめ・閉会",
    note: "ZoomのURLは参加確定後、開催前日にメールでお送りいたします。\nカメラは任意ですが、可能な限りONにしていただけると交流が深まります。\n途中参加・途中退出も可能です。",
    attendeesCount: 15,
    responseDeadline: "2024-02-10T23:59:00+09:00",
  },
  {
    id: "E006",
    title: "【新年会】監査役・内部監査人交流会",
    date: "2024-01-25T18:30:00+09:00",
    location: "東京都中央区銀座 レストラン",
    description: "新年を祝う交流会。親睦を深めながら情報交換を行います。\n\nベンチャー監査役の会とないかんMeetupの合同新年会です。監査役や内部監査人として活動されている皆様が一堂に会し、新年の抱負を語り合いながら、親睦を深める場です。異なる立場の方々との交流を通じて、新たな視点や気づきを得られる機会となることを期待しています。",
    eventType: "ベンチャー監査役の会",
    timetable: "18:30-19:00  受付・ドリンク\n19:00-19:15  開会挨拶・乾杯\n19:15-20:30  食事・歓談\n20:30-21:00  新年の抱負を語る会\n21:00-       二次会（希望者のみ）",
    note: "会場の詳細な住所は参加確定後にお知らせいたします。\n会費は当日現金でお支払いください（5,000円程度を予定）。\nアレルギーや食事制限がある方は事前にお知らせください。\n二次会は別会場で開催いたします（参加費別途）。",
    attendeesCount: 35,
    responseDeadline: "2024-01-20T23:59:00+09:00",
    allowsOnline: false,
    hasAfterParty: true,
  },
  {
    id: "E007",
    title: "第11回 監査役交流会",
    date: "2028-08-25T18:00:00+09:00",
    location: "東京都港区六本木 1-1-1 会議室A",
    description: "定例の監査役交流会です。今回のテーマは「ESG経営と監査の役割」について。\n\nESG（環境・社会・ガバナンス）経営が企業価値向上の鍵となる中、監査役としてESG経営をどのように監視すべきかが重要な課題となっています。本交流会では、ESG経営の実践事例や、ESG情報の開示・監査のあり方について、実務経験豊富な監査役の方々と議論します。",
    eventType: "ベンチャー監査役の会",
    timetable: "18:00-18:30  受付・名刺交換\n18:30-19:00  開会挨拶・テーマ説明\n19:00-20:30  パネルディスカッション「ESG経営と監査の役割」\n20:30-21:00  質疑応答・意見交換\n21:00-       懇親会",
    note: "会場は最寄り駅から徒歩5分です。\n駐車場はございませんので、公共交通機関をご利用ください。\n懇親会は別会場で開催いたします。\n※本イベントは現在一時停止中です。",
    attendeesCount: 18,
    responseDeadline: "2028-08-20T23:59:00+09:00",
    isPaused: true,
  },
  {
    id: "E008",
    title: "ないかんMeetup 8月度",
    date: "2028-09-15T19:00:00+09:00",
    location: "オンライン (Zoom)",
    description: "若手内部監査人向けのミートアップイベント。今回は「リモート監査の実践」をテーマにします。\n\nコロナ禍以降、リモート監査が一般的になりましたが、リモート監査を効果的に実施するためのノウハウや課題について、実務経験を共有します。リモート監査の計画立案、証憑の確認方法、コミュニケーションの取り方など、実践的な内容を扱います。",
    eventType: "ないかんMeetup",
    timetable: "19:00-19:15  開会・自己紹介\n19:15-20:00  テーマトーク「リモート監査の実践と課題」\n20:00-20:45  グループディスカッション\n20:45-21:00  まとめ・閉会",
    note: "ZoomのURLは参加確定後、開催前日にメールでお送りいたします。\nカメラは任意ですが、可能な限りONにしていただけると交流が深まります。\n途中参加・途中退出も可能です。\nリモート監査の実践事例をお持ちの方は、ぜひシェアしてください。",
    attendeesCount: 0,
    responseDeadline: "2028-09-10T23:59:00+09:00",
  },
  {
    id: "E010",
    title: "AI部会 第1回 勉強会",
    date: "2028-10-20T19:00:00+09:00",
    location: "オンライン (Zoom)",
    description: "AI部会の第1回勉強会です。\n\nAI技術を活用した業務改善や効率化について、実務経験を共有します。",
    eventType: "AI部会",
    timetable: "19:00-19:15  開会・自己紹介\n19:15-20:00  テーマトーク「AI活用の実践事例」\n20:00-20:45  グループディスカッション\n20:45-21:00  まとめ・閉会",
    note: "ZoomのURLは参加確定後、開催前日にメールでお送りいたします。",
    attendeesCount: 0,
    responseDeadline: "2028-10-15T23:59:00+09:00",
  },
  {
    id: "E009",
    title: "【秋のセミナー】社外監査役の最新動向",
    date: "2028-10-12T14:00:00+09:00",
    location: "東京都千代田区丸の内 セミナールーム",
    description: "社外監査役の最新動向について、専門家を招いてセミナーを開催します。\n\n社外監査役の実務は日々進化しています。本セミナーでは、監査法人の監査部門で長年実務に携わってこられた専門家をお招きし、社外監査役の最新動向についてお話しいただきます。\n\n特に、リスクベース監査の実践、データ分析を活用した監査手法、監査報告書の作成方法など、実務に直結する内容を扱います。",
    eventType: "ベンチャー監査役の会",
    timetable: "13:30-14:00  受付\n14:00-14:10  開会挨拶\n14:10-15:40  講演「社外監査役の最新動向と実践」\n15:40-16:00  休憩\n16:00-16:50  質疑応答・ディスカッション\n16:50-17:00  閉会挨拶",
    note: "会場の詳細な住所は参加確定後にお知らせいたします。\nセミナー資料は事前にPDFでお送りいたします。\nオンライン参加も可能です（Zoom）。\nCPE（継続専門教育）単位の申請を予定しています。",
    attendeesCount: 32,
    responseDeadline: "2028-10-05T23:59:00+09:00",
    allowsOnline: true,
    hasAfterParty: false,
  },
  {
    id: "E010",
    title: "第12回 監査役交流会",
    date: "2026-11-14T22:00:00+09:00",
    location: "東京都港区六本木 1-1-1 会議室A",
    description: "定例の監査役交流会です。今回のテーマは「コーポレートガバナンスの実践」について。\n\nコーポレートガバナンスは企業の健全な経営を支える重要な仕組みです。監査役として、経営陣や取締役会が適切にガバナンスを実践しているかを監視する立場から、実践的なコーポレートガバナンスのあり方について議論します。\n\n特に、取締役会の実効性向上、経営陣との適切な距離感、ステークホルダーとの対話など、監査役の実務に直結するテーマを取り上げます。",
    eventType: "ベンチャー監査役の会",
    timetable: "22:00-22:30  受付・名刺交換\n22:30-23:00  開会挨拶・テーマ説明\n23:00-24:30  パネルディスカッション「コーポレートガバナンスの実践」\n24:30-25:00  質疑応答・意見交換\n25:00-       懇親会",
    note: "会場は最寄り駅から徒歩5分です。\n駐車場はございませんので、公共交通機関をご利用ください。\n懇親会は別会場で開催いたします。\nオンライン参加の方にはZoomのURLを別途お送りいたします。",
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
    attendanceType: "通常参加",
    afterPartyStatus: "参加",
    comment: "よろしくお願いします。",
  },
  {
    eventId: "E001",
    customerId: "C004",
    token: "token-tanaka-e001",
    status: "未回答",
  },
  {
    eventId: "E002",
    customerId: "C002",
    token: "token-suzuki-e002",
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
    customerId: "C009",
    token: "token-kobayashi-e002",
    status: "未回答",
  },
  {
    eventId: "E002",
    customerId: "C012",
    token: "token-matsumoto-e002",
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
    customerId: "C004",
    token: "token-tanaka-e004",
    status: "参加",
    respondedAt: "2024-03-16 09:00",
  },
  {
    eventId: "E004",
    customerId: "C006",
    token: "token-takahashi-e004",
    status: "参加",
    respondedAt: "2024-03-15 14:00",
  },
  {
    eventId: "E004",
    customerId: "C008",
    token: "token-nakamura-e004",
    status: "不参加",
    respondedAt: "2024-03-16 11:00",
  },
  {
    eventId: "E004",
    customerId: "C010",
    token: "token-kato-e004",
    status: "未回答",
  },
  // 過去のイベント E005: ないかんMeetup 3月度 (2024-02-15)
  {
    eventId: "E005",
    customerId: "C002",
    token: "token-suzuki-e005",
    status: "参加",
    respondedAt: "2024-02-10 10:00",
  },
  {
    eventId: "E005",
    customerId: "C006",
    token: "token-takahashi-e005",
    status: "参加",
    respondedAt: "2024-02-10 11:00",
  },
  {
    eventId: "E005",
    customerId: "C007",
    token: "token-watanabe-e005",
    status: "参加",
    respondedAt: "2024-02-10 12:00",
  },
  {
    eventId: "E005",
    customerId: "C009",
    token: "token-kobayashi-e005",
    status: "不参加",
    respondedAt: "2024-02-11 09:00",
  },
  {
    eventId: "E005",
    customerId: "C012",
    token: "token-matsumoto-e005",
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
    customerId: "C004",
    token: "token-tanaka-e006",
    status: "参加",
    respondedAt: "2024-01-21 09:00",
  },
  {
    eventId: "E006",
    customerId: "C006",
    token: "token-takahashi-e006",
    status: "参加",
    respondedAt: "2024-01-20 11:00",
  },
  {
    eventId: "E006",
    customerId: "C008",
    token: "token-nakamura-e006",
    status: "参加",
    respondedAt: "2024-01-21 10:00",
  },
  {
    eventId: "E006",
    customerId: "C010",
    token: "token-kato-e006",
    status: "不参加",
    respondedAt: "2024-01-21 14:00",
  },
  {
    eventId: "E006",
    customerId: "C012",
    token: "token-matsumoto-e006",
    status: "参加",
    respondedAt: "2024-01-20 15:00",
  },
  // 新規追加顧客のRSVPデータ
  {
    eventId: "E001",
    customerId: "C006",
    token: "token-takahashi-e001",
    status: "オンライン参加",
    respondedAt: "2024-05-21 09:00",
    attendanceType: "オンライン参加",
    comment: "オンラインで参加します。ZoomのURLをお送りください。",
  },
  {
    eventId: "E001",
    customerId: "C008",
    token: "token-nakamura-e001",
    status: "参加",
    respondedAt: "2024-05-21 14:00",
    attendanceType: "通常参加",
    afterPartyStatus: "不参加",
    comment: "懇親会は都合により参加できません。",
  },
  {
    eventId: "E001",
    customerId: "C010",
    token: "token-kato-e001",
    status: "参加",
    respondedAt: "2024-05-22 11:00",
    comment: "少し遅れて参加する可能性があります。",
  },
  // E003: 【特別セミナー】DX時代の監査
  {
    eventId: "E003",
    customerId: "C001",
    token: "token-yamada-e003",
    status: "参加",
    respondedAt: "2024-05-01 10:00",
    attendanceType: "通常参加",
  },
  {
    eventId: "E003",
    customerId: "C002",
    token: "token-suzuki-e003",
    status: "参加",
    respondedAt: "2024-05-01 11:00",
    attendanceType: "通常参加",
  },
  {
    eventId: "E003",
    customerId: "C003",
    token: "token-sato-e003",
    status: "参加",
    respondedAt: "2024-05-01 12:00",
    attendanceType: "通常参加",
  },
  {
    eventId: "E003",
    customerId: "C006",
    token: "token-takahashi-e003",
    status: "参加",
    respondedAt: "2024-05-02 09:00",
    attendanceType: "通常参加",
  },
  {
    eventId: "E003",
    customerId: "C008",
    token: "token-nakamura-e003",
    status: "参加",
    respondedAt: "2024-05-02 14:00",
    attendanceType: "通常参加",
  },
  {
    eventId: "E003",
    customerId: "C004",
    token: "token-tanaka-e003",
    status: "不参加",
    respondedAt: "2024-05-01 15:00",
  },
  {
    eventId: "E003",
    customerId: "C005",
    token: "token-ito-e003",
    status: "未回答",
  },
  {
    eventId: "E003",
    customerId: "C007",
    token: "token-watanabe-e003",
    status: "未回答",
  },
  {
    eventId: "E003",
    customerId: "C009",
    token: "token-kobayashi-e003",
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
export function getCommunityDisplayName(communities: Community[]): string {
  if (communities.length === 0) return "非会員";

  // ソートして表示順を固定（ベンチャー監査役の会が先）
  const sorted = [...communities].sort();

  if (sorted.length === 2) return "ベンチャー監査役の会・ないかんMeetup";
  return sorted[0];
}

// ヘルパー関数: 会員かどうかを判定
export function isMember(communities: Community[]): boolean {
  return communities.length > 0;
}

// ヘルパー関数: 特定の会員区分を持っているか判定
export function hasCommunity(communities: Community[], type: Community): boolean {
  return communities.includes(type);
}

// アンケートデータ（モック）
export const surveys: Survey[] = [
  {
    id: "SUR006",
    eventId: "E006",
    questions: [
      { id: "q1", title: "第1部　ベンチャー企業における常勤監査役の役割", order: 1 },
      { id: "q2", title: "第2部　監査役座談会", order: 2 },
    ],
    createdAt: "2024-01-26T10:00:00+09:00",
  },
];

// アンケート送信トークン（モック）
export const surveyTokens: SurveyToken[] = [
  {
    surveyId: "SUR006",
    customerId: "C001",
    token: "survey-c001-sur006-token1",
    sentAt: "2024-01-26T10:00:00+09:00",
  },
  {
    surveyId: "SUR006",
    customerId: "C002",
    token: "survey-c002-sur006-token2",
    sentAt: "2024-01-26T10:00:00+09:00",
  },
  {
    surveyId: "SUR006",
    customerId: "C004",
    token: "survey-c004-sur006-token3",
    sentAt: "2024-01-26T10:00:00+09:00",
  },
  {
    surveyId: "SUR006",
    customerId: "C003",
    token: "survey-c003-sur006-token4",
    sentAt: "2024-01-26T10:00:00+09:00",
  },
];

// アンケート回答データ（モック）
export const surveyResponses: SurveyResponse[] = [
  // C001の回答
  {
    surveyId: "SUR006",
    questionId: "q1",
    customerId: "C001",
    token: "survey-c001-sur006-token1",
    rating: "よかった",
    reason: "セッションの内容が非常に参考になりました。",
    respondedAt: "2024-01-26T14:00:00+09:00",
  },
  {
    surveyId: "SUR006",
    questionId: "q2",
    customerId: "C001",
    token: "survey-c001-sur006-token1",
    rating: "まぁよかった",
    reason: "雰囲気は良かったですが、もう少し時間があれば良かったです。",
    respondedAt: "2024-01-26T14:00:00+09:00",
  },
  // C002の回答
  {
    surveyId: "SUR006",
    questionId: "q1",
    customerId: "C002",
    token: "survey-c002-sur006-token2",
    rating: "まぁよかった",
    reason: "内容は良かったですが、もう少し具体的な事例があると良かったです。",
    respondedAt: "2024-01-26T15:30:00+09:00",
  },
  {
    surveyId: "SUR006",
    questionId: "q2",
    customerId: "C002",
    token: "survey-c002-sur006-token2",
    rating: "よかった",
    reason: "参加者同士の交流が活発で、良いネットワーキングの機会になりました。",
    respondedAt: "2024-01-26T15:30:00+09:00",
  },
  // C004の回答
  {
    surveyId: "SUR006",
    questionId: "q1",
    customerId: "C004",
    token: "survey-c004-sur006-token3",
    rating: "よかった",
    reason: "非常に有意義な内容でした。",
    respondedAt: "2024-01-27T09:00:00+09:00",
  },
  {
    surveyId: "SUR006",
    questionId: "q2",
    customerId: "C004",
    token: "survey-c004-sur006-token3",
    rating: "よかった",
    reason: "参加者の皆さんと良い交流ができました。",
    respondedAt: "2024-01-27T09:00:00+09:00",
  },
  // C003の回答（非会員）
  {
    surveyId: "SUR006",
    questionId: "q1",
    customerId: "C003",
    token: "survey-c003-sur006-token4",
    rating: "まぁよかった",
    reason: "内容は興味深かったですが、もう少し詳しく知りたかったです。",
    respondedAt: "2024-01-27T11:00:00+09:00",
  },
  {
    surveyId: "SUR006",
    questionId: "q2",
    customerId: "C003",
    token: "survey-c003-sur006-token4",
    rating: "よかった",
    reason: "初めて参加しましたが、とても良い雰囲気でした。",
    respondedAt: "2024-01-27T11:00:00+09:00",
  },
];

// 固定設問の回答データ（モック）
export const fixedSurveyResponses: FixedSurveyResponse[] = [
  // C001の固定設問回答（会員）
  {
    surveyId: "SUR006",
    customerId: "C001",
    token: "survey-c001-sur006-token1",
    afterParty: {
      rating: "よかった",
      reason: "懇親会も楽しかったです。",
    },
    comments: "とても良いイベントでした。",
    respondedAt: "2024-01-26T14:00:00+09:00",
  },
  // C002の固定設問回答（会員）
  {
    surveyId: "SUR006",
    customerId: "C002",
    token: "survey-c002-sur006-token2",
    afterParty: {
      rating: "まぁよかった",
      reason: "もう少し時間があれば良かったです。",
    },
    comments: "次回も楽しみにしています。",
    respondedAt: "2024-01-26T15:30:00+09:00",
  },
  // C004の固定設問回答（会員）
  {
    surveyId: "SUR006",
    customerId: "C004",
    token: "survey-c004-sur006-token3",
    afterParty: {
      rating: "よかった",
      reason: "良い交流ができました。",
    },
    comments: "有意義な時間でした。",
    respondedAt: "2024-01-27T09:00:00+09:00",
  },
  // C003の固定設問回答（非会員）
  {
    surveyId: "SUR006",
    customerId: "C003",
    token: "survey-c003-sur006-token4",
    afterParty: {
      rating: "まぁよかった",
      reason: "初めての参加でしたが、楽しかったです。",
    },
    futureParticipation: {
      rating: "参加を検討したい",
      reason: "機会があればまた参加したいと思います。",
    },
    membership: {
      rating: "入会を検討したい",
      reason: "入会について検討してみたいと思います。",
    },
    comments: "初めての参加でしたが、とても良い経験になりました。",
    respondedAt: "2024-01-27T11:00:00+09:00",
  },
];

// ヘルパー関数: イベントIDからアンケートを取得
export function getSurveyByEventId(eventId: string): Survey | null {
  return surveys.find((s) => s.eventId === eventId) || null;
}

// ヘルパー関数: トークンからアンケートを取得
export function getSurveyByToken(token: string): { survey: Survey; customerId: string } | null {
  const surveyToken = surveyTokens.find((st) => st.token === token);
  if (!surveyToken) return null;
  const survey = surveys.find((s) => s.id === surveyToken.surveyId);
  if (!survey) return null;
  return { survey, customerId: surveyToken.customerId };
}

// ヘルパー関数: アンケートの回答を取得
export function getSurveyResponses(surveyId: string): SurveyResponse[] {
  return surveyResponses.filter((sr) => sr.surveyId === surveyId);
}

// ヘルパー関数: 固定設問の回答を取得
export function getFixedSurveyResponses(surveyId: string): FixedSurveyResponse[] {
  return fixedSurveyResponses.filter((fsr) => fsr.surveyId === surveyId);
}

// ヘルパー関数: 顧客が既に回答済みかチェック
export function hasResponded(surveyId: string, customerId: string): boolean {
  return surveyResponses.some(
    (sr) => sr.surveyId === surveyId && sr.customerId === customerId
  );
}

// ===================================
// 管理者データ
// ===================================

export const admins: Admin[] = [
  {
    id: "A001",
    firstName: "太郎",
    lastName: "管理",
    email: "admin@example.com",
    password: "password123",
    role: "super",
    lastLoginAt: "2026-01-15T10:00:00+09:00",
    createdAt: "2024-01-01T00:00:00+09:00",
    updatedAt: "2024-01-01T00:00:00+09:00",
  },
  {
    id: "A002",
    firstName: "花子",
    lastName: "監査",
    email: "venture@example.com",
    password: "password123",
    role: "community_admin",
    communityScopes: ["ベンチャー監査役の会"],
    lastLoginAt: "2026-01-14T15:30:00+09:00",
    createdAt: "2024-02-01T00:00:00+09:00",
    updatedAt: "2024-02-01T00:00:00+09:00",
  },
  {
    id: "A003",
    firstName: "次郎",
    lastName: "内監",
    email: "naikan@example.com",
    password: "password123",
    role: "community_admin",
    communityScopes: ["ないかんMeetup"],
    createdAt: "2024-03-01T00:00:00+09:00",
    updatedAt: "2024-03-01T00:00:00+09:00",
  },
  {
    id: "A004",
    firstName: "三郎",
    lastName: "両方",
    email: "both@example.com",
    password: "password123",
    role: "community_admin",
    communityScopes: ["ベンチャー監査役の会", "ないかんMeetup"],
    createdAt: "2024-04-01T00:00:00+09:00",
    updatedAt: "2024-04-01T00:00:00+09:00",
  },
  {
    id: "A005",
    firstName: "四郎",
    lastName: "AI",
    email: "ai@example.com",
    password: "password123",
    role: "community_admin",
    communityScopes: ["AI部会"],
    createdAt: "2024-05-01T00:00:00+09:00",
    updatedAt: "2024-05-01T00:00:00+09:00",
  },
];
