import "dotenv/config";
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
