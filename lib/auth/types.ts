import type { AdminRole } from "@/lib/generated/prisma";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: AdminRole;
    firstName: string;
    lastName: string;
  }

  interface Session {
    user: {
      id: string;
      role: AdminRole;
      firstName: string;
      lastName: string;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: AdminRole;
    firstName: string;
    lastName: string;
  }
}
