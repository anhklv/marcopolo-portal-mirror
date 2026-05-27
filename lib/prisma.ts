import { PrismaClient } from "@/lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  // URLオブジェクトでパースして確実にパラメータを取得し、pgに渡す
  const url = new URL(connectionString!);
  const requiresSsl =
    url.searchParams.get("sslmode") === "require" ||
    url.host.includes("neon.tech");

  const pool = new Pool({
    user: url.username,
    password: url.password,
    host: url.hostname,
    port: parseInt(url.port),
    database: url.pathname.slice(1),
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
  });

  const adapter = new PrismaPg(pool, { disposeExternalPool: true });
  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV !== "production"
        ? [
            // { emit: "event", level: "query" },
            { emit: "stdout", level: "warn" },
            { emit: "stdout", level: "error" },
          ]
        : [],
  });

  if (process.env.NODE_ENV !== "production") {
    // client.$on("query", (e) => {
    //   console.log(`[Prisma Query] ${e.query}`);
    //   console.log(`[Prisma Params] ${e.params}`);
    //   console.log(`[Prisma Duration] ${e.duration}ms`);
    // });
  }

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
