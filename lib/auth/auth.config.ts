import type { NextAuthConfig } from "next-auth";
import type { AdminRole } from "@/lib/generated/prisma";

/**
 * Edge Runtime 互換の認証設定
 * Middleware で使用される（Prisma等のNode.js依存を含まない）
 */
export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      // ログインページは未認証でもアクセス可能
      if (request?.nextUrl?.pathname === "/admin/login") {
        return true;
      }
      return !!auth;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: AdminRole }).role;
        token.firstName = (user as { firstName: string }).firstName;
        token.lastName = (user as { lastName: string }).lastName;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as AdminRole;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
