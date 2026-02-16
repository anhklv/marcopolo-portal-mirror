import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { disposeExternalPool: true });
const prisma = new PrismaClient({ adapter });

async function main() {
  // コミュニティマスターデータの投入
  const communities = [
    {
      code: "venture_auditor",
      name: "ベンチャー監査役の会",
      hasSurvey: true,
      sortOrder: 1,
    },
    {
      code: "naikan_meetup",
      name: "ないかんMeetup",
      hasSurvey: false,
      sortOrder: 2,
    },
    {
      code: "ai_club",
      name: "AI部会",
      hasSurvey: false,
      sortOrder: 3,
    },
    {
      code: "other",
      name: "その他",
      hasSurvey: false,
      sortOrder: 99,
    },
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
    {
      email: "admin@example.com",
      firstName: "太郎",
      lastName: "管理",
      role: "super" as const,
      communities: [] as string[], // superは全アクセス
    },
    {
      email: "kansa@example.com",
      firstName: "一郎",
      lastName: "監査",
      role: "community_admin" as const,
      communities: ["venture_auditor"],
    },
    {
      email: "naikan@example.com",
      firstName: "二郎",
      lastName: "内観",
      role: "community_admin" as const,
      communities: ["naikan_meetup"],
    },
    {
      email: "ai@example.com",
      firstName: "三郎",
      lastName: "知能",
      role: "community_admin" as const,
      communities: ["ai_club"],
    },
    {
      email: "all@example.com",
      firstName: "花子",
      lastName: "全部",
      role: "community_admin" as const,
      communities: ["venture_auditor", "naikan_meetup", "ai_club"],
    },
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

    // コミュニティ紐付け
    for (const communityCode of adminData.communities) {
      const community = await prisma.community.findUnique({
        where: { code: communityCode },
      });
      if (community) {
        await prisma.adminCommunity.upsert({
          where: {
            adminId_communityId: {
              adminId: admin.id,
              communityId: community.id,
            },
          },
          update: {},
          create: {
            adminId: admin.id,
            communityId: community.id,
          },
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
        firstName: "太郎",
        lastName: "田中",
        firstNameKana: "タロウ",
        lastNameKana: "タナカ",
        email: "tanaka@example.com",
        company: "株式会社テスト",
        phone: "03-1234-5678",
        postalCode: "100-0001",
        prefecture: "東京都",
        city: "千代田区丸の内1-1-1",
        gender: "male" as const,
        listingCategory: "プライム",
        originIndustry: "事業会社",
        membershipQualification: "監査役",
        memberCategory: "member" as const,
        contractType: "corporate" as const,
        communities: [
          {
            communityId: ventureAuditor.id,
            auditMemberType: "regular" as const,
            auditMemberPremium: true,
            joinedAt: new Date("2024-04-01"),
          },
          {
            communityId: naikanMeetup.id,
            affiliation: "内部監査部門",
            joinedAt: new Date("2024-06-01"),
          },
        ],
      },
      {
        firstName: "花子",
        lastName: "鈴木",
        firstNameKana: "ハナコ",
        lastNameKana: "スズキ",
        email: "suzuki@example.com",
        company: "鈴木監査法人",
        gender: "female" as const,
        memberCategory: "member" as const,
        contractType: "individual" as const,
        communities: [
          {
            communityId: ventureAuditor.id,
            auditMemberType: "online" as const,
            auditMemberPremium: false,
            joinedAt: new Date("2024-05-01"),
          },
        ],
      },
      {
        firstName: "一郎",
        lastName: "佐藤",
        firstNameKana: "イチロウ",
        lastNameKana: "サトウ",
        email: "sato@example.com",
        company: "佐藤コンサルティング",
        gender: "male" as const,
        memberCategory: "sponsor" as const,
        contractType: "corporate" as const,
        communities: [
          {
            communityId: naikanMeetup.id,
            affiliation: "経営企画部門",
            joinedAt: new Date("2024-03-01"),
          },
          {
            communityId: aiClub.id,
            affiliation: "情報システム部門",
            joinedAt: new Date("2024-07-01"),
          },
        ],
      },
      {
        firstName: "一部",
        lastName: "鈴木",
        email: "suzuki.partial@example.com",
        company: "株式会社一部脱退",
        gender: "female" as const,
        memberCategory: "member" as const,
        contractType: "corporate" as const,
        communities: [
          {
            communityId: ventureAuditor.id,
            auditMemberType: "regular" as const,
            auditMemberPremium: false,
            joinedAt: new Date("2023-04-01"),
            resignedAt: new Date("2024-03-31"), // ベンチャー監査役の会は脱退
          },
          {
            communityId: naikanMeetup.id,
            affiliation: "内部監査室",
            joinedAt: new Date("2023-04-01"), // ないかんMeetupは現役
          },
          {
            communityId: aiClub.id,
            affiliation: "AI推進室",
            joinedAt: new Date("2023-04-01"), // AI部会は現役
          },
        ],
      },
      {
        firstName: "二部",
        lastName: "佐藤",
        email: "sato.partial2@example.com",
        company: "株式会社二部脱退",
        gender: "male" as const,
        memberCategory: "member" as const,
        contractType: "corporate" as const,
        communities: [
          {
            communityId: ventureAuditor.id,
            auditMemberType: "regular" as const,
            auditMemberPremium: false,
            joinedAt: new Date("2023-04-01"),
            resignedAt: new Date("2024-03-31"), // ベンチャー監査役の会は脱退
          },
          {
            communityId: naikanMeetup.id,
            affiliation: "内部監査室",
            joinedAt: new Date("2023-04-01"),
            resignedAt: new Date("2024-03-31"), // ないかんMeetupも脱退
          },
          {
            communityId: aiClub.id,
            affiliation: "AI推進室",
            joinedAt: new Date("2023-04-01"), // AI部会は現役
          },
        ],
      },
      {
        firstName: "全部",
        lastName: "田中",
        email: "tanaka.full@example.com",
        company: "株式会社全部脱退",
        gender: "male" as const,
        memberCategory: "member" as const,
        contractType: "corporate" as const,
        communities: [
          {
            communityId: ventureAuditor.id,
            auditMemberType: "regular" as const,
            auditMemberPremium: false,
            joinedAt: new Date("2023-04-01"),
            resignedAt: new Date("2024-03-31"), // ベンチャー監査役の会は脱退
          },
          {
            communityId: naikanMeetup.id,
            affiliation: "内部監査室",
            joinedAt: new Date("2023-04-01"),
            resignedAt: new Date("2024-03-31"), // ないかんMeetupも脱退
          },
          {
            communityId: aiClub.id,
            affiliation: "AI推進室",
            joinedAt: new Date("2023-04-01"),
            resignedAt: new Date("2024-03-31"), // AI部会も脱退
          },
        ],
      },
      {
        firstName: "二郎",
        lastName: "高橋",
        email: "takahashi@example.com",
        company: "高橋株式会社",
        memberCategory: "observer" as const,
        communities: [
          {
            communityId: aiClub.id,
            affiliation: "代表者（社長・CEO）",
            joinedAt: new Date("2024-08-01"),
          },
        ],
      },
      {
        firstName: "三郎",
        lastName: "渡辺",
        email: "watanabe@example.com",
        note: "非会員（イベント参加のみ）",
        communities: [],
      },
    ];

    for (const customerData of customers) {
      const { communities: communityData, ...customerFields } = customerData;
      const customer = await prisma.customer.upsert({
        where: { email: customerFields.email },
        update: customerFields,
        create: customerFields,
      });

      for (const comm of communityData) {
        await prisma.customerCommunity.upsert({
          where: {
            customerId_communityId: {
              customerId: customer.id,
              communityId: comm.communityId,
            },
          },
          update: comm,
          create: {
            customerId: customer.id,
            ...comm,
          },
        });
      }

      console.log(`顧客を作成: ${customer.lastName} ${customer.firstName} (${customer.email})`);
    }
  }

  // テスト用イベントデータの投入
  const otherCommunity = await prisma.community.findUnique({
    where: { code: "other" },
  });

  if (ventureAuditor && naikanMeetup && aiClub) {
    const now = new Date();
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

    // RSVPの投入（既存顧客に紐づけ）
    const tanaka = await prisma.customer.findUnique({
      where: { email: "tanaka@example.com" },
    });
    const suzuki = await prisma.customer.findUnique({
      where: { email: "suzuki@example.com" },
    });
    const sato = await prisma.customer.findUnique({
      where: { email: "sato@example.com" },
    });

    const ventureEvent1 = await prisma.event.findFirst({
      where: {
        communityId: ventureAuditor.id,
        title: "第1回 定例勉強会",
      },
    });
    const ventureEvent2 = await prisma.event.findFirst({
      where: {
        communityId: ventureAuditor.id,
        title: "2026年3月 定例勉強会",
      },
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
          where: {
            eventId_customerId: { eventId: event.id, customerId: customer.id },
          },
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
