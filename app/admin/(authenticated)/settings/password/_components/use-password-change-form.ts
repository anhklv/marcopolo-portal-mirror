"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { changePasswordAction } from "@/lib/actions/admin.actions";
import { useFieldErrors } from "@/lib/hooks/use-field-errors";
import { isRedirectError } from "@/lib/utils";
import { passwordChangeSchema } from "@/lib/validations/admin";
import { formatZodFieldErrors } from "@/lib/validations/utils";

export function usePasswordChangeForm() {
  const [isPending, startTransition] = useTransition();

  // フォーム状態
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  // エラー状態
  const {
    fieldErrors,
    setFieldErrors,
    generalError,
    setGeneralError,
    clearFieldError,
  } = useFieldErrors();

  // フォーム送信
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const formData = {
      currentPassword,
      newPassword,
      newPasswordConfirm,
    };

    // クライアント側Zodバリデーション
    const parsed = passwordChangeSchema.safeParse(formData);
    if (!parsed.success) {
      setFieldErrors(formatZodFieldErrors(parsed.error));
      toast.error("入力内容に誤りがあります");
      return;
    }

    setFieldErrors({});
    startTransition(async () => {
      try {
        const result = await changePasswordAction(formData);

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
          toast.success("パスワードを変更しました");
          return;
        }
        toast.error("エラーが発生しました");
      }
    });
  };

  return {
    isPending,

    // フォーム状態
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    newPasswordConfirm,
    setNewPasswordConfirm,

    // エラー
    fieldErrors,
    generalError,
    clearFieldError,

    // ハンドラ
    handleSubmit,
  };
}
