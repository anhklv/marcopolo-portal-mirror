import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

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
