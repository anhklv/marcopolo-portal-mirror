"use client";

import { useState, useMemo, useTransition } from "react";
import { useArrayToggle } from "@/hooks/use-array-toggle";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Search, Users, ChevronDown, Send, Mail } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FormField } from "@/components/ui/form-field";
import { ActionButton } from "@/components/ui/action-button";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import { SectionHeading } from "@/components/ui/section-heading";
import { filterCustomers } from "@/lib/helpers/customer-filter";
import { getCustomerBadges } from "@/lib/helpers/customer-detail";
import type { CustomerCommunityForBadge } from "@/lib/helpers/customer-detail";
import type { SerializedEventForInvite, SerializedCustomerForInvite } from "@/lib/types/serialized";
import type { CommunityOption } from "@/lib/types/serialized";
import { sendInviteAction, sendTestInviteAction } from "@/lib/actions/invite.actions";
import { cn } from "@/lib/utils";

interface InviteCustomer extends SerializedCustomerForInvite {
  isInvited?: boolean;
}

interface InviteFormProps {
  event: SerializedEventForInvite;
  customers: SerializedCustomerForInvite[];
  currentUserRole: "super" | "community_admin";
  communities: CommunityOption[];
  adminEmail: string;
  defaultEmailTitle: string;
  defaultEmailBody: string;
}

type Step = "select" | "customize" | "confirm";

