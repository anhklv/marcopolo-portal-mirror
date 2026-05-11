"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedAdmin } from "@/lib/auth/permissions";
import { adminCreateSchema, adminUpdateSchema } from "@/lib/validations/admin";
import { formatZodFieldErrors } from "@/lib/validations/utils";
import * as adminRepo from "@/lib/repositories/admin.repository";
import { LastSuperAdminError } from "@/lib/repositories/admin.repository";
import type { ActionResult } from "@/lib/types/action";

// ============================================================
// Actions
// ============================================================

/**
 * 管理者新規作成
 */
export async function createAdminAction(
  formData: unknown
): Promise<ActionResult | void> {
  // 認証（特権管理者のみ）
  const { isSuper } = await requireAuthenticatedAdmin();
  if (!isSuper) {
    return { error: "この操作を実行する権限がありません" };
  }

  // バリデーション
  const parsed = adminCreateSchema.safeParse(formData);
  if (!parsed.success) {
    return { fieldErrors: formatZodFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  // メール重複チェック
  const emailExists = await adminRepo.existsByEmail(data.email);
  if (emailExists) {
    return { error: "このメールアドレスは既に登録されています" };
  }

  // 作成
  try {
    await adminRepo.create({
      lastName: data.lastName,
      firstName: data.firstName,
      email: data.email,
      password: data.password,
      role: data.role,
      communityIds: data.communityIds,
    });
  } catch (err: unknown) {
    if (isPrismaUniqueError(err)) {
      return { error: "このメールアドレスは既に登録されています" };
    }
    throw err;
  }

  revalidatePath("/admin/admins");
  redirect("/admin/admins");
}

/**
 * 管理者更新
 */
export async function updateAdminAction(
  id: number,
  formData: unknown
): Promise<ActionResult | void> {
  // 認証（特権管理者のみ）
  const { isSuper } = await requireAuthenticatedAdmin();
  if (!isSuper) {
    return { error: "この操作を実行する権限がありません" };
  }

  // バリデーション
  const parsed = adminUpdateSchema.safeParse(formData);
  if (!parsed.success) {
    return { fieldErrors: formatZodFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  // 存在確認
  const existing = await adminRepo.findById(id);
  if (!existing) {
    return { error: "管理者が見つかりません" };
  }

  // 特権管理者のrole変更防止
  if (existing.role === "super" && data.role !== "super") {
    return { error: "特権管理者の権限は変更できません" };
  }

  // メール重複チェック（自身を除外）
  const emailExists = await adminRepo.existsByEmail(data.email, id);
  if (emailExists) {
    return { error: "このメールアドレスは既に登録されています" };
  }

  // 更新
  try {
    await adminRepo.update(id, {
      lastName: data.lastName,
      firstName: data.firstName,
      email: data.email,
      role: data.role,
      communityIds: data.communityIds,
    });
  } catch (err: unknown) {
    if (isPrismaUniqueError(err)) {
      return { error: "このメールアドレスは既に登録されています" };
    }
    throw err;
  }

  revalidatePath("/admin/admins");
  redirect("/admin/admins");
}

/**
 * 管理者削除（物理削除）
 */
export async function deleteAdminAction(
  id: number
): Promise<ActionResult | void> {
  // 認証（特権管理者のみ）
  const { admin, isSuper } = await requireAuthenticatedAdmin();
  if (!isSuper) {
    return { error: "この操作を実行する権限がありません" };
  }

  // 自分自身の削除防止
  if (admin.id === id) {
    return { error: "自分自身を削除することはできません" };
  }

  // 存在確認
  const existing = await adminRepo.findById(id);
  if (!existing) {
    return { error: "管理者が見つかりません" };
  }

  // 削除（super の場合はトランザクション内で最終管理者チェック）
  try {
    await adminRepo.deleteById(
      id,
      existing.role === "super" ? { ensureMinSuperCount: 1 } : undefined
    );
  } catch (err: unknown) {
    if (err instanceof LastSuperAdminError) {
      return { error: "最後の特権管理者は削除できません" };
    }
    throw err;
  }

  revalidatePath("/admin/admins");
  redirect("/admin/admins");
}

// ============================================================
// ヘルパー
// ============================================================

function isPrismaUniqueError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}
