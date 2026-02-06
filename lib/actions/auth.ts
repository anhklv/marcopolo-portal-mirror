"use server";

import { signIn, signOut } from "@/lib/auth/auth";
import { AuthError } from "next-auth";
import { loginSchema } from "@/lib/validations/login";

export async function loginAction(email: string, password: string) {
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return {
      success: false,
      error: "メールアドレスとパスワードを正しく入力してください",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { success: true, error: null };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: "メールアドレスまたはパスワードが正しくありません",
      };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirect: false });
}
