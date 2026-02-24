import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Constants (copied/adapted from lib/constants/customer.ts to avoid build dependency issues in seed)
const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県", "その他",
];

const ORIGIN_INDUSTRIES = [
  "事業会社", "公認会計士", "銀行", "内部", "証券会社", "弁護士",
  "社労士", "損保", "VC", "生保", "司法書士", "大学教員", "その他",
];

const MEMBERSHIP_QUALIFICATIONS = [
  "監査役", "元監査役", "監査等委員", "監査役候補", "元監事", "監査委員",
  "事業会社（内部監査部門）", "事業会社（内部監査部門以外）", "その他",
];

// 上場区分マスター（市場名 + 証券取引所名）
const LISTING_CATEGORIES: { marketName: string; stockExchangeName: string }[] = [
  { marketName: "プライム", stockExchangeName: "東京証券取引所" },
  { marketName: "スタンダード", stockExchangeName: "東京証券取引所" },
  { marketName: "グロース", stockExchangeName: "東京証券取引所" },
  { marketName: "TOKYO PRO Market", stockExchangeName: "東京証券取引所" },
  { marketName: "プレミア", stockExchangeName: "名古屋証券取引所" },
  { marketName: "メイン", stockExchangeName: "名古屋証券取引所" },
  { marketName: "ネクスト", stockExchangeName: "名古屋証券取引所" },
  { marketName: "本則市場", stockExchangeName: "福岡証券取引所" },
  { marketName: "Q-Board", stockExchangeName: "福岡証券取引所" },
  { marketName: "Fukuoka PRO Market", stockExchangeName: "福岡証券取引所" },
  { marketName: "本則市場", stockExchangeName: "札幌証券取引所" },
  { marketName: "アンビシャス", stockExchangeName: "札幌証券取引所" },
  { marketName: "未上場", stockExchangeName: "" },
];

