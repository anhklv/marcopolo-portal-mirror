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
  const passwordHash = await bcrypt.hash("password12345", 10);

  const superAdmin = await prisma.admin.upsert({
    where: { email: "admin@example.com" },
    update: {
      firstName: "太郎",
      lastName: "管理",
      passwordHash,
      role: "super",
    },
    create: {
      email: "admin@example.com",
      firstName: "太郎",
      lastName: "管理",
      passwordHash,
      role: "super",
    },
  });

  const communityAdmin = await prisma.admin.upsert({
    where: { email: "community@example.com" },
    update: {
      firstName: "花子",
      lastName: "運営",
      passwordHash,
      role: "community_admin",
    },
    create: {
      email: "community@example.com",
      firstName: "花子",
      lastName: "運営",
      passwordHash,
      role: "community_admin",
    },
  });

  // community_admin に venture_auditor と naikan_meetup を紐づけ
  const ventureAuditor = await prisma.community.findUnique({
    where: { code: "venture_auditor" },
  });
  const naikanMeetup = await prisma.community.findUnique({
    where: { code: "naikan_meetup" },
  });

  if (ventureAuditor) {
    await prisma.adminCommunity.upsert({
      where: {
        adminId_communityId: {
          adminId: communityAdmin.id,
          communityId: ventureAuditor.id,
        },
      },
      update: {},
      create: {
        adminId: communityAdmin.id,
        communityId: ventureAuditor.id,
      },
    });
  }

  if (naikanMeetup) {
    await prisma.adminCommunity.upsert({
      where: {
        adminId_communityId: {
          adminId: communityAdmin.id,
          communityId: naikanMeetup.id,
        },
      },
      update: {},
      create: {
        adminId: communityAdmin.id,
        communityId: naikanMeetup.id,
      },
    });
  }

  console.log(`super管理者を作成: ${superAdmin.email}`);
  console.log(`community_adminを作成: ${communityAdmin.email}`);
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
