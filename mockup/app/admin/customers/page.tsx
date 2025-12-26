"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { customers, Customer, MemberFilterValue, getMemberTypeDisplayName } from "@/lib/data/mock";
import { MEMBER_CATEGORY_LABELS } from "@/lib/constants/common";
import { Plus, Search, Users, ChevronDown, Download } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import React from "react";

type MemberCategoryFilter = "non-member" | "member" | "sponsor" | "observer";
type OrganizationFilter = "ベンチャー監査役協会" | "ないかんMeetup";
type AuditMemberTypeFilter = "regular" | "online";

export default function CustomersPage() {
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [memberCategories, setMemberCategories] = useState<MemberCategoryFilter[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationFilter[]>([]);
  const [auditMemberTypes, setAuditMemberTypes] = useState<AuditMemberTypeFilter[]>([]);
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [statuses, setStatuses] = useState<string[]>(["active"]);
  const [statusSearch, setStatusSearch] = useState("");

  const handleMemberCategoryChange = (category: MemberCategoryFilter, checked: boolean) => {
    if (checked) {
      setMemberCategories([...memberCategories, category]);
    } else {
      setMemberCategories(memberCategories.filter((c) => c !== category));
      // 会員を外した場合、ベンチャー監査役協会の会員種別もリセット
      if (category === "member") {
        setAuditMemberTypes([]);
        setPremiumOnly(false);
      }
    }
  };

  const handleOrganizationChange = (org: OrganizationFilter, checked: boolean) => {
    if (checked) {
      setOrganizations([...organizations, org]);
    } else {
      setOrganizations(organizations.filter((o) => o !== org));
      // ベンチャー監査役協会のチェックを外した場合、会員種別もリセット
      if (org === "ベンチャー監査役協会") {
        setAuditMemberTypes([]);
        setPremiumOnly(false);
      }
    }
  };

  const handleAuditMemberTypeChange = (type: AuditMemberTypeFilter, checked: boolean) => {
    if (checked) {
      setAuditMemberTypes([...auditMemberTypes, type]);
    } else {
      setAuditMemberTypes(auditMemberTypes.filter((t) => t !== type));
    }
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setStatuses([...statuses, status]);
    } else {
      setStatuses(statuses.filter((s) => s !== status));
    }
  };

  const getFilterDisplayText = () => {
    if (memberCategories.length === 0 && organizations.length === 0) return "会員区分";
    
    const parts: string[] = [];
    
    if (memberCategories.length === 0 && organizations.length > 0) {
      // 組織のみ選択されている場合
      if (organizations.length === 1) {
        return organizations[0];
      }
      // 複数の組織が選択されている場合は選択数で表示
      return `${organizations.length}件選択`;
    }
    
    if (memberCategories.length > 0) {
      const categoryLabels: string[] = [];
      memberCategories.forEach((cat) => {
        categoryLabels.push(MEMBER_CATEGORY_LABELS[cat]);
      });
      parts.push(categoryLabels.join("・"));
    }
    
    if (organizations.length > 0) {
      if (organizations.length === 1) {
        parts.push(`(${organizations[0]})`);
      } else {
        parts.push(`(${organizations.length}件)`);
      }
    }
    
    if (organizations.includes("ベンチャー監査役協会") && auditMemberTypes.length > 0) {
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
      const totalSelections = memberCategories.length + organizations.length + auditMemberTypes.length + (premiumOnly ? 1 : 0);
      return `${totalSelections}件選択`;
    }
    
    return result || "会員区分";
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
      "ステータス",
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
          getMemberTypeDisplayName(customer.memberTypes),
          customer.status === "active" ? "アクティブ" : "非アクティブ",
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
    const filtered = customers.filter((customer) => {
      // フリーワード検索
      const matchesKeyword =
        searchKeyword === "" ||
        customer.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        customer.company?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchKeyword.toLowerCase());

      // 組織フィルタ（最優先：組織を選択した場合は、その組織に関連するすべての会員区分を抽出）
      let matchesOrganizations = true;
      if (organizations.length > 0) {
        matchesOrganizations = organizations.some((org) => {
          if (org === "ベンチャー監査役協会") {
            return customer.memberTypes.includes("ベンチャー監査役協会");
          }
          if (org === "ないかんMeetup") {
            return customer.memberTypes.includes("ないかんMeetup");
          }
          return false;
        });
      }

      // 会員区分フィルタ（チェックがない場合はすべて表示）
      let matchesMemberCategory = true;
      if (memberCategories.length > 0) {
        matchesMemberCategory = memberCategories.includes(customer.memberCategory);
      }

      // ベンチャー監査役協会の会員種別フィルタ
      let matchesAuditMemberType = true;
      if (organizations.includes("ベンチャー監査役協会") && auditMemberTypes.length > 0) {
        // ベンチャー監査役協会を選択している場合
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

      // ステータスフィルタ
      const matchesStatus =
        statuses.length === 0 || statuses.includes(customer.status);

      return matchesKeyword && matchesMemberCategory && matchesOrganizations && matchesAuditMemberType && matchesPremium && matchesStatus;
    });

    // ソート: ID（昇順）、ステータス（activeが先）
    return filtered.sort((a, b) => {
      // まずIDでソート（数値として比較）
      const idA = parseInt(a.id.replace("C", "")) || 0;
      const idB = parseInt(b.id.replace("C", "")) || 0;
      if (idA !== idB) {
        return idA - idB;
      }
      // IDが同じ場合はステータスでソート（activeが先）
      if (a.status === "active" && b.status === "inactive") return -1;
      if (a.status === "inactive" && b.status === "active") return 1;
      return 0;
    });
  }, [searchKeyword, memberCategories, organizations, auditMemberTypes, premiumOnly, statuses]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">顧客管理</h1>
          <p className="text-muted-foreground">
            会員・非会員を含むすべての顧客情報を管理します。
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/customers/new">
              <Plus className="h-4 w-4" />
              新規登録
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="名前、会社名、メールアドレスで検索..."
            className="pl-9 h-10"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[280px] justify-between h-10"
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
          <PopoverContent className="w-[320px] p-0 bg-white" align="start">
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {/* 組織選択（最優先） */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">組織</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="org-audit"
                      checked={organizations.includes("ベンチャー監査役協会")}
                      onCheckedChange={(checked) =>
                        handleOrganizationChange("ベンチャー監査役協会", checked === true)
                      }
                    />
                    <Label htmlFor="org-audit" className="cursor-pointer text-sm">ベンチャー監査役協会</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="org-naikan"
                      checked={organizations.includes("ないかんMeetup")}
                      onCheckedChange={(checked) =>
                        handleOrganizationChange("ないかんMeetup", checked === true)
                      }
                    />
                    <Label htmlFor="org-naikan" className="cursor-pointer text-sm">ないかんMeetup</Label>
                  </div>
                </div>
              </div>

              {/* 会員区分選択 */}
              <div className="space-y-2 border-t pt-4">
                <Label className="text-sm font-semibold">会員区分</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="member-non-member"
                      checked={memberCategories.includes("non-member")}
                      onCheckedChange={(checked) =>
                        handleMemberCategoryChange("non-member", checked === true)
                      }
                    />
                    <Label htmlFor="member-non-member" className="cursor-pointer text-sm">非会員</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="member-member"
                      checked={memberCategories.includes("member")}
                      onCheckedChange={(checked) =>
                        handleMemberCategoryChange("member", checked === true)
                      }
                    />
                    <Label htmlFor="member-member" className="cursor-pointer text-sm">会員</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="member-sponsor"
                      checked={memberCategories.includes("sponsor")}
                      onCheckedChange={(checked) =>
                        handleMemberCategoryChange("sponsor", checked === true)
                      }
                    />
                    <Label htmlFor="member-sponsor" className="cursor-pointer text-sm">スポンサー</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="member-observer"
                      checked={memberCategories.includes("observer")}
                      onCheckedChange={(checked) =>
                        handleMemberCategoryChange("observer", checked === true)
                      }
                    />
                    <Label htmlFor="member-observer" className="cursor-pointer text-sm">オブザーバー</Label>
                  </div>
                </div>
              </div>

              {/* ベンチャー監査役協会の会員種別（ベンチャー監査役協会を選択している場合のみ表示） */}
              {organizations.includes("ベンチャー監査役協会") && (
                <div className="space-y-2 border-t pt-4">
                  <Label className="text-sm font-semibold">ベンチャー監査役協会 会員種別</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="audit-regular"
                        checked={auditMemberTypes.includes("regular")}
                        onCheckedChange={(checked) =>
                          handleAuditMemberTypeChange("regular", checked === true)
                        }
                      />
                      <Label htmlFor="audit-regular" className="cursor-pointer text-sm">正会員</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="audit-online"
                        checked={auditMemberTypes.includes("online")}
                        onCheckedChange={(checked) =>
                          handleAuditMemberTypeChange("online", checked === true)
                        }
                      />
                      <Label htmlFor="audit-online" className="cursor-pointer text-sm">オンライン会員</Label>
                    </div>
                  </div>
                </div>
              )}

              {/* プレミアム会員（ベンチャー監査役協会を選択している場合のみ表示） */}
              {organizations.includes("ベンチャー監査役協会") && (
                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="premium"
                      checked={premiumOnly}
                      onCheckedChange={(checked) => setPremiumOnly(checked === true)}
                    />
                    <Label htmlFor="premium" className="cursor-pointer text-sm">プレミアム会員のみ</Label>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[200px] justify-between h-10"
            >
              <span className="text-sm">
                {statuses.length === 0
                  ? "ステータス"
                  : statuses.length === 1
                  ? statuses[0] === "active"
                    ? "アクティブ"
                    : "非アクティブ"
                  : `${statuses.length}件選択`}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0 bg-white" align="start">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ステータスを検索"
                  value={statusSearch}
                  onChange={(e) => setStatusSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <div className="p-2 max-h-[300px] overflow-y-auto">
              {[
                { value: "active", label: "アクティブ" },
                { value: "inactive", label: "非アクティブ" },
              ]
                .filter((status) =>
                  status.label
                    .toLowerCase()
                    .includes(statusSearch.toLowerCase())
                )
                .map((status) => (
                  <div
                    key={status.value}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      handleStatusChange(
                        status.value,
                        !statuses.includes(status.value)
                      )
                    }
                  >
                    <Checkbox
                      checked={statuses.includes(status.value)}
                      onCheckedChange={(checked) =>
                        handleStatusChange(status.value, checked === true)
                      }
                    />
                    <Badge
                      variant={
                        status.value === "active" ? "default" : "secondary"
                      }
                      className="cursor-pointer"
                    >
                      {status.label}
                    </Badge>
                  </div>
                ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>氏名</TableHead>
              <TableHead>会社名</TableHead>
              <TableHead>会員区分</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  検索条件に一致する顧客が見つかりませんでした。
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer, index) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer hover:bg-gray-50"
                  tabIndex={0}
                  onClick={() => {
                    router.push(`/admin/customers/${customer.id}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/admin/customers/${customer.id}`);
                    }
                  }}
                >
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.company}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap items-center">
                      {(() => {
                        const badges: React.ReactElement[] = [];
                        
                        if (customer.memberCategory === "non-member") {
                          badges.push(
                            <Badge key="non-member" variant="secondary" className="text-xs px-2 py-0.5">
                              非会員
                            </Badge>
                          );
                        } else if (customer.memberCategory === "member") {
                          const hasAudit = customer.memberTypes.includes("ベンチャー監査役協会");
                          const hasNaikan = customer.memberTypes.includes("ないかんMeetup");
                          
                          if (hasNaikan && !hasAudit) {
                            badges.push(
                              <Badge key="naikan-member" variant="default" className="text-xs px-2 py-0.5">
                                ないかんMeetup(会員)
                              </Badge>
                            );
                          } else if (hasAudit && !hasNaikan) {
                            const auditType = customer.auditMemberType === "regular" ? "正会員" : "オンライン会員";
                            badges.push(
                              <Badge key="audit-member" variant="default" className="text-xs px-2 py-0.5">
                                ベンチャー監査役協会({auditType})
                              </Badge>
                            );
                          } else if (hasAudit && hasNaikan) {
                            const auditType = customer.auditMemberType === "regular" ? "正会員" : "オンライン会員";
                            badges.push(
                              <Badge key="audit-member" variant="default" className="text-xs px-2 py-0.5">
                                ベンチャー監査役協会({auditType})
                              </Badge>
                            );
                            badges.push(
                              <Badge key="naikan-member" variant="default" className="text-xs px-2 py-0.5">
                                ないかんMeetup(会員)
                              </Badge>
                            );
                          }
                          
                          // プレミアム会員バッジ
                          if (customer.auditMemberPremium) {
                            badges.push(
                              <Badge key="premium" variant="default" className="text-xs px-1.5 py-0.5 bg-slate-600 hover:bg-slate-700 text-white">
                                プレミアム
                              </Badge>
                            );
                          }
                        } else if (customer.memberCategory === "sponsor") {
                          if (customer.memberTypes.includes("ないかんMeetup")) {
                            badges.push(
                              <Badge key="sponsor-naikan" variant="default" className="text-xs px-2 py-0.5">
                                ないかんMeetup(スポンサー)
                              </Badge>
                            );
                          }
                          if (customer.memberTypes.includes("ベンチャー監査役協会")) {
                            badges.push(
                              <Badge key="sponsor-audit" variant="default" className="text-xs px-2 py-0.5">
                                ベンチャー監査役協会(スポンサー)
                              </Badge>
                            );
                          }
                        } else if (customer.memberCategory === "observer") {
                          if (customer.memberTypes.includes("ないかんMeetup")) {
                            badges.push(
                              <Badge key="observer-naikan" variant="default" className="text-xs px-2 py-0.5">
                                ないかんMeetup(オブザーバー)
                              </Badge>
                            );
                          }
                          if (customer.memberTypes.includes("ベンチャー監査役協会")) {
                            badges.push(
                              <Badge key="observer-audit" variant="default" className="text-xs px-2 py-0.5">
                                ベンチャー監査役協会(オブザーバー)
                              </Badge>
                            );
                          }
                        }
                        
                        return badges.length > 0 ? badges : null;
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        customer.status === "active" ? "default" : "secondary"
                      }
                    >
                      {customer.status === "active" ? "アクティブ" : "非アクティブ"}
                    </Badge>
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
