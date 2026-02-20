import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import "@/lib/auth/types";

// タイミング攻撃対策: ユーザー未存在時もbcrypt.compareを実行し、
// レスポンス時間からメールアドレスの存在有無を推測できないようにする
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
    // 少人数運用（〜10名）のため短いmaxAgeで対応。
    // ロール変更時は再ログインが必要。管理者数が増えた場合は
    // tokenVersion方式やDB照合方式への移行を検討する。
    maxAge: 60 * 60, // 1時間
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) {
          return null;
        }

        const admin = await prisma.admin.findUnique({
          where: { email },
        });

        const hash = admin?.passwordHash ?? DUMMY_HASH;
        const isValid = await bcrypt.compare(password, hash);

        if (!admin || !isValid) {
          return null;
        }

        // lastLoginAt を更新
        await prisma.admin.update({
          where: { id: admin.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: String(admin.id),
          email: admin.email,
          role: admin.role,
          firstName: admin.firstName,
          lastName: admin.lastName,
        };
      },
    }),
  ],
});