const AFFILIATIONS = [
  "内部監査部門", "常勤監査役・常勤監査等委員", "代表者（社長・CEO）",
  "CFO", "管理部門長", "経理部門", "法務部門", "総務部門",
  "情報システム部門", "経営企画部門", "社長室", "人事部門",
  "IR部門", "その他",
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { disposeExternalPool: true });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding master tables...");

  // 1. Prefecture
  const prefectureMap = new Map<string, number>();
  for (let i = 0; i < PREFECTURES.length; i++) {
    const name = PREFECTURES[i];
    const rec = await prisma.prefecture.upsert({
      where: { name },
      update: { sortOrder: i + 1 },
      create: { name, sortOrder: i + 1 },
    });
    prefectureMap.set(name, rec.id);
  }

  // 2. OriginIndustry
  const originIndustryMap = new Map<string, number>();
  for (let i = 0; i < ORIGIN_INDUSTRIES.length; i++) {
    const name = ORIGIN_INDUSTRIES[i];
    const rec = await prisma.originIndustry.upsert({
      where: { name },
      update: { sortOrder: i + 1 },
      create: { name, sortOrder: i + 1 },
    });
    originIndustryMap.set(name, rec.id);
  }

  // 3. MembershipQualification
  const membershipQualificationMap = new Map<string, number>();
  for (let i = 0; i < MEMBERSHIP_QUALIFICATIONS.length; i++) {
    const name = MEMBERSHIP_QUALIFICATIONS[i];
    const rec = await prisma.membershipQualification.upsert({
      where: { name },
      update: { sortOrder: i + 1 },
      create: { name, sortOrder: i + 1 },
    });
    membershipQualificationMap.set(name, rec.id);
  }

  // 4. ListingCategory
  const listingCategoryMap = new Map<string, number>();
  for (let i = 0; i < LISTING_CATEGORIES.length; i++) {
    const { marketName, stockExchangeName } = LISTING_CATEGORIES[i];
    const rec = await prisma.listingCategory.upsert({
      where: { marketName_stockExchangeName: { marketName, stockExchangeName } },
      update: { sortOrder: i + 1 },
      create: { marketName, stockExchangeName, sortOrder: i + 1 },
    });
    listingCategoryMap.set(`${marketName}:${stockExchangeName}`, rec.id);
  }

  // 5. Affiliation
  const affiliationMap = new Map<string, number>();
  for (let i = 0; i < AFFILIATIONS.length; i++) {
    const name = AFFILIATIONS[i];
    const rec = await prisma.affiliation.upsert({
      where: { name },
      update: { sortOrder: i + 1 },
      create: { name, sortOrder: i + 1 },
    });
    affiliationMap.set(name, rec.id);
  }

  console.log("Master tables seeded.");

  // コミュニティマスターデータの投入
  const communities = [
    { code: "venture_auditor", name: "ベンチャー監査役の会", hasSurvey: true, sortOrder: 1 },
    { code: "naikan_meetup", name: "ないかんMeetup", hasSurvey: false, sortOrder: 2 },
    { code: "ai_club", name: "AI部会", hasSurvey: false, sortOrder: 3 },
    { code: "other", name: "その他", hasSurvey: false, sortOrder: 99 },
  ];

  for (const community of communities) {
    await prisma.community.upsert({
      where: { code: community.code },
      update: {
        name: community.name,
        hasSurvey: community.hasSurvey,
        sortOrder: community.sortOrder,
      },
      create: community,
    });
  }

  // テスト用管理者データの投入
  const passwordHash = await bcrypt.hash("rara6y", 10);

  const admins = [
    { email: "admin@example.com", firstName: "太郎", lastName: "管理", role: "super" as const, communities: [] as string[] },
    { email: "kansa@example.com", firstName: "一郎", lastName: "監査", role: "community_admin" as const, communities: ["venture_auditor"] },
    { email: "naikan@example.com", firstName: "二郎", lastName: "内観", role: "community_admin" as const, communities: ["naikan_meetup"] },
    { email: "ai@example.com", firstName: "三郎", lastName: "知能", role: "community_admin" as const, communities: ["ai_club"] },
    { email: "all@example.com", firstName: "花子", lastName: "全部", role: "community_admin" as const, communities: ["venture_auditor", "naikan_meetup", "ai_club"] },
  ];

  for (const adminData of admins) {
    const admin = await prisma.admin.upsert({
      where: { email: adminData.email },
      update: {
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        passwordHash,
        role: adminData.role,
      },
      create: {
        email: adminData.email,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        passwordHash,
        role: adminData.role,
      },
    });

    for (const communityCode of adminData.communities) {
      const community = await prisma.community.findUnique({ where: { code: communityCode } });
      if (community) {
        await prisma.adminCommunity.upsert({
          where: { adminId_communityId: { adminId: admin.id, communityId: community.id } },
          update: {},
          create: { adminId: admin.id, communityId: community.id },
        });
      }
    }
    console.log(`${adminData.role}を作成: ${admin.email}`);
  }

  // テスト用顧客データの投入
  const ventureAuditor = await prisma.community.findUnique({ where: { code: "venture_auditor" } });
  const naikanMeetup = await prisma.community.findUnique({ where: { code: "naikan_meetup" } });
  const aiClub = await prisma.community.findUnique({ where: { code: "ai_club" } });

  if (ventureAuditor && naikanMeetup && aiClub) {
    const customers = [
      {
        firstName: "太郎", lastName: "田中", firstNameKana: "タロウ", lastNameKana: "タナカ",
        email: "tanaka@example.com", company: "株式会社テスト", phone: "0312345678",
        postalCode: "1000001", city: "千代田区丸の内1-1-1",
        prefecture: "東京都",
        listingCategory: "プライム:東京証券取引所",
        gender: "male" as const,
        memberCategory: "member" as const,
        contractType: "corporate" as const,
        communities: [
          { communityId: ventureAuditor.id, auditMemberType: "regular" as const, auditMemberPremium: true, joinedAt: new Date("2024-04-01"), originIndustry: "事業会社", membershipQualification: "監査役" },
          { communityId: naikanMeetup.id, affiliation: "内部監査部門", joinedAt: new Date("2024-06-01") },
        ],
      },
      {
        firstName: "花子", lastName: "鈴木", firstNameKana: "ハナコ", lastNameKana: "スズキ",
        email: "suzuki@example.com", company: "鈴木監査法人",
        gender: "female" as const, memberCategory: "member" as const, contractType: "individual" as const,
        communities: [
          { communityId: ventureAuditor.id, auditMemberType: "online" as const, auditMemberPremium: false, joinedAt: new Date("2024-05-01") },
        ],
      },
      {
        firstName: "一郎", lastName: "佐藤", firstNameKana: "イチロウ", lastNameKana: "サトウ",
        email: "sato@example.com", company: "佐藤コンサルティング",
        gender: "male" as const, memberCategory: "sponsor" as const, contractType: "corporate" as const,
        communities: [
          { communityId: naikanMeetup.id, affiliation: "経営企画部門", joinedAt: new Date("2024-03-01") },
          { communityId: aiClub.id, affiliation: "情報システム部門", joinedAt: new Date("2024-07-01") },
        ],
      },
      {
        firstName: "一部", lastName: "鈴木", email: "suzuki.partial@example.com", company: "株式会社一部脱退",
        gender: "female" as const, memberCategory: "member" as const, contractType: "corporate" as const,
        communities: [
          { communityId: ventureAuditor.id, auditMemberType: "regular" as const, auditMemberPremium: false, joinedAt: new Date("2023-04-01"), resignedAt: new Date("2024-03-31") },
          { communityId: naikanMeetup.id, affiliation: "内部監査部門", joinedAt: new Date("2023-04-01") },
          { communityId: aiClub.id, affiliation: "AI推進室", joinedAt: new Date("2023-04-01") },
        ],
      },
      {
        firstName: "二部", lastName: "佐藤", email: "sato.partial2@example.com", company: "株式会社二部脱退",
        gender: "male" as const, memberCategory: "member" as const, contractType: "corporate" as const,
        communities: [
          { communityId: ventureAuditor.id, auditMemberType: "regular" as const, auditMemberPremium: false, joinedAt: new Date("2023-04-01"), resignedAt: new Date("2024-03-31") },
          { communityId: naikanMeetup.id, affiliation: "内部監査部門", joinedAt: new Date("2023-04-01"), resignedAt: new Date("2024-03-31") },
          { communityId: aiClub.id, affiliation: "AI推進室", joinedAt: new Date("2023-04-01") },
        ],
      },
      {
        firstName: "全部", lastName: "田中", email: "tanaka.full@example.com", company: "株式会社全部脱退",
        gender: "male" as const, memberCategory: "member" as const, contractType: "corporate" as const,
        communities: [
          { communityId: ventureAuditor.id, auditMemberType: "regular" as const, auditMemberPremium: false, joinedAt: new Date("2023-04-01"), resignedAt: new Date("2024-03-31") },
          { communityId: naikanMeetup.id, affiliation: "内部監査部門", joinedAt: new Date("2023-04-01"), resignedAt: new Date("2024-03-31") },
          { communityId: aiClub.id, affiliation: "AI推進室", joinedAt: new Date("2023-04-01"), resignedAt: new Date("2024-03-31") },
        ],
      },
      {
        firstName: "二郎", lastName: "高橋", email: "takahashi@example.com", company: "高橋株式会社",
        memberCategory: "observer" as const,
        communities: [
          { communityId: aiClub.id, affiliation: "代表者（社長・CEO）", joinedAt: new Date("2024-08-01") },
        ],
      },
      {
        firstName: "三郎", lastName: "渡辺", email: "watanabe@example.com", note: "非会員（イベント参加のみ）",
        communities: [],
      },
    ];

    for (const customerData of customers) {
      const { communities: communityData, ...customerFields } = customerData;
      
      // Resolve IDs from maps
      const prefectureId = customerFields.prefecture ? prefectureMap.get(customerFields.prefecture) : undefined;
      const listingCategoryId = customerFields.listingCategory ? listingCategoryMap.get(customerFields.listingCategory) : undefined;

      // Clean up fields that are now IDs (remove string versions)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- seedスクリプト: 動的キー除外のためany使用
      const { prefecture: _prefecture, listingCategory: _listingCategory, ...baseFields } = customerFields as any;

      const createData = {
        ...baseFields,
        prefectureId,
        listingCategoryId,
      };

      const customer = await prisma.customer.upsert({
        where: { email: customerFields.email },
        update: createData,
        create: createData,
      });

      for (const comm of communityData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- seedスクリプト: 動的キー除外のためany使用
        const commAny = comm as any;
        const affiliationId = commAny.affiliation ? affiliationMap.get(commAny.affiliation) : undefined;
        const commOriginIndustryId = commAny.originIndustry ? originIndustryMap.get(commAny.originIndustry) : undefined;
        const commMembershipQualificationId = commAny.membershipQualification ? membershipQualificationMap.get(commAny.membershipQualification) : undefined;
        // Clean up string lookup fields
        const { affiliation: _affiliation, originIndustry: _originIndustry, membershipQualification: _membershipQualification, ...commBase } = commAny;

        await prisma.customerCommunity.upsert({
          where: {
            customerId_communityId: {
              customerId: customer.id,
              communityId: comm.communityId,
            },
          },
          update: { ...commBase, affiliationId, originIndustryId: commOriginIndustryId, membershipQualificationId: commMembershipQualificationId },
          create: {
            customerId: customer.id,
            ...commBase,
            affiliationId,
            originIndustryId: commOriginIndustryId,
            membershipQualificationId: commMembershipQualificationId,
          },
        });
      }

      console.log(`顧客を作成: ${customer.lastName} ${customer.firstName} (${customer.email})`);
    }

    // === 100人の顧客を一括生成 ===
    console.log("100人の顧客データを生成中...");

    const lastNames = [
      "山田", "中村", "小林", "加藤", "吉田", "山口", "松本", "井上", "木村", "林",
      "清水", "山崎", "池田", "橋本", "阿部", "石川", "前田", "藤田", "小川", "岡田",
      "後藤", "長谷川", "石井", "村上", "近藤", "坂本", "遠藤", "青木", "藤井", "西村",
      "福田", "太田", "三浦", "岡本", "松田", "中川", "中野", "原田", "小野", "田村",
      "竹内", "金子", "和田", "中山", "石田", "上田", "森田", "原", "柴田", "酒井",
    ];
    const firstNamesMale = [
      "健太", "大輔", "翔太", "拓也", "直人", "達也", "雄太", "浩二", "哲也", "誠",
      "和也", "隆", "洋平", "秀樹", "剛", "慎一", "正志", "勝", "博", "修",
      "敏夫", "義之", "信一", "幸一", "広志", "裕一", "昌弘", "和彦", "康之", "宏",
    ];
    const firstNamesFemale = [
      "美咲", "さくら", "陽子", "恵美", "裕子", "明美", "久美子", "由美", "智子", "真理子",
      "直子", "幸子", "洋子", "京子", "典子", "和子", "節子", "正美", "千恵", "麻衣",
    ];
    const lastNameKanaMap: Record<string, string> = {
      "山田": "ヤマダ", "中村": "ナカムラ", "小林": "コバヤシ", "加藤": "カトウ", "吉田": "ヨシダ",
      "山口": "ヤマグチ", "松本": "マツモト", "井上": "イノウエ", "木村": "キムラ", "林": "ハヤシ",
      "清水": "シミズ", "山崎": "ヤマザキ", "池田": "イケダ", "橋本": "ハシモト", "阿部": "アベ",
      "石川": "イシカワ", "前田": "マエダ", "藤田": "フジタ", "小川": "オガワ", "岡田": "オカダ",
      "後藤": "ゴトウ", "長谷川": "ハセガワ", "石井": "イシイ", "村上": "ムラカミ", "近藤": "コンドウ",
      "坂本": "サカモト", "遠藤": "エンドウ", "青木": "アオキ", "藤井": "フジイ", "西村": "ニシムラ",
      "福田": "フクダ", "太田": "オオタ", "三浦": "ミウラ", "岡本": "オカモト", "松田": "マツダ",
      "中川": "ナカガワ", "中野": "ナカノ", "原田": "ハラダ", "小野": "オノ", "田村": "タムラ",
      "竹内": "タケウチ", "金子": "カネコ", "和田": "ワダ", "中山": "ナカヤマ", "石田": "イシダ",
      "上田": "ウエダ", "森田": "モリタ", "原": "ハラ", "柴田": "シバタ", "酒井": "サカイ",
    };
    const firstNameKanaMaleMap: Record<string, string> = {
      "健太": "ケンタ", "大輔": "ダイスケ", "翔太": "ショウタ", "拓也": "タクヤ", "直人": "ナオト",
      "達也": "タツヤ", "雄太": "ユウタ", "浩二": "コウジ", "哲也": "テツヤ", "誠": "マコト",
      "和也": "カズヤ", "隆": "タカシ", "洋平": "ヨウヘイ", "秀樹": "ヒデキ", "剛": "ツヨシ",
      "慎一": "シンイチ", "正志": "マサシ", "勝": "マサル", "博": "ヒロシ", "修": "オサム",
      "敏夫": "トシオ", "義之": "ヨシユキ", "信一": "シンイチ", "幸一": "コウイチ", "広志": "ヒロシ",
      "裕一": "ユウイチ", "昌弘": "マサヒロ", "和彦": "カズヒコ", "康之": "ヤスユキ", "宏": "ヒロシ",
    };
    const firstNameKanaFemaleMap: Record<string, string> = {
      "美咲": "ミサキ", "さくら": "サクラ", "陽子": "ヨウコ", "恵美": "エミ", "裕子": "ユウコ",
      "明美": "アケミ", "久美子": "クミコ", "由美": "ユミ", "智子": "トモコ", "真理子": "マリコ",
      "直子": "ナオコ", "幸子": "サチコ", "洋子": "ヨウコ", "京子": "キョウコ", "典子": "ノリコ",
      "和子": "カズコ", "節子": "セツコ", "正美": "マサミ", "千恵": "チエ", "麻衣": "マイ",
    };

    const companyNames = [
      "株式会社テクノロジーズ", "グローバル株式会社", "フューチャー株式会社", "株式会社イノベーション",
      "ネクスト株式会社", "株式会社アドバンス", "プライム株式会社", "株式会社ソリューションズ",
      "スマート株式会社", "クリエイト株式会社", "株式会社パートナーズ", "デジタル株式会社",
      "サポート株式会社", "株式会社コンサルティング", "エンタープライズ株式会社",
      "株式会社リンク", "ファースト株式会社", "ブリッジ株式会社", "株式会社ワークス",
      "アクセル株式会社", "株式会社ホールディングス", "トラスト株式会社",
      "株式会社マネジメント", "ビジョン株式会社", "株式会社リサーチ",
    ];

    const cities = [
      "千代田区大手町1-1-1", "港区六本木3-2-1", "渋谷区渋谷2-5-1", "新宿区西新宿1-1-1",
      "中央区日本橋1-3-2", "品川区北品川5-1-1", "豊島区東池袋3-1-1", "文京区本郷3-1-1",
      "横浜市西区みなとみらい2-1-1", "大阪市北区梅田1-1-1", "名古屋市中区栄3-1-1",
      "福岡市中央区天神1-1-1", "札幌市中央区大通西1-1", "神戸市中央区三宮町1-1-1",
    ];

    const genders: ("male" | "female")[] = ["male", "female"];
    const memberCategories: ("member" | "sponsor" | "observer")[] = ["member", "sponsor", "observer"];
    const contractTypes: ("corporate" | "individual")[] = ["corporate", "individual"];
    const jobChangeIntents: ("active" | "considering" | "if_good" | "not_thinking")[] = ["active", "considering", "if_good", "not_thinking"];
    const auditMemberTypes: ("regular" | "online")[] = ["regular", "online"];

    // 簡易的な疑似乱数（seedを固定して再現可能にする）
    let seedRng = 42;
    function nextRng() {
      seedRng = (seedRng * 1103515245 + 12345) & 0x7fffffff;
      return seedRng;
    }
    function pick<T>(arr: T[]): T {
      return arr[nextRng() % arr.length];
    }
    function randomDate(startYear: number, endYear: number): Date {
      const year = startYear + (nextRng() % (endYear - startYear + 1));
      const month = nextRng() % 12;
      const day = 1 + (nextRng() % 28);
      return new Date(year, month, day);
    }

    for (let i = 1; i <= 100; i++) {
      const gender = pick(genders);
      const lastName = pick(lastNames);
      const firstName = gender === "male" ? pick(firstNamesMale) : pick(firstNamesFemale);
      const lastNameKana = lastNameKanaMap[lastName];
      const firstNameKana = gender === "male" ? firstNameKanaMaleMap[firstName] : firstNameKanaFemaleMap[firstName];
      const email = `seed-customer-${String(i).padStart(3, "0")}@example.com`;
      const company = nextRng() % 10 > 1 ? pick(companyNames) : undefined; // 80%は会社あり
      const phone = nextRng() % 3 === 0 ? `03${String(nextRng() % 100000000).padStart(8, "0")}` : undefined;
      const postalCode = nextRng() % 3 === 0 ? `${String(100 + nextRng() % 900).padStart(3, "0")}${String(nextRng() % 10000).padStart(4, "0")}` : undefined;
      const prefectureName = nextRng() % 3 === 0 ? pick(PREFECTURES) : undefined;
      const city = prefectureName ? pick(cities) : undefined;
      const jobChangeIntent = nextRng() % 3 === 0 ? pick(jobChangeIntents) : undefined;
      const listingCategoryKey = nextRng() % 4 === 0 ? pick(LISTING_CATEGORIES) : undefined;
      const note = nextRng() % 10 === 0 ? "seedで自動生成されたテストデータ" : undefined;

      const prefId = prefectureName ? prefectureMap.get(prefectureName) : undefined;
      const lcId = listingCategoryKey ? listingCategoryMap.get(`${listingCategoryKey.marketName}:${listingCategoryKey.stockExchangeName}`) : undefined;

      // コミュニティの割り当てを先に決定（memberCategoryの判定に必要）
      const communityAssignments: { communityId: number; community: typeof ventureAuditor }[] = [];
      const r = nextRng() % 10;
      if (r < 2) {
        // 20%: コミュニティなし（非会員）
      } else if (r < 5) {
        // 30%: 1コミュニティ
        const c = pick([ventureAuditor, naikanMeetup, aiClub]);
        communityAssignments.push({ communityId: c.id, community: c });
      } else if (r < 8) {
        // 30%: 2コミュニティ（Fisher-Yatesシャッフル）
        const arr = [ventureAuditor, naikanMeetup, aiClub];
        for (let j = arr.length - 1; j > 0; j--) {
          const k = nextRng() % (j + 1);
          [arr[j], arr[k]] = [arr[k], arr[j]];
        }
        communityAssignments.push({ communityId: arr[0].id, community: arr[0] });
        communityAssignments.push({ communityId: arr[1].id, community: arr[1] });
      } else {
        // 20%: 3コミュニティ
        communityAssignments.push({ communityId: ventureAuditor.id, community: ventureAuditor });
        communityAssignments.push({ communityId: naikanMeetup.id, community: naikanMeetup });
        communityAssignments.push({ communityId: aiClub.id, community: aiClub });
      }

      // コミュニティ所属者には必ず会員区分を付与、非所属者はundefined固定
      const hasCommunity = communityAssignments.length > 0;
      const memberCategory = hasCommunity ? pick(memberCategories) : undefined;
      const contractType = memberCategory ? pick(contractTypes) : undefined;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- seedスクリプト: 動的フィールド構築のためany使用
      const createData: any = {
        lastName,
        firstName,
        lastNameKana,
        firstNameKana,
        email,
        gender,
        prefectureId: prefId,
        listingCategoryId: lcId,
      };
      if (company) createData.company = company;
      if (phone) createData.phone = phone;
      if (postalCode) createData.postalCode = postalCode;
      if (city) createData.city = city;
      createData.memberCategory = memberCategory ?? null;
      createData.contractType = contractType ?? null;
      if (jobChangeIntent) createData.jobChangeIntent = jobChangeIntent;
      if (note) createData.note = note;

      const customer = await prisma.customer.upsert({
        where: { email },
        update: createData,
        create: createData,
      });

      // 前回seed実行時の古いコミュニティレコードをクリーンアップ
      await prisma.customerCommunity.deleteMany({
        where: { customerId: customer.id },
      });

      for (const { communityId, community } of communityAssignments) {
        const joinedAt = randomDate(2023, 2025);
        const isResigned = nextRng() % 10 === 0; // 10%は脱退
        const resignedAt = isResigned ? randomDate(2025, 2026) : undefined;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- seedスクリプト: 動的フィールド構築のためany使用
        const commData: any = {
          customerId: customer.id,
          communityId,
          joinedAt,
          resignedAt,
        };

        if (community.code === "venture_auditor") {
          commData.auditMemberType = pick(auditMemberTypes);
          commData.auditMemberPremium = nextRng() % 3 === 0; // 33%はプレミアム
          commData.originIndustryId = originIndustryMap.get(pick(ORIGIN_INDUSTRIES));
          commData.membershipQualificationId = membershipQualificationMap.get(pick(MEMBERSHIP_QUALIFICATIONS));
        } else {
          commData.affiliationId = affiliationMap.get(pick(AFFILIATIONS));
        }

        await prisma.customerCommunity.upsert({
          where: {
            customerId_communityId: {
              customerId: customer.id,
              communityId,
            },
          },
          update: commData,
          create: commData,
        });
      }

      if (i % 20 === 0) {
        console.log(`  ${i}/100 顧客を作成...`);
      }
    }
    console.log("100人の顧客データを作成しました");
  }

  // テスト用イベントデータの投入
  const otherCommunity = await prisma.community.findUnique({ where: { code: "other" } });

  if (ventureAuditor && naikanMeetup && aiClub) {
    const events = [
      {
        communityId: ventureAuditor.id,
        title: "第1回 定例勉強会",
        date: new Date("2025-06-15T18:00:00"),
        location: "東京都千代田区 会議室A",
        description: "監査実務における最新動向の共有とディスカッション",
        timetable: "18:00 受付\n18:30 開始\n20:00 懇親会",
        responseDeadline: new Date("2025-06-10T23:59:59"),
        allowsOnline: false,
        hasAfterParty: true,
      },
      {
        communityId: ventureAuditor.id,
        title: "2026年3月 定例勉強会",
        date: new Date("2026-03-20T18:00:00"),
        location: "東京都港区 セミナールーム",
        description: "四半期レビューと今後の活動方針",
        responseDeadline: new Date("2026-03-15T23:59:59"),
        allowsOnline: true,
        hasAfterParty: false,
      },
      {
        communityId: ventureAuditor.id,
        title: "2026年4月 特別例会",
        date: new Date("2026-04-20T18:00:00"),
        location: "東京都渋谷区 会議室",
        description: "外部講師を招いた特別セミナー",
        responseDeadline: new Date("2026-03-31T23:59:59"),
        allowsOnline: true,
        hasAfterParty: true,
      },
      {
        communityId: ventureAuditor.id,
        title: "2026年5月 定例勉強会（一時停止中）",
        date: new Date("2026-05-10T18:00:00"),
        location: "東京都新宿区",
        description: "会場調整のため受付を一時停止しています",
        responseDeadline: new Date("2026-05-05T23:59:59"),
        isPaused: true,
        allowsOnline: false,
        hasAfterParty: false,
      },
      {
        communityId: naikanMeetup.id,
        title: "ないかんMeetup #12",
        date: new Date("2025-07-10T19:00:00"),
        location: "オンライン（Zoom）",
        description: "内観法の実践と事例共有",
        responseDeadline: new Date("2025-07-08T23:59:59"),
        allowsOnline: true,
        hasAfterParty: false,
      },
      {
        communityId: naikanMeetup.id,
        title: "ないかんMeetup 2026年春",
        date: new Date("2026-04-15T19:00:00"),
        location: "東京都品川区 研修室",
        description: "春の交流会",
        responseDeadline: new Date("2026-04-10T23:59:59"),
        allowsOnline: false,
        hasAfterParty: true,
      },
      {
        communityId: aiClub.id,
        title: "AI部会 キックオフ Meetup",
        date: new Date("2025-09-05T18:30:00"),
        location: "東京都中央区 イベントスペース",
        description: "AI部会発足記念のキックオフイベント",
        timetable: "18:30 開場\n19:00 オープニング\n19:30  LT\n20:30 懇親",
        responseDeadline: new Date("2025-09-01T23:59:59"),
        allowsOnline: true,
        hasAfterParty: true,
      },
      {
        communityId: aiClub.id,
        title: "AI部会 勉強会 #2",
        date: new Date("2026-03-25T19:00:00"),
        location: "オンライン（Zoom）",
        description: "生成AIの監査への活用",
        responseDeadline: new Date("2026-03-20T23:59:59"),
        allowsOnline: true,
        hasAfterParty: false,
      },
    ];

    if (otherCommunity) {
      events.push({
        communityId: otherCommunity.id,
        title: "合同交流会",
        date: new Date("2026-06-01T18:00:00"),
        location: "東京都 未定",
        description: "複数コミュニティ合同の交流会",
        responseDeadline: new Date("2026-05-25T23:59:59"),
        allowsOnline: false,
        hasAfterParty: true,
        isPaused: false, // Default value to fix error
      } as (typeof events)[0]);
    }

    for (const eventData of events) {
      const existing = await prisma.event.findFirst({
        where: {
          communityId: eventData.communityId,
          title: eventData.title,
          date: eventData.date,
          deletedAt: null,
        },
      });

      if (!existing) {
        const eventRecord = await prisma.event.create({ data: eventData });
        console.log(`イベントを作成: ${eventRecord.title}`);
      }
    }

    // RSVPの投入
    const tanaka = await prisma.customer.findUnique({ where: { email: "tanaka@example.com" } });
    const suzuki = await prisma.customer.findUnique({ where: { email: "suzuki@example.com" } });
    const sato = await prisma.customer.findUnique({ where: { email: "sato@example.com" } });

    const ventureEvent1 = await prisma.event.findFirst({
      where: { communityId: ventureAuditor.id, title: "第1回 定例勉強会" },
    });
    const ventureEvent2 = await prisma.event.findFirst({
      where: { communityId: ventureAuditor.id, title: "2026年3月 定例勉強会" },
    });

    const rsvpCandidates = [
      { customer: tanaka, event: ventureEvent1, status: "attending" as const },
      { customer: suzuki, event: ventureEvent1, status: "attending" as const },
      { customer: sato, event: ventureEvent1, status: "online" as const },
      { customer: tanaka, event: ventureEvent2, status: "pending" as const },
      { customer: suzuki, event: ventureEvent2, status: "attending" as const },
    ];

    for (const { customer, event, status } of rsvpCandidates) {
      if (customer && event) {
        await prisma.rsvp.upsert({
          where: { eventId_customerId: { eventId: event.id, customerId: customer.id } },
          update: { status },
          create: {
            eventId: event.id,
            customerId: customer.id,
            token: randomUUID(),
            status,
            respondedAt: status !== "pending" ? new Date() : null,
          },
        });
      }
    }
    console.log("RSVPを作成しました");
  }

  console.log("シードデータの投入が完了しました");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
