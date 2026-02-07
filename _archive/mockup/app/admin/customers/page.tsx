"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { customers, getCommunityDisplayName } from "@/lib/data/mock";
import type { CommunityScope } from "@/lib/types";
import { MEMBER_CATEGORY_LABELS } from "@/lib/constants/common";
import { Search, Users, ChevronDown, Download, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import React from "react";
import { useAuth } from "@/lib/contexts/auth.context";
import { USER_ROLE_CONFIG } from "@/lib/constants/customer";

type MemberCategoryFilter = "member" | "sponsor" | "observer";
type OrganizationFilter = "ベンチャー監査役の会" | "ないかんMeetup" | "AI部会" | "非会員";
type AuditMemberTypeFilter = "regular" | "online";

export default function CustomersPage() {
  const router = useRouter();
  const { currentAdmin } = useAuth();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [memberCategories, setMemberCategories] = useState<MemberCategoryFilter[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationFilter[]>([]);
  const [auditMemberTypes, setAuditMemberTypes] = useState<AuditMemberTypeFilter[]>([]);
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [includeFormerMembers, setIncludeFormerMembers] = useState(false);

  const handleMemberCategoryChange = (category: MemberCategoryFilter, checked: boolean) => {
    setMemberCategories((prev) => {
      const hasCategory = prev.includes(category);
      if (checked) {
        return hasCategory ? prev : [...prev, category];
      }
      return hasCategory ? prev.filter((c) => c !== category) : prev;
    });
    // 会員を外した場合、ベンチャー監査役の会の会員種別もリセット
    if (!checked && category === "member") {
      setAuditMemberTypes((prev) => (prev.length > 0 ? [] : prev));
      setPremiumOnly((prev) => (prev ? false : prev));
    }
  };

  const handleOrganizationChange = (org: OrganizationFilter, checked: boolean) => {
    setOrganizations((prev) => {
      const hasOrg = prev.includes(org);
      if (checked) {
        return hasOrg ? prev : [...prev, org];
      }
      return hasOrg ? prev.filter((o) => o !== org) : prev;
    });
    if (!checked) {
      // ベンチャー監査役の会のチェックを外した場合、会員種別もリセット
      if (org === "ベンチャー監査役の会") {
        setAuditMemberTypes((prev) => (prev.length > 0 ? [] : prev));
        setPremiumOnly((prev) => (prev ? false : prev));
      }
      // コミュニティを外した場合、会員区分もリセット
      if (org !== "非会員") {
        setMemberCategories((prev) => (prev.length > 0 ? [] : prev));
      }
    }
  };

  const handleAuditMemberTypeChange = (type: AuditMemberTypeFilter, checked: boolean) => {
    setAuditMemberTypes((prev) => {
      const hasType = prev.includes(type);
      if (checked) {
        return hasType ? prev : [...prev, type];
      }
      return hasType ? prev.filter((t) => t !== type) : prev;
    });
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
    
    const result = parts.join(" ");
    // テキストが長すぎる場合は選択数で表示
    if (result.length > 20) {
      const totalSelections = organizations.length + memberCategories.length + auditMemberTypes.length + (premiumOnly ? 1 : 0);
      return `${totalSelections}件選択`;
    }
    
    return result || "コミュニティ";
  };


  // CSVダウンロード処理
  const handleDownloadCSV = () => {
    // CSVヘッダー
    const headers = [
      "ID",
      "氏名",
      "セイメイ",
      "会社名",
      "メールアドレス",
      "電話番号",
      "会員区分",
      "登録日",
      "備考",
    ];

    // CSVデータ行を生成
    const csvRows = [
      headers.join(","),
      ...filteredCustomers.map((customer) => {
        const row = [
          customer.id,
          customer.name,
          customer.nameKana || "",
          customer.company || "",
          customer.email,
          customer.phone || "",
          getCommunityDisplayName(customer.communities),
          customer.registeredAt,
          customer.note || "",
        ];
        // カンマや改行を含む可能性のある値をダブルクォートで囲む
        return row.map((cell) => {
          const cellStr = String(cell);
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(",");
      }),
    ];

    // CSV文字列を生成
    const csvContent = csvRows.join("\n");

    // BOMを追加してExcelで正しく開けるようにする
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

    // ダウンロードリンクを作成
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `customers_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSVファイルをダウンロードしました");
  };

  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];

    // 管理者権限に応じてフィルタリング
    if (currentAdmin?.role === "community_admin" && currentAdmin.communityScopes) {
      filtered = filtered.filter((c) =>
        c.communities.some((community) =>
          currentAdmin.communityScopes!.includes(community as CommunityScope)
        )
      );
    }

    filtered = filtered.filter((customer) => {
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
            return customer.communities.includes("ベンチャー監査役の会");
          }
          if (org === "ないかんMeetup") {
            return customer.communities.includes("ないかんMeetup");
          }
          if (org === "AI部会") {
            return customer.communities.includes("AI部会");
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
        // コミュニティフィルタがない場合（デフォルト）、非会員は表示しない
        if (customer.communities.length === 0) {
          matchesOrganizations = false;
        }
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
        // ベンチャー監査役の会を選択している場合
        if (memberCategories.length === 0) {
          // 会員区分が未選択（すべて）の場合、正会員とスポンサーの両方を抽出
          matchesAuditMemberType = 
            (customer.memberCategory === "member" && customer.auditMemberType && auditMemberTypes.includes(customer.auditMemberType)) ||
            (customer.memberCategory === "sponsor");
        } else if (memberCategories.includes("member") && !memberCategories.includes("sponsor")) {
          // 会員区分が「会員」のみの場合、指定された会員種別のみ
          matchesAuditMemberType = customer.auditMemberType ? auditMemberTypes.includes(customer.auditMemberType) : false;
        } else if (memberCategories.includes("sponsor") && !memberCategories.includes("member")) {
          // 会員区分が「スポンサー」のみの場合、会員種別のフィルタは適用しない（すべてのスポンサーを抽出）
          matchesAuditMemberType = true;
        } else {
          // 会員とスポンサーの両方が選択されている場合、指定された会員種別またはスポンサー
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

      // 元会員フィルタ（全コミュニティ脱退済みの顧客をデフォルト非表示）
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

      return matchesKeyword && matchesMemberCategory && matchesOrganizations && matchesAuditMemberType && matchesPremium && matchesFormerMember;
    });

    // ソート: ID（昇順）
    return filtered.sort((a, b) => {
      const idA = parseInt(a.id.replace("C", "")) || 0;
      const idB = parseInt(b.id.replace("C", "")) || 0;
      return idA - idB;
    });
  }, [currentAdmin, searchKeyword, memberCategories, organizations, auditMemberTypes, premiumOnly, includeFormerMembers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="顧客管理"
          description="会員・非会員を含むすべての顧客情報を管理します。"
        />
        <Button asChild>
          <Link href="/admin/customers/new">
            <Plus className="h-4 w-4" />
            新規登録
          </Link>
        </Button>
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
              className="w-[280px] justify-between h-9"
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
                      id="org-audit"
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
                      id="org-naikan"
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
                      id="org-ai"
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
                      id="org-non-member"
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
              {(organizations.includes("ベンチャー監査役の会") || organizations.includes("ないかんMeetup") || organizations.includes("AI部会")) && (
                <div className="space-y-2 border-t pt-4">
                  <Label className="text-sm font-semibold">会員区分</Label>
                  <div className="space-y-2">
                    <CheckboxItem
                      id="member-member"
                      label="会員"
                      checked={memberCategories.includes("member")}
                      onCheckedChange={(checked) =>
                        handleMemberCategoryChange("member", checked)
                      }
                    />
                    <CheckboxItem
                      id="member-sponsor"
                      label="スポンサー"
                      checked={memberCategories.includes("sponsor")}
                      onCheckedChange={(checked) =>
                        handleMemberCategoryChange("sponsor", checked)
                      }
                    />
                    <CheckboxItem
                      id="member-observer"
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
                      id="audit-regular"
                      label="正会員"
                      checked={auditMemberTypes.includes("regular")}
                      onCheckedChange={(checked) =>
                        handleAuditMemberTypeChange("regular", checked)
                      }
                    />
                    <CheckboxItem
                      id="audit-online"
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
                    id="premium"
                    label="プレミアム会員のみ"
                    checked={premiumOnly}
                    onCheckedChange={(checked) => setPremiumOnly(checked)}
                  />
                </div>
              )}
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

      <div className="flex justify-end">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredCustomers.length}</span>件
        </div>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>氏名</TableHead>
              <TableHead>会社名</TableHead>
              <TableHead>会員区分</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  検索条件に一致する顧客が見つかりませんでした。
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    router.push(`/admin/customers/${customer.id}`);
                  }}
                >
                  <TableCell>{customer.id}</TableCell>
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
                  <TableCell>{formatDate(customer.registeredAt)}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/customers/${customer.id}/edit`}>編集</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={handleDownloadCSV}>
          <Download className="h-4 w-4" />
          CSVダウンロード
        </Button>
      </div>
    </div>
  );
}
