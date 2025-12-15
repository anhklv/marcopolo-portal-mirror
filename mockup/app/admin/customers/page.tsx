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
import { customers, Customer } from "@/lib/data/mock";
import { Plus, Search, Users, ChevronDown, Download } from "lucide-react";
import { toast } from "sonner";

export default function CustomersPage() {
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [memberTypes, setMemberTypes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>(["active"]);
  const [memberTypeSearch, setMemberTypeSearch] = useState("");
  const [statusSearch, setStatusSearch] = useState("");


  const handleMemberTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setMemberTypes([...memberTypes, type]);
    } else {
      setMemberTypes(memberTypes.filter((t) => t !== type));
    }
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setStatuses([...statuses, status]);
    } else {
      setStatuses(statuses.filter((s) => s !== status));
    }
  };

  // 会員区分の表示名を短縮する関数
  const getMemberTypeDisplayName = (type: string): string => {
    const mapping: Record<string, string> = {
      "監査役協会会員": "監査役協会",
      "ないかんMeetup会員": "ないかんMeetup",
      "非会員": "非会員",
    };
    return mapping[type] || type;
  };

  // 会員区分の表示名から元の値を取得する関数
  const getMemberTypeFromDisplayName = (displayName: string): string => {
    const mapping: Record<string, string> = {
      "監査役協会": "監査役協会会員",
      "ないかんMeetup": "ないかんMeetup会員",
      "非会員": "非会員",
    };
    return mapping[displayName] || displayName;
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
          customer.type,
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

      // 会員区分フィルタ（チェックがない場合はすべて表示）
      const matchesMemberType =
        memberTypes.length === 0 ||
        memberTypes.some((type) => {
          const originalType = getMemberTypeFromDisplayName(type);
          return customer.type === originalType;
        });

      // ステータスフィルタ（チェックがない場合はすべて表示）
      const matchesStatus =
        statuses.length === 0 || statuses.includes(customer.status);

      return matchesKeyword && matchesMemberType && matchesStatus;
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
  }, [searchKeyword, memberTypes, statuses]);

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
              className="w-[200px] justify-between h-10"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {memberTypes.length === 0
                    ? "会員区分"
                    : memberTypes.length === 1
                    ? memberTypes[0]
                    : `${memberTypes.length}件選択`}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0 bg-white" align="start">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="会員区分を検索"
                  value={memberTypeSearch}
                  onChange={(e) => setMemberTypeSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <div className="p-2 max-h-[300px] overflow-y-auto">
              {[
                { original: "監査役協会会員", display: "監査役協会" },
                { original: "ないかんMeetup会員", display: "ないかんMeetup" },
                { original: "非会員", display: "非会員" },
              ]
                .filter((item) =>
                  item.display
                    .toLowerCase()
                    .includes(memberTypeSearch.toLowerCase())
                )
                .map((item) => (
                  <div
                    key={item.original}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      handleMemberTypeChange(
                        item.display,
                        !memberTypes.includes(item.display)
                      )
                    }
                  >
                    <Checkbox
                      checked={memberTypes.includes(item.display)}
                      onCheckedChange={(checked) =>
                        handleMemberTypeChange(item.display, checked === true)
                      }
                    />
                    <Badge
                      variant={
                        item.original === "非会員" ? "secondary" : "default"
                      }
                      className="cursor-pointer"
                    >
                      {item.display}
                    </Badge>
                  </div>
                ))}
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
                    <Badge
                      variant={
                        customer.type === "非会員" ? "secondary" : "default"
                      }
                    >
                      {getMemberTypeDisplayName(customer.type)}
                    </Badge>
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
                  <TableCell>{customer.registeredAt}</TableCell>
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
