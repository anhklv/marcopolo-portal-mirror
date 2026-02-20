"use client";

import { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Search, Users, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FormField } from "@/components/ui/form-field";
import { ActionButton } from "@/components/ui/action-button";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import { SectionHeading } from "@/components/ui/section-heading";
import { filterCustomers, FilterableCustomer } from "@/lib/helpers/customer-filter";
import { getCustomerBadges } from "@/lib/helpers/customer-detail";
import type { CustomerCommunityForBadge } from "@/lib/helpers/customer-detail";
import { cn } from "@/lib/utils";

// 必要な型定義（Prismaの型とDate->string変換後の型）
// 実際にはもっと厳密に定義すべきだが、ここではフィルタに必要なプロパティを重視
interface SerializedCustomer extends FilterableCustomer {
  isInvited?: boolean; // フロントエンドでの拡張
}

interface InviteEvent {
  id: number;
  title: string;
  rsvps?: { customerId: number }[];
}

interface InviteFormProps {
  event: InviteEvent;
  customers: SerializedCustomer[];
  currentUserRole: "super" | "community_admin";
  communities: { id: number; code: string; name: string }[];
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
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
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
                status === "current" && "bg-primary text-primary-foreground border-primary",
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

export function InviteForm({ event, customers, currentUserRole, communities }: InviteFormProps) {
  const router = useRouter();
  
  const [step, setStep] = useState<Step>("select");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);
  const [emailTitle, setEmailTitle] = useState(`【イベント案内】${event.title}`);
  const [emailBody, setEmailBody] = useState(""); // 初期値は空、必要ならテンプレート展開
  const [searchKeyword, setSearchKeyword] = useState("");
  const [memberCategories, _toggleMemberCategory] = useArrayToggle<string>();
  const [selectedCommunityIds, toggleCommunityId] = useArrayToggle<number>();
  const [auditMemberTypes, _toggleAuditMemberType] = useArrayToggle<string>();
  const [premiumOnly, _setPremiumOnly] = useState(false);
  const [includeFormerMembers, setIncludeFormerMembers] = useState(false);
  const [includeNonMemberFilter, setIncludeNonMemberFilter] = useState(false);
  const [inviteStatuses, toggleInviteStatus] = useArrayToggle<string>();
  const [inviteStatusSearch, setInviteStatusSearch] = useState("");

  // 招待済みIDのセット
  const invitedCustomerIds = useMemo(() => {
    const ids = new Set<number>();
    if (event.rsvps) {
      event.rsvps.forEach((r) => ids.add(r.customerId));
    }
    return ids;
  }, [event.rsvps]);

  // 顧客リストに招待済み情報を付与
  const customersWithStatus = useMemo(() => {
    return customers.map(c => ({
      ...c,
      isInvited: invitedCustomerIds.has(c.id)
    }));
  }, [customers, invitedCustomerIds]);

  // フィルタリング実行
  const filteredCustomers = useMemo(() => {
    // まずヘルパーで基本フィルタリング
    const baseFiltered = filterCustomers(customersWithStatus, {
      keyword: searchKeyword,
      communityIds: selectedCommunityIds,
      memberCategories,
      auditMemberTypes,
      premiumOnly,
      includeFormerMembers,
      includeNonMemberFilter,
    });

    // 追加フィルタリング（招待状況）
    return baseFiltered.filter(customer => {
      // 案内状況フィルタ
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
    inviteStatuses
  ]);

  const handleSelectNext = () => {
    if (selectedCustomerIds.length === 0) {
      toast.error("案内する顧客を選択してください");
      return;
    }
    setStep("customize");
  };

  const handleCustomizeNext = () => {
    if (!emailTitle) {
      toast.error("メールタイトルを入力してください");
      return;
    }
    setStep("confirm");
  };

  const _handleTestSend = () => {
    toast.success("テストメールを送信しました");
  };

  const handleSend = () => {
    // ここで実際にAPIを叩く処理が入る（Server Actionなど）
    toast.success(`${selectedCustomerIds.length}名に案内メールを送信しました`);
    router.push(`/admin/events/${event.id}`);
  };

  const toggleCustomer = (customerId: number) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleAllCustomers = () => {
    if (selectedCustomerIds.length === filteredCustomers.length && filteredCustomers.length > 0) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(filteredCustomers.map((c) => c.id));
    }
  };

  // 表示用テキスト生成
  const getFilterDisplayText = () => {
    const totalFilters = selectedCommunityIds.length + (includeNonMemberFilter ? 1 : 0);
    
    if (totalFilters === 0) return "コミュニティ";

    const parts: string[] = [];
    
    // 選択されたコミュニティ名を取得
    communities
      .filter(c => selectedCommunityIds.includes(c.id))
      .forEach(c => parts.push(c.name));
    
    if (includeNonMemberFilter) parts.push("非会員");

    if (parts.length === 1) return parts[0];
    
    // 簡易表示
    return `${parts.length}件選択`;
  };

  // バッジレンダリング
  const renderBadges = (customer: SerializedCustomer) => {
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
                        {/* 特権管理者のみ非会員表示 */}
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
                    
                    {/* 会員区分フィルタなどは必要に応じて実装（今回は省略または追加実装） */}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-between h-9 text-sm">
                    <span>
                      {inviteStatuses.length === 0 ? "案内状況" : `${inviteStatuses.length}件選択`}
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
                     {["案内済み", "未案内"].filter(s => s.includes(inviteStatusSearch)).map(status => (
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
              {selectedCustomerIds.length === filteredCustomers.length && filteredCustomers.length > 0 ? "すべて解除" : "すべて選択"}
            </Button>
          </div>

          <div className="rounded-lg border bg-card">
            <Table>
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
                    <TableCell>{customer.lastName} {customer.firstName}</TableCell>
                    <TableCell>{customer.company}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap items-center">
                        {renderBadges(customer)}
                      </div>
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

  if (step === "customize") {
    // メール編集画面（簡易実装）
    return (
       <div className="max-w-4xl space-y-6">
         {/* ...ヘッダーなど... */}
         <StepIndicator currentStep={step} />
         <div className="space-y-6">
            <FormField label="メールタイトル">
               <Input value={emailTitle} onChange={(e) => setEmailTitle(e.target.value)} />
            </FormField>
            <FormField label="メール本文">
               <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={20} />
            </FormField>
            <div className="flex justify-center gap-4 pt-4">
               <Button variant="outline" onClick={() => setStep("select")}>戻る</Button>
               <Button onClick={handleCustomizeNext}>次へ</Button>
            </div>
         </div>
       </div>
    );
  }

  if (step === "confirm") {
    // 確認画面（簡易実装）
    return (
       <div className="max-w-4xl space-y-6">
         <StepIndicator currentStep={step} />
         <div className="space-y-6">
            <h2 className="text-xl font-bold">確認</h2>
            <p>{selectedCustomerIds.length}名に送信します。</p>
            <div className="flex justify-center gap-4 pt-4">
               <Button variant="outline" onClick={() => setStep("customize")}>戻る</Button>
               <Button onClick={handleSend}>送信</Button>
            </div>
         </div>
       </div>
    );
  }

  return null;
}