const STEPS = [
  { key: "select", label: "案内者を選択", number: 1 },
  { key: "customize", label: "メール文作成", number: 2 },
  { key: "confirm", label: "確認", number: 3 },
  { key: "send", label: "送信", number: 4 },
];

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const getStepStatus = (stepKey: string) => {
    const currentIndex = STEPS.findIndex((s) => s.key === currentStep);
    const stepIndex = STEPS.findIndex((s) => s.key === stepKey);

    if (stepKey === "send") return "upcoming";
    if (stepIndex <= currentIndex) return "completed";
    return "upcoming";
  };

  return (
    <div className="flex items-center justify-between w-full mb-6">
      {STEPS.map((stepItem) => {
        const status = getStepStatus(stepItem.key);
        return (
          <div key={stepItem.key} className="flex flex-col items-center flex-1">
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors mb-2",
                status === "completed" && "bg-primary text-primary-foreground border-primary",
                status === "upcoming" && "bg-background text-muted-foreground border-muted"
              )}
            >
              {status === "completed" ? <Check className="h-5 w-5" /> : <span className="text-sm font-medium">{stepItem.number}</span>}
            </div>
            <div className={cn("text-sm font-medium text-center", status === "upcoming" && "text-muted-foreground")}>
              {stepItem.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function InviteForm({
  event,
  customers,
  currentUserRole,
  communities,
  adminEmail,
  defaultEmailTitle,
  defaultEmailBody,
}: InviteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>("select");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);
  const [emailTitle, setEmailTitle] = useState(defaultEmailTitle);
  const [emailBody, setEmailBody] = useState(defaultEmailBody);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [memberCategories, _toggleMemberCategory] = useArrayToggle<string>();
  const [selectedCommunityIds, toggleCommunityId] = useArrayToggle<number>();
  const [auditMemberTypes, _toggleAuditMemberType] = useArrayToggle<string>();
  const [premiumOnly, _setPremiumOnly] = useState(false);
  const [includeFormerMembers, setIncludeFormerMembers] = useState(false);
  const [includeNonMemberFilter, setIncludeNonMemberFilter] = useState(false);
  const [inviteStatuses, toggleInviteStatus] = useArrayToggle<string>();
  const [inviteStatusSearch, setInviteStatusSearch] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 招待済みIDのセット
  const invitedCustomerIds = useMemo(() => {
    return new Set(event.rsvpCustomerIds);
  }, [event.rsvpCustomerIds]);

  // 顧客リストに招待済み情報を付与
  const customersWithStatus: InviteCustomer[] = useMemo(() => {
    return customers.map((c) => ({
      ...c,
      isInvited: invitedCustomerIds.has(c.id),
    }));
  }, [customers, invitedCustomerIds]);

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
          if (status === "案内済み") return customer.isInvited;
          if (status === "未案内") return !customer.isInvited;
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

  const getFilterDisplayText = () => {
    const totalFilters = selectedCommunityIds.length + (includeNonMemberFilter ? 1 : 0);
    if (totalFilters === 0) return "コミュニティ";

    const parts: string[] = [];
    communities.filter((c) => selectedCommunityIds.includes(c.id)).forEach((c) => parts.push(c.name));
    if (includeNonMemberFilter) parts.push("非会員");

    if (parts.length === 1) return parts[0];
    return `${parts.length}件選択`;
  };

  const renderBadges = (customer: SerializedCustomerForInvite) => {
    const badges = getCustomerBadges(
      customer.customerCommunities as CustomerCommunityForBadge[],
      customer.memberCategory
    );
    return badges.map((badge, i) => (
      <Badge key={i} variant={badge.variant}>
        {badge.label}
      </Badge>
    ));
  };

  // ステップ1: 案内者選択
  if (step === "select") {
    return (
      <div className="max-w-4xl space-y-6">
        <PageHeader
          backHref={`/admin/events/${event.id}`}
          title="案内メール送信"
          description="案内メールを送信する顧客を選択してください。"
        />

        <StepIndicator currentStep={step} />

        <div className="space-y-4">
          <div className="space-y-2">
            <SectionHeading>案内者を選択</SectionHeading>
            <p className="text-sm text-muted-foreground">
              未案内の顧客を選択して案内メールを送信します。
              <br />
              ※送信時に自動で個別ID付きURLが生成されます。
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="名前、会社名、メールアドレスで検索..."
                className="pl-9 h-9 text-sm"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[280px] justify-between h-9 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">{getFilterDisplayText()}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0 bg-card" align="start">
                <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">コミュニティ</Label>
                    <div className="space-y-2">
                      {communities.map((community) => (
                        <CheckboxItem
                          key={community.id}
                          id={`org-${community.code}`}
                          label={community.name}
                          checked={selectedCommunityIds.includes(community.id)}
                          onCheckedChange={(c) => toggleCommunityId(community.id, c)}
                        />
                      ))}
                      {currentUserRole === "super" && (
                        <CheckboxItem
                          id="org-nonmember"
                          label="非会員"
                          checked={includeNonMemberFilter}
                          onCheckedChange={setIncludeNonMemberFilter}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-between h-9 text-sm">
                  <span>
                    {inviteStatuses.length === 0
                      ? "案内状況"
                      : inviteStatuses.length === 1
                        ? inviteStatuses[0]
                        : `${inviteStatuses.length}件選択`}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0 bg-card" align="start">
                <div className="p-3 border-b">
                  <Input
                    placeholder="案内状況を検索"
                    value={inviteStatusSearch}
                    onChange={(e) => setInviteStatusSearch(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="p-2">
                  {["案内済み", "未案内"]
                    .filter((s) => s.includes(inviteStatusSearch))
                    .map((status) => (
                      <CheckboxItem
                        key={status}
                        id={`status-${status}`}
                        label={status}
                        checked={inviteStatuses.includes(status)}
                        onCheckedChange={(c) => toggleInviteStatus(status, c)}
                      />
                    ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex items-center h-9">
              <CheckboxItem
                id="include-former-members"
                label="元会員を含む"
                checked={includeFormerMembers}
                onCheckedChange={setIncludeFormerMembers}
              />
            </div>
          </div>

          <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
            <div>
              <span className="font-medium">{selectedCustomerIds.length}名</span> 選択中
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllCustomers}
              disabled={filteredCustomers.length === 0}
            >
              {selectedCustomerIds.length === filteredCustomers.length && filteredCustomers.length > 0
                ? "すべて解除"
                : "すべて選択"}
            </Button>
          </div>

          <div className="rounded-lg bg-card">
            <Table className="[&_th]:py-4 [&_td]:py-4">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">選択</TableHead>
                  <TableHead>氏名</TableHead>
                  <TableHead>会社名</TableHead>
                  <TableHead>会員区分</TableHead>
                  <TableHead>案内状況</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      検索条件に一致する顧客が見つかりませんでした。
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCustomerIds.includes(customer.id)}
                          onCheckedChange={() => toggleCustomer(customer.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {customer.lastName} {customer.firstName}
                      </TableCell>
                      <TableCell>{customer.company}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap items-center">{renderBadges(customer)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.isInvited ? "default" : "outline"}>
                          {customer.isInvited ? "案内済み" : "未案内"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <ActionButton variant="outline" asChild>
              <Link href={`/admin/events/${event.id}`}>キャンセル</Link>
            </ActionButton>
            <ActionButton onClick={handleSelectNext}>次へ</ActionButton>
          </div>
        </div>
      </div>
    );
  }

  // ステップ2: メール文作成
  if (step === "customize") {
    return (
      <div className="max-w-4xl space-y-6">
        <PageHeader
          backAction={() => setStep("select")}
          title="案内メール送信"
          description="案内メールのタイトルと本文を編集できます。"
        />

        <StepIndicator currentStep={step} />

        <div className="space-y-6">
          <div className="space-y-2">
            <SectionHeading>メール文作成</SectionHeading>
            <p className="text-sm text-muted-foreground">送信するメールのタイトルと本文を編集してください。</p>
          </div>

          <FormField label="メールタイトル">
            <Input value={emailTitle} onChange={(e) => setEmailTitle(e.target.value)} placeholder="メールタイトルを入力" />
          </FormField>

          <FormField
            label="メール本文"
            description="{RSVP_URL} は送信時に顧客ごとの回答URLに自動置換されます。"
          >
            <Textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="メール本文を入力"
              rows={30}
              className="min-h-[480px]"
            />
          </FormField>

          <div className="flex justify-center gap-4 pt-4">
            <ActionButton variant="outline" onClick={() => setStep("select")}>
              戻る
            </ActionButton>
            <ActionButton onClick={handleCustomizeNext}>次へ</ActionButton>
          </div>
        </div>
      </div>
    );
  }

  // ステップ3: 確認
  if (step === "confirm") {
    return (
      <div className="max-w-4xl space-y-6">
        <PageHeader
          backAction={() => setStep("customize")}
          title="案内メール送信"
          description="送信内容を確認して、テスト送信または送信を実行してください。"
        />

        <StepIndicator currentStep={step} />

        <div className="space-y-6">
          <div className="space-y-4">
            <SectionHeading>送信先</SectionHeading>
            <p className="text-sm text-muted-foreground">{selectedCustomers.length}名に送信します</p>
            <div className="space-y-2 text-sm">
              {selectedCustomers.map((customer) => (
                <div key={customer.id}>
                  {customer.lastName} {customer.firstName} ({customer.email})
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <SectionHeading>メール内容</SectionHeading>
            <div className="space-y-4">
              <div>
                <div className="font-medium mb-2">タイトル:</div>
                <div className="text-sm bg-muted p-3 rounded">{emailTitle}</div>
              </div>
              <div>
                <div className="font-medium mb-2">本文:</div>
                <div className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">{emailBody}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <ActionButton variant="outline" onClick={() => setStep("customize")}>
              戻る
            </ActionButton>
            <ActionButton variant="outline" onClick={handleTestSend} disabled={isPending}>
              <Mail className="h-4 w-4" />
              テスト送信
            </ActionButton>
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogTrigger asChild>
                <ActionButton disabled={isPending}>
                  <Send className="h-4 w-4" />
                  送信
                </ActionButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>案内メールを送信しますか？</DialogTitle>
                  <DialogDescription>
                    {selectedCustomers.length}名に案内メールを送信します。この操作は取り消せません。
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                    キャンセル
                  </Button>
                  <Button onClick={handleSend} disabled={isPending}>
                    {isPending ? "送信中..." : "送信する"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
