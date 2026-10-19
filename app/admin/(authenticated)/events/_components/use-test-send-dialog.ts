"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

type TestSendResult =
  | { success: true }
  | { success: false; error: string };

interface UseTestSendDialogOptions {
  onSend: (adminIds: number[]) => Promise<TestSendResult>;
}

export function useTestSendDialog({ onSend }: UseTestSendDialogOptions) {
  const [open, setOpen] = useState(false);
  const [selectedAdminIds, setSelectedAdminIds] = useState<number[]>([]);
  const [isSending, setIsSending] = useState(false);

  const handleOpen = useCallback(() => {
    setSelectedAdminIds([]);
    setOpen(true);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (isSending) return;
      setOpen(nextOpen);
      if (!nextOpen) setSelectedAdminIds([]);
    },
    [isSending]
  );

  const toggleAdmin = useCallback((adminId: number) => {
    setSelectedAdminIds((current) =>
      current.includes(adminId)
        ? current.filter((id) => id !== adminId)
        : [...current, adminId]
    );
  }, []);

  const handleSend = useCallback(async () => {
    if (selectedAdminIds.length === 0) {
      toast.error("送信先の管理者を1名以上選択してください。");
      return;
    }

    setIsSending(true);
    try {
      const result = await onSend(selectedAdminIds);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        `テストメールを${selectedAdminIds.length}名に送信しました。`
      );
      setOpen(false);
      setSelectedAdminIds([]);
    } catch {
      toast.error("テストメールの送信に失敗しました。");
    } finally {
      setIsSending(false);
    }
  }, [onSend, selectedAdminIds]);

  return {
    open,
    selectedAdminIds,
    isSending,
    handleOpen,
    handleOpenChange,
    toggleAdmin,
    handleSend,
  };
}
