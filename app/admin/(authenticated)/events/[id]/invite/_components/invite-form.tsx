"use client";

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
import { CustomerBadges } from "@/components/ui/customer-badges";
import { Check, Search, Users, ChevronDown, Send, Mail } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FormField } from "@/components/ui/form-field";
import { ActionButton } from "@/components/ui/action-button";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import { SectionHeading } from "@/components/ui/section-heading";
import type { SerializedEventForInvite, SerializedCustomerForInvite } from "@/lib/types/serialized";
import type { CommunityOption } from "@/lib/types/serialized";
import { cn } from "@/lib/utils";
import { getFilterDisplayText } from "@/lib/helpers/filter-display";
import { useInviteForm } from "./use-invite-form";
import type { Step } from "./use-invite-form";

// ============================================================
// StepIndicator
// ============================================================

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

    // "send" はインジケータ表示専用で、実際のstep状態としては使わない
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

// ============================================================
// InviteForm
// ============================================================

interface InviteFormProps {
  event: SerializedEventForInvite;
  customers: SerializedCustomerForInvite[];
  currentUserRole: "super" | "community_admin";
  communities: CommunityOption[];
  adminEmail: string;
  defaultEmailTitle: string;
  defaultEmailBody: string;
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
  const form = useInviteForm({
    event,
    customers,
    communities,
    adminEmail,
    defaultEmailTitle,
    defaultEmailBody,
  });

