"use client";

import { useState, useMemo, useTransition } from "react";
import { useArrayToggle } from "@/hooks/use-array-toggle";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { filterCustomers } from "@/lib/helpers/customer-filter";
import type { SerializedEventForInvite, SerializedCustomerForInvite } from "@/lib/types/serialized";
import type { CommunityOption } from "@/lib/types/serialized";
import { sendInviteAction, sendTestInviteAction } from "@/lib/actions/invite.actions";

// ============================================================
// 型定義
// ============================================================

export interface InviteCustomer extends SerializedCustomerForInvite {
  rsvpStatus: string | null; // null=未案内, "pending"=未回答
}

export type Step = "select" | "customize" | "confirm";

export interface UseInviteFormProps {
  event: SerializedEventForInvite;
  customers: SerializedCustomerForInvite[];
  communities: CommunityOption[];
  adminEmail: string;
  defaultEmailTitle: string;
  defaultEmailBody: string;
}

// ============================================================
// Hook
// ============================================================

export function useInviteForm({
  event,
  customers,
  adminEmail,
  defaultEmailTitle,
  defaultEmailBody,
}: UseInviteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ステップ管理
  const [step, setStep] = useState<Step>("select");

  // 選択・フォーム状態
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);
  const [emailTitle, setEmailTitle] = useState(defaultEmailTitle);
  const [emailBody, setEmailBody] = useState(defaultEmailBody);

  // フィルター状態
  const [searchKeyword, setSearchKeyword] = useState("");
  const [memberCategories, _toggleMemberCategory] = useArrayToggle<string>();
  const [selectedCommunityIds, toggleCommunityId] = useArrayToggle<number>();
  const [auditMemberTypes, _toggleAuditMemberType] = useArrayToggle<string>();
  const [premiumOnly, _setPremiumOnly] = useState(false);
  const [includeFormerMembers, setIncludeFormerMembers] = useState(false);
  const [includeNonMemberFilter, setIncludeNonMemberFilter] = useState(false);
  const [inviteStatuses, toggleInviteStatus] = useArrayToggle<string>();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // RSVP状態マップ（customerId → status）
  const rsvpStatusMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const r of event.rsvps) {
      map.set(r.customerId, r.status);
    }
    return map;
  }, [event.rsvps]);

  // 回答済み（attending/online/absent）を除外し、未案内/未回答のみ表示
  const customersWithStatus: InviteCustomer[] = useMemo(() => {
    const answeredStatuses = new Set(["attending", "online", "absent"]);
    return customers
      .filter((c) => {
        const status = rsvpStatusMap.get(c.id);
        return !status || !answeredStatuses.has(status);
      })
      .map((c) => ({
        ...c,
        rsvpStatus: rsvpStatusMap.get(c.id) ?? null,
      }));
  }, [customers, rsvpStatusMap]);

  // フィルタリング実行
  const filteredCustomers = useMemo(() => {
    const baseFiltered = filterCustomers(customersWithStatus, {
      keyword: searchKeyword,
      communityIds: selectedCommunityIds,
      memberCategories,
      auditMemberTypes,
      premiumOnly,
      includeFormerMembers,
      includeNonMemberFilter,
    });

    return baseFiltered.filter((customer) => {
      if (inviteStatuses.length > 0) {
        const matchesStatus = inviteStatuses.some((status) => {
          if (status === "未案内") return customer.rsvpStatus === null;
          if (status === "未回答") return customer.rsvpStatus === "pending";
          return true;
        });
        if (!matchesStatus) return false;
      }
      return true;
    });
  }, [
    customersWithStatus,
    searchKeyword,
    selectedCommunityIds,
    memberCategories,
    auditMemberTypes,
    premiumOnly,
    includeFormerMembers,
    includeNonMemberFilter,
    inviteStatuses,
  ]);

  // 確認画面用: 選択済み顧客情報
  const selectedCustomers = useMemo(() => {
    return customers.filter((c) => selectedCustomerIds.includes(c.id));
  }, [customers, selectedCustomerIds]);

  // ============================================================
  // ハンドラ
  // ============================================================

  const handleSelectNext = () => {
    if (selectedCustomerIds.length === 0) {
      toast.error("案内する顧客を選択してください");
      return;
    }
    setStep("customize");
  };

  const handleCustomizeNext = () => {
    if (!emailTitle.trim()) {
      toast.error("メールタイトルを入力してください");
      return;
    }
    if (!emailBody.trim()) {
      toast.error("メール本文を入力してください");
      return;
    }
    setStep("confirm");
  };

  const handleTestSend = () => {
    startTransition(async () => {
      try {
        const result = await sendTestInviteAction({
          eventId: event.id,
          emailTitle,
          emailBody,
        });
        if (result.success) {
          toast.success(`テストメールを ${adminEmail} に送信しました`);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("テスト送信中にエラーが発生しました");
      }
    });
  };

  const handleSend = () => {
    setConfirmOpen(false);
    startTransition(async () => {
      try {
        const result = await sendInviteAction({
          eventId: event.id,
          customerIds: selectedCustomerIds,
          emailTitle,
          emailBody,
        });
        if (result.success) {
          const msg =
            result.failedCount > 0
              ? `${result.sentCount}名に送信しました（${result.failedCount}名失敗: ${result.failedNames.join(", ")}）`
              : `${result.sentCount}名に案内メールを送信しました`;
          toast.success(msg);
          router.push(`/admin/events/${event.id}`);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("案内メールの送信中にエラーが発生しました");
      }
    });
  };

  const toggleCustomer = (customerId: number) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId]
    );
  };

  const toggleAllCustomers = () => {
    if (selectedCustomerIds.length === filteredCustomers.length && filteredCustomers.length > 0) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(filteredCustomers.map((c) => c.id));
    }
  };

  return {
    // ステップ
    step,
    setStep,
    // フォーム値
    emailTitle,
    setEmailTitle,
    emailBody,
    setEmailBody,
    // 選択
    selectedCustomerIds,
    selectedCustomers,
    toggleCustomer,
    toggleAllCustomers,
    // フィルター
    searchKeyword,
    setSearchKeyword,
    selectedCommunityIds,
    toggleCommunityId,
    includeFormerMembers,
    setIncludeFormerMembers,
    includeNonMemberFilter,
    setIncludeNonMemberFilter,
    inviteStatuses,
    toggleInviteStatus,
    filteredCustomers,
    // ダイアログ
    confirmOpen,
    setConfirmOpen,
    // アクション
    isPending,
    handleSelectNext,
    handleCustomizeNext,
    handleTestSend,
    handleSend,
  };
}
