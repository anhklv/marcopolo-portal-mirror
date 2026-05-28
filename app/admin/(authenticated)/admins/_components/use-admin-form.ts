"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createAdminAction,
  updateAdminAction,
  deleteAdminAction,
} from "@/lib/actions/admin.actions";
import type { CommunityOption } from "@/lib/types/serialized";
import { useFieldErrors } from "@/lib/hooks/use-field-errors";
import { isRedirectError } from "@/lib/utils";
import { adminCreateSchema, adminUpdateSchema } from "@/lib/validations/admin";
import { formatZodFieldErrors } from "@/lib/validations/utils";

// ============================================================
// 型定義
// ============================================================

export interface AdminInitialData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "super" | "community_admin";
  communityIds: number[];
}

interface UseAdminFormProps {
  mode: "create" | "edit";
  initialData?: AdminInitialData;
  communities: CommunityOption[];
}

// ============================================================
// カスタムフック
// ============================================================

export function useAdminForm({
  mode,
  initialData,
  communities,
}: UseAdminFormProps) {
  const [isPending, startTransition] = useTransition();

  // フォーム状態
  const [lastName, setLastName] = useState(initialData?.lastName ?? "");
  const [firstName, setFirstName] = useState(initialData?.firstName ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState<"super" | "community_admin">(
    initialData?.role ?? "community_admin"
  );
  const [communityIds, setCommunityIds] = useState<number[]>(
    initialData?.communityIds ?? []
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // エラー状態
  const {
    fieldErrors,
    setFieldErrors,
    generalError,
    setGeneralError,
    clearFieldError,
  } = useFieldErrors();

  // 元のroleがsuperかどうか（編集時のRadioGroup disabled判定用）
  const isOriginalSuper = mode === "edit" && initialData?.role === "super";

  // コミュニティ選択トグル
  const handleCommunityToggle = (communityId: number, checked: boolean) => {
    setCommunityIds((prev) =>
      checked ? [...prev, communityId] : prev.filter((id) => id !== communityId)
    );
    clearFieldError("communityIds");
  };

  // フォーム送信
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const formData =
      mode === "create"
        ? {
            lastName,
            firstName,
            email,
            password,
            passwordConfirm,
            role,
            communityIds: role === "community_admin" ? communityIds : undefined,
          }
        : {
            lastName,
            firstName,
            email,
            role,
            communityIds: role === "community_admin" ? communityIds : undefined,
          };

    // クライアント側Zodバリデーション
    const schema = mode === "create" ? adminCreateSchema : adminUpdateSchema;
    const parsed = schema.safeParse(formData);
    if (!parsed.success) {
      setFieldErrors(formatZodFieldErrors(parsed.error));
      toast.error("入力内容に誤りがあります");
      return;
    }

    setFieldErrors({});
    startTransition(async () => {
      try {
        const result =
          mode === "create"
            ? await createAdminAction(formData)
            : await updateAdminAction(initialData!.id, formData);

        if (result) {
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
            toast.error("入力内容に誤りがあります");
          } else if (result.error) {
            setGeneralError(result.error);
            toast.error(result.error);
          }
        }
      } catch (err) {
        if (isRedirectError(err)) {
          toast.success(
            mode === "create"
              ? "管理者を登録しました"
              : "管理者情報を更新しました"
          );
          return;
        }
        toast.error("エラーが発生しました");
      }
    });
  };

  // 削除処理
  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteAdminAction(initialData!.id);
        if (result?.error) {
          toast.error(result.error);
          setIsDeleteDialogOpen(false);
        }
      } catch (err) {
        if (isRedirectError(err)) {
          toast.success("管理者を削除しました");
          return;
        }
        toast.error("エラーが発生しました");
      }
    });
  };

  return {
    isPending,

    // フォーム状態
    lastName,
    setLastName,
    firstName,
    setFirstName,
    email,
    setEmail,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    role,
    setRole,
    communityIds,
    communities,
    isOriginalSuper,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,

    // エラー
    fieldErrors,
    generalError,
    clearFieldError,

    // ハンドラ
    handleCommunityToggle,
    handleSubmit,
    handleDelete,
  };
}
