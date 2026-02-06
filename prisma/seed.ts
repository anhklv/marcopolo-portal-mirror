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
