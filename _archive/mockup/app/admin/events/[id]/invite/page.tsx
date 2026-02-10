"use client";

import { useState, useEffect, useMemo, use } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ArrowLeft, Send, Mail, Check, Search, Users, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FormField } from "@/components/ui/form-field";
import { ActionButton } from "@/components/ui/action-button";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import { SectionHeading } from "@/components/ui/section-heading";
import { customers, events, rsvps } from "@/lib/data/mock";
import type { Customer } from "@/lib/types";
import { MEMBER_CATEGORY_LABELS } from "@/lib/constants/common";
import React from "react";
import { cn, getInviteEmailTemplate, formatEventDate } from "@/lib/utils";
import { useAuth } from "@/lib/contexts/auth.context";
import { USER_ROLE_CONFIG } from "@/lib/constants/customer";

type Step = "select" | "customize" | "confirm";

export default function EventInvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { currentAdmin } = useAuth();
  const event = events.find((e) => e.id === id);
  
  const [step, setStep] = useState<Step>("select");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [emailTitle, setEmailTitle] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [memberCategories, setMemberCategories] = useState<("member" | "sponsor" | "observer")[]>([]);
  const [organizations, setOrganizations] = useState<("ベンチャー監査役の会" | "ないかんMeetup" | "AI部会" | "非会員")[]>([]);
  const [auditMemberTypes, setAuditMemberTypes] = useState<("regular" | "online")[]>([]);
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [includeFormerMembers, setIncludeFormerMembers] = useState(false);
  const [inviteStatuses, setInviteStatuses] = useState<string[]>([]);
  const [inviteStatusSearch, setInviteStatusSearch] = useState("");

  // このイベントのRSVPデータを取得
  const eventRsvps = rsvps.filter((r) => r.eventId === id);
  const invitedCustomerIds = new Set(eventRsvps.map((r) => r.customerId));

  // デフォルトのメールタイトルと本文を設定
  useEffect(() => {
    if (event) {
      const template = getInviteEmailTemplate({
        title: event.title,
        description: event.description,
        date: event.date,
        timetable: (event as any).timetable,
        location: event.location,
        note: (event as any).note,
      });
      setEmailTitle(template.title);
      setEmailBody(template.body);
    }
  }, [event]);

  const handleSelectNext = () => {
    if (selectedCustomers.length === 0) {
      toast.error("案内する顧客を選択してください");
      return;
    }
    setStep("customize");
  };

  const handleCustomizeNext = () => {
    if (!emailTitle || !emailBody) {
      toast.error("メールタイトルと本文を入力してください");
      return;
    }
    setStep("confirm");
  };

  const handleTestSend = () => {
    toast.success("テストメールを送信しました");
  };

  const handleSend = () => {
    toast.success(`${selectedCustomers.length}名に案内メールを送信しました`);
    router.push(`/admin/events/${id}`);
  };

  const toggleCustomer = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleAllCustomers = () => {
    if (selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map((c) => c.id));
    }
  };


  const handleMemberCategoryChange = (category: "member" | "sponsor" | "observer", checked: boolean) => {
    if (checked) {
      setMemberCategories([...memberCategories, category]);
    } else {
      setMemberCategories(memberCategories.filter((c) => c !== category));
      if (category === "member") {
        setAuditMemberTypes([]);
        setPremiumOnly(false);
      }
    }
  };

  const handleOrganizationChange = (org: "ベンチャー監査役の会" | "ないかんMeetup" | "AI部会" | "非会員", checked: boolean) => {
    if (checked) {
      setOrganizations([...organizations, org]);
    } else {
      setOrganizations(organizations.filter((o) => o !== org));
      if (org === "ベンチャー監査役の会") {
        setAuditMemberTypes([]);
        setPremiumOnly(false);
      }
      // コミュニティを外した場合、会員区分もリセット
      if (org !== "非会員") {
        setMemberCategories([]);
      }
    }
  };

  const handleAuditMemberTypeChange = (type: "regular" | "online", checked: boolean) => {
    if (checked) {
      setAuditMemberTypes([...auditMemberTypes, type]);
    } else {
      setAuditMemberTypes(auditMemberTypes.filter((t) => t !== type));
    }
  };

  const getFilterDisplayText = () => {
    if (organizations.length === 0) return "コミュニティ";
    
    const parts: string[] = [];
    
    if (organizations.length === 1) {
      parts.push(organizations[0]);
    } else {
      parts.push(`${organizations.length}件選択`);
    }
    
    // 会員区分が選択されている場合（コミュニティを選択している場合のみ）
    if (memberCategories.length > 0 && organizations.length > 0 && !organizations.includes("非会員")) {
      const categoryLabels: string[] = [];
      memberCategories.forEach((cat) => {
        categoryLabels.push(MEMBER_CATEGORY_LABELS[cat]);
      });
      parts.push(`(${categoryLabels.join("・")})`);
    }
    
    if (organizations.includes("ベンチャー監査役の会") && auditMemberTypes.length > 0) {
      if (auditMemberTypes.length === 1) {
        const typeLabel = auditMemberTypes[0] === "regular" ? "正会員" : "オンライン会員";
        parts.push(typeLabel);
      } else {
        parts.push(`${auditMemberTypes.length}件`);
      }
    }
    
    if (premiumOnly) {
      parts.push("プレミアム");
    }

    if (includeFormerMembers) {
      parts.push("元会員を含む");
    }
    
    const result = parts.join(" ");
    if (result.length > 20) {
      const totalSelections = organizations.length + memberCategories.length + auditMemberTypes.length + (premiumOnly ? 1 : 0) + (includeFormerMembers ? 1 : 0);
      return `${totalSelections}件選択`;
    }
    
    return result || "コミュニティ";
  };

  const handleInviteStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setInviteStatuses([...inviteStatuses, status]);
    } else {
      setInviteStatuses(inviteStatuses.filter((s) => s !== status));
    }
  };

  // 顧客をフィルタリングし、検索条件で絞り込む
  const filteredCustomers = useMemo(() => {
    const filtered = customers
      .map((customer) => ({
        ...customer,
        isInvited: invitedCustomerIds.has(customer.id),
      }))
      .filter((customer) => {
        // 管理者の権限に基づくフィルタリング（システム的な制約）
        if (currentAdmin?.role === "community_admin" && currentAdmin.communityScopes) {
          // 非会員は特権管理者のみが表示できる
          if (customer.communities.length === 0) {
            return false;
          }
          // 管理者の権限範囲内のコミュニティに所属している顧客のみを表示
          const hasAccess = customer.communities.some((community) =>
            currentAdmin.communityScopes!.includes(community as "ベンチャー監査役の会" | "ないかんMeetup" | "AI部会")
          );
          if (!hasAccess) {
            return false;
          }
        }

        // フリーワード検索
        const matchesKeyword =
          searchKeyword === "" ||
          customer.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          customer.company?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchKeyword.toLowerCase());

        // 所属コミュニティフィルタ（ベンチャー監査役の会、ないかんMeetup、非会員）
        let matchesOrganizations = true;
        if (organizations.length > 0) {
          const hasNonMember = organizations.includes("非会員");
          const hasOrganizations = organizations.some((org) => {
            if (org === "ベンチャー監査役の会") {
              // 元会員を含む場合は、脱退者もヒットさせる
              if (includeFormerMembers && customer.auditResignedAt) {
                return true;
              }
              return customer.communities.includes("ベンチャー監査役の会") && !customer.auditResignedAt;
            }
            if (org === "ないかんMeetup") {
              // 元会員を含む場合は、脱退者もヒットさせる
              if (includeFormerMembers && customer.naikanResignedAt) {
                return true;
              }
              return customer.communities.includes("ないかんMeetup") && !customer.naikanResignedAt;
            }
            if (org === "AI部会") {
              // 元会員を含む場合は、脱退者もヒットさせる
              if (includeFormerMembers && customer.aiResignedAt) {
                return true;
              }
              return customer.communities.includes("AI部会") && !customer.aiResignedAt;
            }
            return false;
          });
          
          // 非会員の場合（communitiesが空配列）
          if (customer.communities.length === 0) {
            matchesOrganizations = hasNonMember;
          } else {
            // コミュニティに所属している場合
            matchesOrganizations = hasOrganizations;
          }
        } else {
          // コミュニティフィルタがない場合（デフォルト）、全て表示（非会員含む）
          matchesOrganizations = true;
        }

        // 会員区分フィルタ（コミュニティを選択した場合のみ適用、チェックがない場合はすべて表示）
        let matchesMemberCategory = true;
        if (memberCategories.length > 0 && organizations.length > 0 && !organizations.includes("非会員")) {
          // コミュニティを選択している場合のみ会員区分でフィルタ
          matchesMemberCategory = customer.memberCategory ? memberCategories.includes(customer.memberCategory) : false;
        }

        // ベンチャー監査役の会の会員種別フィルタ
        let matchesAuditMemberType = true;
        if (organizations.includes("ベンチャー監査役の会") && auditMemberTypes.length > 0) {
          if (memberCategories.length === 0) {
            matchesAuditMemberType = 
              (customer.memberCategory === "member" && customer.auditMemberType && auditMemberTypes.includes(customer.auditMemberType)) ||
              (customer.memberCategory === "sponsor");
          } else if (memberCategories.includes("member") && !memberCategories.includes("sponsor")) {
            matchesAuditMemberType = customer.auditMemberType ? auditMemberTypes.includes(customer.auditMemberType) : false;
          } else if (memberCategories.includes("sponsor") && !memberCategories.includes("member")) {
            matchesAuditMemberType = true;
          } else {
            matchesAuditMemberType = 
              (customer.memberCategory === "member" && customer.auditMemberType && auditMemberTypes.includes(customer.auditMemberType)) ||
              (customer.memberCategory === "sponsor");
          }
        }

        // プレミアム会員フィルタ
        let matchesPremium = true;
        if (premiumOnly) {
          matchesPremium = customer.auditMemberPremium === true;
        }

        // 元会員フィルタ（全コミュニティ脱退済みの顧客を除外）
        // includeFormerMembersがOFFの場合、全脱退者を除外
        let matchesFormerMember = true;

        if (!includeFormerMembers && customer.communities.length > 0) {
          const allResigned = customer.communities.every((community) => {
            if (community === "ベンチャー監査役の会") return !!customer.auditResignedAt;
            if (community === "ないかんMeetup") return !!customer.naikanResignedAt;
            if (community === "AI部会") return !!customer.aiResignedAt;
            return false;
          });
          if (allResigned) matchesFormerMember = false;
        }

        // 案内状況フィルタ（チェックがない場合はすべて表示）
        const matchesInviteStatus =
          inviteStatuses.length === 0 ||
          inviteStatuses.some((status) => {
            if (status === "案内済み") return customer.isInvited;
            if (status === "未案内") return !customer.isInvited;
            return true;
          });

        return matchesKeyword && matchesOrganizations && matchesMemberCategory && matchesAuditMemberType && matchesPremium && matchesFormerMember && matchesInviteStatus;
      });

    return filtered;
  }, [currentAdmin, searchKeyword, memberCategories, organizations, auditMemberTypes, premiumOnly, inviteStatuses, invitedCustomerIds]);

  // ステップインジケーターコンポーネント
  const StepIndicator = () => {
    const steps = [
      { key: "select", label: "案内者を選択", number: 1 },
      { key: "customize", label: "メール文作成", number: 2 },
      { key: "confirm", label: "確認", number: 3 },
      { key: "send", label: "送信", number: 4 },
    ];

    const getStepStatus = (stepKey: string) => {
      const currentIndex = steps.findIndex((s) => s.key === step);
      const stepIndex = steps.findIndex((s) => s.key === stepKey);
      
      if (stepKey === "send") {
        return step === "confirm" ? "current" : "upcoming";
      }
      
      // 現在のステップもcompletedとして表示（チェックマークを表示）
      if (stepIndex <= currentIndex) return "completed";
      return "upcoming";
    };

    return (
      <div className="flex items-center justify-between w-full mb-6">
        {steps.map((stepItem) => {
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
                {status === "completed" ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{stepItem.number}</span>
                )}
              </div>
              <div
                className={cn(
                  "text-sm font-medium text-center",
                  status === "current" && "text-foreground",
                  status === "completed" && "text-muted-foreground",
                  status === "upcoming" && "text-muted-foreground"
                )}
              >
                {stepItem.label}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!event) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">イベントが見つかりませんでした。</p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/admin/events">イベント一覧に戻る</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ステップ1: 案内する人を選ぶ
  if (step === "select") {
    return (
      <div className="max-w-4xl space-y-6">
        <PageHeader
          backHref={`/admin/events/${id}`}
          title="案内メール送信"
          description="案内メールを送信する顧客を選択してください。"
        />
        
        <StepIndicator />

        <div className="space-y-4">
          <div className="space-y-2">
            <SectionHeading>案内者を選択</SectionHeading>
            <p className="text-sm text-muted-foreground">
              未案内の顧客を選択して案内メールを送信します。
              <br/>
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
                  <Button
                    variant="outline"
                    className="w-[280px] justify-between h-9 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate">
                        {getFilterDisplayText()}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0 bg-card" align="start">
                  <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                    {/* コミュニティ選択（複数選択可能） */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">コミュニティ</Label>
                      <div className="space-y-2">
                        {/* 特権管理者またはベンチャー監査役の会の権限がある場合のみ表示 */}
                        {(currentAdmin?.role === "super" ||
                          (currentAdmin?.role === "community_admin" &&
                           currentAdmin.communityScopes?.includes("ベンチャー監査役の会"))) && (
                          <CheckboxItem
                            id="org-audit-invite"
                            label="ベンチャー監査役の会"
                            checked={organizations.includes("ベンチャー監査役の会")}
                            onCheckedChange={(checked) =>
                              handleOrganizationChange("ベンチャー監査役の会", checked)
                            }
                          />
                        )}
                        {/* 特権管理者またはないかんMeetupの権限がある場合のみ表示 */}
                        {(currentAdmin?.role === "super" ||
                          (currentAdmin?.role === "community_admin" &&
                           currentAdmin.communityScopes?.includes("ないかんMeetup"))) && (
                          <CheckboxItem
                            id="org-naikan-invite"
                            label="ないかんMeetup"
                            checked={organizations.includes("ないかんMeetup")}
                            onCheckedChange={(checked) =>
                              handleOrganizationChange("ないかんMeetup", checked)
                            }
                          />
                        )}
                        {/* 特権管理者またはAI部会の権限がある場合のみ表示 */}
                        {(currentAdmin?.role === "super" ||
                          (currentAdmin?.role === "community_admin" &&
                           currentAdmin.communityScopes?.includes("AI部会"))) && (
                          <CheckboxItem
                            id="org-ai-invite"
                            label="AI部会"
                            checked={organizations.includes("AI部会")}
                            onCheckedChange={(checked) =>
                              handleOrganizationChange("AI部会", checked)
                            }
                          />
                        )}
                        {/* 非会員は特権管理者のみ表示 */}
                        {currentAdmin?.role === "super" && (
                          <CheckboxItem
                            id="org-non-member-invite"
                            label="非会員"
                            checked={organizations.includes("非会員")}
                            onCheckedChange={(checked) =>
                              handleOrganizationChange("非会員", checked)
                            }
                          />
                        )}
                      </div>
                    </div>

                    {/* 会員区分選択（コミュニティを選択した場合のみ表示） */}
                    {(organizations.includes("ベンチャー監査役の会") || organizations.includes("ないかんMeetup")) && (
                      <div className="space-y-2 border-t pt-4">
                        <Label className="text-sm font-semibold">会員区分</Label>
                        <div className="space-y-2">
                          <CheckboxItem
                            id="member-member-invite"
                            label="会員"
                            checked={memberCategories.includes("member")}
                            onCheckedChange={(checked) =>
                              handleMemberCategoryChange("member", checked)
                            }
                          />
                          <CheckboxItem
                            id="member-sponsor-invite"
                            label="スポンサー"
                            checked={memberCategories.includes("sponsor")}
                            onCheckedChange={(checked) =>
                              handleMemberCategoryChange("sponsor", checked)
                            }
                          />
                          <CheckboxItem
                            id="member-observer-invite"
                            label="オブザーバー"
                            checked={memberCategories.includes("observer")}
                            onCheckedChange={(checked) =>
                              handleMemberCategoryChange("observer", checked)
                            }
                          />
                        </div>
                      </div>
                    )}

                    {/* ベンチャー監査役の会の会員種別（ベンチャー監査役の会を選択している場合のみ表示） */}
                    {organizations.includes("ベンチャー監査役の会") && (
                      <div className="space-y-2 border-t pt-4">
                        <Label className="text-sm font-semibold">ベンチャー監査役の会 会員種別</Label>
                        <div className="space-y-2">
                          <CheckboxItem
                            id="audit-regular-invite"
                            label="正会員"
                            checked={auditMemberTypes.includes("regular")}
                            onCheckedChange={(checked) =>
                              handleAuditMemberTypeChange("regular", checked)
                            }
                          />
                          <CheckboxItem
                            id="audit-online-invite"
                            label="オンライン会員"
                            checked={auditMemberTypes.includes("online")}
                            onCheckedChange={(checked) =>
                              handleAuditMemberTypeChange("online", checked)
                            }
                          />
                        </div>
                      </div>
                    )}

                    {/* プレミアム会員（ベンチャー監査役の会を選択している場合のみ表示） */}
                    {organizations.includes("ベンチャー監査役の会") && (
                      <div className="space-y-2 border-t pt-4">
                        <CheckboxItem
                          id="premium-invite"
                          label="プレミアム会員のみ"
                          checked={premiumOnly}
                          onCheckedChange={(checked) => setPremiumOnly(checked)}
                        />
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[200px] justify-between h-9 text-sm"
                  >
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
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="案内状況を検索"
                        value={inviteStatusSearch}
                        onChange={(e) => setInviteStatusSearch(e.target.value)}
                        className="pl-8 h-9 text-sm"
                      />
                    </div>
                  </div>
                  <div className="p-2 max-h-[300px] overflow-y-auto">
                    {[
                      { value: "案内済み", label: "案内済み" },
                      { value: "未案内", label: "未案内" },
                    ]
                      .filter((status) =>
                        status.label
                          .toLowerCase()
                          .includes(inviteStatusSearch.toLowerCase())
                      )
                      .map((status) => (
                        <div
                          key={status.value}
                          className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                          onClick={() =>
                            handleInviteStatusChange(
                              status.value,
                              !inviteStatuses.includes(status.value)
                            )
                          }
                        >
                          <Checkbox
                            checked={inviteStatuses.includes(status.value)}
                            onCheckedChange={(checked) =>
                              handleInviteStatusChange(status.value, checked === true)
                            }
                          />
                          <span className="text-sm">{status.label}</span>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="flex items-center h-9">
                <CheckboxItem
                  id="include-former-members"
                  label="元会員を含む"
                  checked={includeFormerMembers}
                  onCheckedChange={(checked) => setIncludeFormerMembers(checked)}
                />
              </div>
            </div>

          <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
            <div>
              <span className="font-medium">{selectedCustomers.length}名</span> 選択中
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllCustomers}
              disabled={filteredCustomers.length === 0}
            >
              {selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0 ? "すべて解除" : "すべて選択"}
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
                        checked={selectedCustomers.includes(customer.id)}
                        onCheckedChange={() => toggleCustomer(customer.id)}
                      />
                    </TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.company}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap items-center">
                        {(() => {
                          const badges: React.ReactElement[] = [];
                          
                          // 非会員の判定（communitiesが空配列）
                          if (customer.communities.length === 0) {
                            badges.push(
                              <Badge key="non-member" variant="non-member">
                                非会員
                              </Badge>
                            );
                          } else if (customer.memberCategory === "member") {
                            const hasAudit = customer.communities.includes("ベンチャー監査役の会");
                            const hasNaikan = customer.communities.includes("ないかんMeetup");
                            const hasAi = customer.communities.includes("AI部会");

                            // ベンチャー監査役の会のバッジ
                            if (hasAudit) {
                              if (customer.auditResignedAt) {
                                badges.push(
                                  <Badge key="audit-member" variant="destructive-outline">
                                    ベンチャー監査役の会(退会)
                                  </Badge>
                                );
                              } else {
                                const auditType = customer.auditMemberType === "regular" ? "正会員" : "オンライン会員";
                                badges.push(
                                  <Badge key="audit-member" variant="audit">
                                    ベンチャー監査役の会({auditType})
                                  </Badge>
                                );
                              }
                            }
                            // ないかんMeetupのバッジ
                            if (hasNaikan) {
                              if (customer.naikanResignedAt) {
                                badges.push(
                                  <Badge key="naikan-member" variant="destructive-outline">
                                    ないかんMeetup(退会)
                                  </Badge>
                                );
                              } else {
                                badges.push(
                                  <Badge key="naikan-member" variant="naikan">
                                    ないかんMeetup(会員)
                                  </Badge>
                                );
                              }
                            }
                            // AI部会のバッジ
                            if (hasAi) {
                              if (customer.aiResignedAt) {
                                badges.push(
                                  <Badge key="ai-member" variant="destructive-outline">
                                    AI部会(退会)
                                  </Badge>
                                );
                              } else {
                                badges.push(
                                  <Badge key="ai-member" variant="ai">
                                    AI部会(会員)
                                  </Badge>
                                );
                              }
                            }

                            // プレミアム会員バッジ
                            if (customer.auditMemberPremium) {
                              badges.push(
                                <Badge key="premium" variant={USER_ROLE_CONFIG.premium.variant as any}>
                                  {USER_ROLE_CONFIG.premium.label}
                                </Badge>
                              );
                            }
                          } else if (customer.memberCategory === "sponsor") {
                            if (customer.communities.includes("ベンチャー監査役の会")) {
                              if (customer.auditResignedAt) {
                                badges.push(
                                  <Badge key="sponsor-audit" variant="destructive-outline">
                                    ベンチャー監査役の会(退会)
                                  </Badge>
                                );
                              } else {
                                badges.push(
                                  <Badge key="sponsor-audit" variant="audit">
                                    ベンチャー監査役の会(スポンサー)
                                  </Badge>
                                );
                              }
                            }
                            if (customer.communities.includes("ないかんMeetup")) {
                              if (customer.naikanResignedAt) {
                                badges.push(
                                  <Badge key="sponsor-naikan" variant="destructive-outline">
                                    ないかんMeetup(退会)
                                  </Badge>
                                );
                              } else {
                                badges.push(
                                  <Badge key="sponsor-naikan" variant="naikan">
                                    ないかんMeetup(スポンサー)
                                  </Badge>
                                );
                              }
                            }
                            if (customer.communities.includes("AI部会")) {
                              if (customer.aiResignedAt) {
                                badges.push(
                                  <Badge key="sponsor-ai" variant="destructive-outline">
                                    AI部会(退会)
                                  </Badge>
                                );
                              } else {
                                badges.push(
                                  <Badge key="sponsor-ai" variant="ai">
                                    AI部会(スポンサー)
                                  </Badge>
                                );
                              }
                            }
                          } else if (customer.memberCategory === "observer") {
                            if (customer.communities.includes("ベンチャー監査役の会")) {
                              if (customer.auditResignedAt) {
                                badges.push(
                                  <Badge key="observer-audit" variant="destructive-outline">
                                    ベンチャー監査役の会(退会)
                                  </Badge>
                                );
                              } else {
                                badges.push(
                                  <Badge key="observer-audit" variant="audit">
                                    ベンチャー監査役の会(オブザーバー)
                                  </Badge>
                                );
                              }
                            }
                            if (customer.communities.includes("ないかんMeetup")) {
                              if (customer.naikanResignedAt) {
                                badges.push(
                                  <Badge key="observer-naikan" variant="destructive-outline">
                                    ないかんMeetup(退会)
                                  </Badge>
                                );
                              } else {
                                badges.push(
                                  <Badge key="observer-naikan" variant="naikan">
                                    ないかんMeetup(オブザーバー)
                                  </Badge>
                                );
                              }
                            }
                            if (customer.communities.includes("AI部会")) {
                              if (customer.aiResignedAt) {
                                badges.push(
                                  <Badge key="observer-ai" variant="destructive-outline">
                                    AI部会(退会)
                                  </Badge>
                                );
                              } else {
                                badges.push(
                                  <Badge key="observer-ai" variant="ai">
                                    AI部会(オブザーバー)
                                  </Badge>
                                );
                              }
                            }
                          }
                          
                          return badges.length > 0 ? badges : null;
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          customer.isInvited ? "default" : "outline"
                        }
                      >
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
              <Link href={`/admin/events/${id}`}>キャンセル</Link>
            </ActionButton>
            <ActionButton onClick={handleSelectNext}>
              次へ
            </ActionButton>
          </div>
        </div>
      </div>
    );
  }

  // ステップ2: タイトルとメール文面をカスタマイズ
  if (step === "customize") {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setStep("select")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">案内メール送信</h1>
            <p className="text-sm text-muted-foreground">
              案内メールのタイトルと本文を編集できます。
            </p>
          </div>
        </div>
        
        <StepIndicator />

        <div className="space-y-6">
          <div className="space-y-2">
            <SectionHeading>メール文作成</SectionHeading>
            <p className="text-sm text-muted-foreground">
              送信するメールのタイトルと本文を編集してください。
            </p>
          </div>

          <FormField label="メールタイトル">
            <Input
              value={emailTitle}
              onChange={(e) => setEmailTitle(e.target.value)}
              placeholder="メールタイトルを入力"
            />
          </FormField>

          <FormField label="メール本文">
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
            <ActionButton onClick={handleCustomizeNext}>
              次へ
            </ActionButton>
          </div>
        </div>
      </div>
    );
  }

  // ステップ3: 確認画面
  if (step === "confirm") {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setStep("customize")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">案内メール送信</h1>
            <p className="text-sm text-muted-foreground">
              送信内容を確認して、テスト送信または送信を実行してください。
            </p>
          </div>
        </div>
        
        <StepIndicator />

        <div className="space-y-6">
          <div className="space-y-4">
            <SectionHeading>送信先</SectionHeading>
            <p className="text-sm text-muted-foreground">
              {selectedCustomers.length}名に送信します
            </p>
            <div className="space-y-2 text-sm">
              {selectedCustomers.map((customerId) => {
                const customer = customers.find((c) => c.id === customerId);
                return customer ? (
                  <div key={customerId}>
                    {customer.name} ({customer.email})
                  </div>
                ) : null;
              })}
            </div>
          </div>

          <div className="space-y-4">
            <SectionHeading>メール内容</SectionHeading>
            <p className="text-sm text-muted-foreground">
              送信するメールのタイトルと本文です
            </p>
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
            <ActionButton variant="outline" onClick={handleTestSend}>
              <Mail className="h-4 w-4" />
              テスト送信
            </ActionButton>
            <ActionButton onClick={handleSend}>
              <Send className="h-4 w-4" />
              送信
            </ActionButton>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
