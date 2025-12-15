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
import { customers, events, rsvps, getMemberTypeDisplayName, MemberFilterValue } from "@/lib/data/mock";
import { cn, formatEventDate } from "@/lib/utils";

type Step = "select" | "customize" | "confirm";

export default function EventInvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const event = events.find((e) => e.id === id);
  
  const [step, setStep] = useState<Step>("select");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [emailTitle, setEmailTitle] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [memberTypes, setMemberTypes] = useState<MemberFilterValue[]>([]);
  const [memberTypeSearch, setMemberTypeSearch] = useState("");
  const [inviteStatuses, setInviteStatuses] = useState<string[]>([]);
  const [inviteStatusSearch, setInviteStatusSearch] = useState("");

  // このイベントのRSVPデータを取得
  const eventRsvps = rsvps.filter((r) => r.eventId === id);
  const invitedCustomerIds = new Set(eventRsvps.map((r) => r.customerId));

  // デフォルトのメールタイトルと本文を設定
  useEffect(() => {
    if (event) {
      const defaultTitle = `【${event.title}】ご案内`;
      const defaultBody = `この度は、${event.title}にご案内いたします。

【イベント詳細】
${event.description ? `概要: ${event.description}\n` : ""}${event.date ? `開催日時: ${formatEventDate(event.date)}\n` : ""}${event.location ? `場所: ${event.location}\n` : ""}

ご参加の可否について、以下のURLよりご回答をお願いいたします。
{RSVP_URL}

よろしくお願いいたします。`;
      
      setEmailTitle(defaultTitle);
      setEmailBody(defaultBody);
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


  const handleMemberTypeChange = (type: MemberFilterValue, checked: boolean) => {
    if (checked) {
      setMemberTypes([...memberTypes, type]);
    } else {
      setMemberTypes(memberTypes.filter((t) => t !== type));
    }
  };

  const handleInviteStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setInviteStatuses([...inviteStatuses, status]);
    } else {
      setInviteStatuses(inviteStatuses.filter((s) => s !== status));
    }
  };

  // アクティブな顧客のみをフィルタリングし、検索条件で絞り込む
  const filteredCustomers = useMemo(() => {
    const filtered = customers
      .filter((customer) => customer.status === "active") // アクティブな顧客のみ
      .map((customer) => ({
        ...customer,
        isInvited: invitedCustomerIds.has(customer.id),
      }))
      .filter((customer) => {
        // フリーワード検索
        const matchesKeyword =
          searchKeyword === "" ||
          customer.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          customer.company?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchKeyword.toLowerCase());

        // 会員区分フィルタ（チェックがない場合はすべて表示）
        const matchesMemberType =
          memberTypes.length === 0 ||
          memberTypes.some((selectedType): boolean => {
            // 非会員の場合
            if (selectedType === "非会員") {
              return customer.memberTypes.length === 0;
            }
            // ここまで来たらselectedTypeは自動的にMemberTypeに絞り込まれる
            return customer.memberTypes.includes(selectedType);
          });

        // 案内状況フィルタ（チェックがない場合はすべて表示）
        const matchesInviteStatus =
          inviteStatuses.length === 0 ||
          inviteStatuses.some((status) => {
            if (status === "案内済み") return customer.isInvited;
            if (status === "未案内") return !customer.isInvited;
            return true;
          });

        return matchesKeyword && matchesMemberType && matchesInviteStatus;
      });

    return filtered;
  }, [searchKeyword, memberTypes, inviteStatuses, invitedCustomerIds]);

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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/events/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">案内メール送信</h1>
            <p className="text-muted-foreground">
              案内メールを送信する顧客を選択してください。
            </p>
          </div>
        </div>
        
        <StepIndicator />

        <Card>
          <CardHeader>
            <CardTitle>案内者を選択</CardTitle>
            <CardDescription>
              未案内の顧客を選択して案内メールを送信します。
              <br/>
              ※送信時に自動で個別ID付きURLが生成されます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                    {["監査役協会", "ないかんMeetup", "非会員"]
                      .filter((type) =>
                        type
                          .toLowerCase()
                          .includes(memberTypeSearch.toLowerCase())
                      )
                      .map((type) => (
                        <div
                          key={type}
                          className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                          onClick={() =>
                            handleMemberTypeChange(
                              type,
                              !memberTypes.includes(type)
                            )
                          }
                        >
                          <Checkbox
                            checked={memberTypes.includes(type)}
                            onCheckedChange={(checked) =>
                              handleMemberTypeChange(type, checked === true)
                            }
                          />
                          <Badge
                            variant={
                              type === "非会員" ? "secondary" : "default"
                            }
                            className="cursor-pointer"
                          >
                            {type}
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
                      {inviteStatuses.length === 0
                        ? "案内状況"
                        : inviteStatuses.length === 1
                        ? inviteStatuses[0]
                        : `${inviteStatuses.length}件選択`}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 bg-white" align="start">
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="案内状況を検索"
                        value={inviteStatusSearch}
                        onChange={(e) => setInviteStatusSearch(e.target.value)}
                        className="pl-8 h-9"
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
                          <Badge
                            variant={
                              status.value === "案内済み" ? "default" : "secondary"
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

            <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
              <div>
                <span className="font-medium">{selectedCustomers.length}名</span> 選択中
              </div>
            </div>

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
                          checked={selectedCustomers.includes(customer.id)}
                          onCheckedChange={() => toggleCustomer(customer.id)}
                        />
                      </TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.company}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            customer.memberTypes.length === 0 ? "secondary" : "default"
                          }
                        >
                          {getMemberTypeDisplayName(customer.memberTypes)}
                        </Badge>
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

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" asChild>
                <Link href={`/admin/events/${id}`}>キャンセル</Link>
              </Button>
              <Button variant="outline" onClick={handleSelectNext} className="cursor-pointer">
                次へ
              </Button>
            </div>
          </CardContent>
        </Card>
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
            <h1 className="text-3xl font-bold tracking-tight">案内メール送信</h1>
            <p className="text-muted-foreground">
              案内メールのタイトルと本文を編集できます。
            </p>
          </div>
        </div>
        
        <StepIndicator />

        <Card>
          <CardHeader>
            <CardTitle>メール文作成</CardTitle>
            <CardDescription>
              送信するメールのタイトルと本文を編集してください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="emailTitle">メールタイトル</Label>
              <Input 
                id="emailTitle" 
                value={emailTitle}
                onChange={(e) => setEmailTitle(e.target.value)}
                placeholder="メールタイトルを入力"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="emailBody">メール本文</Label>
              <Textarea 
                id="emailBody" 
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="メール本文を入力"
                rows={30}
                style={{ minHeight: '480px' }}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => setStep("select")}>
                戻る
              </Button>
              <Button variant="outline" onClick={handleCustomizeNext} className="cursor-pointer">
                次へ
              </Button>
            </div>
          </CardContent>
        </Card>
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
            <h1 className="text-3xl font-bold tracking-tight">案内メール送信</h1>
            <p className="text-muted-foreground">
              送信内容を確認して、テスト送信または送信を実行してください。
            </p>
          </div>
        </div>
        
        <StepIndicator />

        <Card>
          <CardHeader>
            <CardTitle>確認</CardTitle>
            <CardDescription>
              送信内容を確認して、テスト送信または送信を実行してください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="font-medium mb-2">イベント情報</div>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">イベント名:</span> {event.title}</div>
                  <div><span className="font-medium">開催日時:</span> {formatEventDate(event.date)}</div>
                  {event.location && <div><span className="font-medium">場所:</span> {event.location}</div>}
                </div>
              </div>

              <div>
                <div className="font-medium mb-2">送信先 ({selectedCustomers.length}名)</div>
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

              <div>
                <div className="font-medium mb-2">メール内容</div>
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
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => setStep("customize")}>
                戻る
              </Button>
              <Button variant="outline" onClick={handleTestSend} className="cursor-pointer">
                <Mail className="h-4 w-4" />
                テスト送信
              </Button>
              <Button variant="outline" onClick={handleSend} className="cursor-pointer">
                <Send className="h-4 w-4" />
                送信
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