  // ステップ1: 案内者選択
  if (form.step === "select") {
    return (
      <div className="max-w-4xl space-y-6">
        <PageHeader
          backHref={`/admin/events/${event.id}`}
          title="案内メール送信"
          description="案内メールを送信する顧客を選択してください。"
        />

        <StepIndicator currentStep={form.step} />

        <div className="space-y-4">
          <div className="space-y-2">
            <SectionHeading>案内者を選択</SectionHeading>
            <p className="text-sm text-muted-foreground">
              未案内・未回答の顧客を選択して案内メールを送信します。未回答の顧客には新しいURLで再送されます。
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
                value={form.searchKeyword}
                onChange={(e) => form.setSearchKeyword(e.target.value)}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[280px] justify-between h-9 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">{getFilterDisplayText(communities, form.selectedCommunityIds, form.includeNonMemberFilter)}</span>
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
                          checked={form.selectedCommunityIds.includes(community.id)}
                          onCheckedChange={(c) => form.toggleCommunityId(community.id, c)}
                          labelClassName="text-sm"
                        />
                      ))}
                      {currentUserRole === "super" && (
                        <CheckboxItem
                          id="org-nonmember"
                          label="非会員"
                          checked={form.includeNonMemberFilter}
                          onCheckedChange={form.setIncludeNonMemberFilter}
                          labelClassName="text-sm"
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
                    {form.inviteStatuses.length === 0
                      ? "案内状況"
                      : form.inviteStatuses.length === 1
                        ? form.inviteStatuses[0]
                        : `${form.inviteStatuses.length}件選択`}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0 bg-card" align="start">
                <div className="p-4 space-y-2">
                  {["未案内", "未回答"].map((status) => (
                      <CheckboxItem
                        key={status}
                        id={`status-${status}`}
                        label={status}
                        checked={form.inviteStatuses.includes(status)}
                        onCheckedChange={(c) => form.toggleInviteStatus(status, c)}
                        labelClassName="text-sm"
                      />
                    ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex items-center h-9">
              <CheckboxItem
                id="include-former-members"
                label="元会員を含む"
                checked={form.includeFormerMembers}
                onCheckedChange={form.setIncludeFormerMembers}
                labelClassName="text-sm"
              />
            </div>
          </div>

          <div className="flex justify-start">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{form.selectedCustomerIds.length}</span>名選択中
            </div>
          </div>

          <div className="rounded-lg bg-card">
            <Table className="[&_th]:py-4 [&_td]:py-4">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      aria-label="すべて選択"
                      checked={
                        form.filteredCustomers.length === 0
                          ? false
                          : form.selectedCustomerIds.length === form.filteredCustomers.length
                            ? true
                            : form.selectedCustomerIds.length > 0
                              ? "indeterminate"
                              : false
                      }
                      disabled={form.filteredCustomers.length === 0}
                      onCheckedChange={() => form.toggleAllCustomers()}
                    />
                  </TableHead>
                  <TableHead>氏名</TableHead>
                  <TableHead>会社名</TableHead>
                  <TableHead>会員区分</TableHead>
                  <TableHead>案内状況</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      検索条件に一致する顧客が見つかりませんでした。
                    </TableCell>
                  </TableRow>
                ) : (
                  form.filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <Checkbox
                          checked={form.selectedCustomerIds.includes(customer.id)}
                          onCheckedChange={() => form.toggleCustomer(customer.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {customer.lastName} {customer.firstName}
                      </TableCell>
                      <TableCell>{customer.company}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap items-center">
                          <CustomerBadges customerCommunities={customer.customerCommunities} memberCategory={customer.memberCategory} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.rsvpStatus === "pending" ? "default" : "outline"}>
                          {customer.rsvpStatus === "pending" ? "未回答" : "未案内"}
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
            <ActionButton onClick={form.handleSelectNext}>次へ</ActionButton>
          </div>
        </div>
      </div>
    );
  }

  // ステップ2: メール文作成
  if (form.step === "customize") {
    return (
      <div className="max-w-4xl space-y-6">
        <PageHeader
          backAction={() => form.setStep("select")}
          title="案内メール送信"
          description="案内メールのタイトルと本文を編集できます。"
        />

        <StepIndicator currentStep={form.step} />

        <div className="space-y-6">
          <div className="space-y-2">
            <SectionHeading>メール文作成</SectionHeading>
            <p className="text-sm text-muted-foreground">送信するメールのタイトルと本文を編集してください。</p>
          </div>

          <FormField label="メールタイトル">
            <Input value={form.emailTitle} onChange={(e) => form.setEmailTitle(e.target.value)} placeholder="メールタイトルを入力" />
          </FormField>

          <FormField
            label="メール本文"
            description="{RSVP_URL} は送信時に顧客ごとの回答URLに自動置換されます。"
          >
            <Textarea
              value={form.emailBody}
              onChange={(e) => form.setEmailBody(e.target.value)}
              placeholder="メール本文を入力"
              rows={30}
              className="min-h-[480px]"
            />
          </FormField>

          <div className="flex justify-center gap-4 pt-4">
            <ActionButton variant="outline" onClick={() => form.setStep("select")}>
              戻る
            </ActionButton>
            <ActionButton onClick={form.handleCustomizeNext}>次へ</ActionButton>
          </div>
        </div>
      </div>
    );
  }

  // ステップ3: 確認
  if (form.step === "confirm") {
    return (
      <div className="max-w-4xl space-y-6">
        <PageHeader
          backAction={() => form.setStep("customize")}
          title="案内メール送信"
          description="送信内容を確認して、テスト送信または送信を実行してください。"
        />

        <StepIndicator currentStep={form.step} />

        <div className="space-y-6">
          <div className="space-y-4">
            <SectionHeading>送信先</SectionHeading>
            <p className="text-sm text-muted-foreground">{form.selectedCustomers.length}名に送信します</p>
            <div className="space-y-2 text-sm max-h-[300px] overflow-y-auto">
              {form.selectedCustomers.map((customer) => (
                <div key={customer.id}>
                  {customer.lastName} {customer.firstName} (
                  {[customer.email, ...customer.subEmails].filter(Boolean).join(", ")})
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <SectionHeading>メール内容</SectionHeading>
            <div className="space-y-4">
              <div>
                <div className="font-medium mb-2">タイトル:</div>
                <div className="text-sm bg-muted p-3 rounded">{form.emailTitle}</div>
              </div>
              <div>
                <div className="font-medium mb-2">本文:</div>
                <div className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">{form.emailBody}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <ActionButton variant="outline" onClick={() => form.setStep("customize")}>
              戻る
            </ActionButton>
            <ActionButton variant="outline" onClick={form.handleTestSend} disabled={form.isPending}>
              <Mail className="h-4 w-4" />
              テスト送信
            </ActionButton>
            <Dialog open={form.confirmOpen} onOpenChange={form.setConfirmOpen}>
              <DialogTrigger asChild>
                <ActionButton disabled={form.isPending}>
                  <Send className="h-4 w-4" />
                  送信
                </ActionButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>案内メールを送信しますか？</DialogTitle>
                  <DialogDescription>
                    {form.selectedCustomers.length}名に案内メールを送信します。この操作は取り消せません。
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => form.setConfirmOpen(false)}>
                    キャンセル
                  </Button>
                  <Button onClick={form.handleSend} disabled={form.isPending}>
                    {form.isPending ? "送信中..." : "送信する"}
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
