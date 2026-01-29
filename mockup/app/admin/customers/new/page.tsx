"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Plus, X } from "lucide-react";
import {
  PREFECTURES,
  ORIGIN_INDUSTRIES,
  MEMBERSHIP_QUALIFICATIONS,
  LISTING_OPTIONS,
  AUDIT_MEMBER_TYPES,
  NAIKAN_AFFILIATIONS,
  AI_AFFILIATIONS,
} from "@/lib/constants/customer";
import { useAuth } from "@/lib/contexts/auth.context";
import type { CommunityScope } from "@/lib/types";
import { DatePickerWithInput } from "@/components/ui/date-picker-with-input";

export default function NewCustomerPage() {
  const router = useRouter();
  const { hasPermission, currentAdmin } = useAuth();

  // コミュニティ選択 - コミュニティ管理者の場合は権限のあるコミュニティを初期値として設定
  const getInitialAuditCommunity = () => {
    if (currentAdmin?.role === "super") return false;
    if (currentAdmin?.role === "community_admin" && 
        currentAdmin.communityScopes?.includes("ベンチャー監査役の会")) {
      return true;
    }
    return false;
  };

  const getInitialNaikanCommunity = () => {
    if (currentAdmin?.role === "super") return false;
    if (currentAdmin?.role === "community_admin" && 
        currentAdmin.communityScopes?.includes("ないかんMeetup")) {
      return true;
    }
    return false;
  };

  const getInitialAiCommunity = () => {
    if (currentAdmin?.role === "super") return false;
    if (currentAdmin?.role === "community_admin" && 
        currentAdmin.communityScopes?.includes("AI部会")) {
      return true;
    }
    return false;
  };

  const [auditCommunityChecked, setAuditCommunityChecked] = useState(getInitialAuditCommunity());
  const [naikanCommunityChecked, setNaikanCommunityChecked] = useState(getInitialNaikanCommunity());
  const [aiCommunityChecked, setAiCommunityChecked] = useState(getInitialAiCommunity());

  // 会員区分
  const [memberCategory, setMemberCategory] = useState<"member" | "sponsor" | "observer" | undefined>("member");

  // ベンチャー監査役の会 詳細
  const [auditMemberType, setAuditMemberType] = useState<string>("");
  const [auditMemberPremium, setAuditMemberPremium] = useState(false);
  const [auditJoinedAt, setAuditJoinedAt] = useState<Date | undefined>(undefined);
  const [auditResignedAt, setAuditResignedAt] = useState<Date | undefined>(undefined);

  // ないかんMeetup 詳細
  const [naikanJoinedAt, setNaikanJoinedAt] = useState<Date | undefined>(undefined);
  const [naikanResignedAt, setNaikanResignedAt] = useState<Date | undefined>(undefined);
  const [naikanAffiliation, setNaikanAffiliation] = useState<string>("");

  // AI部会 詳細
  const [aiJoinedAt, setAiJoinedAt] = useState<Date | undefined>(undefined);
  const [aiResignedAt, setAiResignedAt] = useState<Date | undefined>(undefined);
  const [aiAffiliation, setAiAffiliation] = useState<string>("");

  // 日付をYYYY-MM-DD形式の文字列に変換
  const formatDateToString = (date: Date | undefined): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // YYYY-MM-DD形式の文字列をDateに変換
  const parseDateString = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  };

  // 契約主体
  const [contractType, setContractType] = useState<"corporate" | "individual">("corporate");

  // プロフィール
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastNameKana, setLastNameKana] = useState("");
  const [firstNameKana, setFirstNameKana] = useState("");
  const [subEmails, setSubEmails] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");

  // その他情報
  const [listingCategory, setListingCategory] = useState<string>("");
  const [note, setNote] = useState("");
  
  // ベンチャー監査役の会専用フィールド（パネル内に移動）
  const [originIndustry, setOriginIndustry] = useState<string>("");
  const [membershipQualification, setMembershipQualification] = useState<string>("");

  const originIndustries = ORIGIN_INDUSTRIES;
  const membershipQualifications = MEMBERSHIP_QUALIFICATIONS;
  const listingOptions = LISTING_OPTIONS;
  const prefectures = PREFECTURES;
  const auditMemberTypes = AUDIT_MEMBER_TYPES;
  const naikanAffiliations = NAIKAN_AFFILIATIONS;
  const aiAffiliations = AI_AFFILIATIONS;

  const handleAddSubEmail = () => {
    if (subEmails.length < 3) {
      setSubEmails([...subEmails, ""]);
    }
  };

  const handleRemoveSubEmail = (index: number) => {
    setSubEmails(subEmails.filter((_, i) => i !== index));
  };

  const handleSubEmailChange = (index: number, value: string) => {
    const newSubEmails = [...subEmails];
    newSubEmails[index] = value;
    setSubEmails(newSubEmails);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 何も選択しない場合は非会員として扱う（memberCategoryはundefinedにする）
    const isNonMember = !auditCommunityChecked && !naikanCommunityChecked && !aiCommunityChecked;

    if (!isNonMember) {
      // 会員区分が未選択の場合（通常は初期値が入るが念のため）
      if (!memberCategory) {
        toast.error("会員区分を選択してください");
        return;
      }

      // ベンチャー監査役の会が選択され、かつ会員の場合、会員種別は必須
      if (auditCommunityChecked && memberCategory === "member" && !auditMemberType) {
        toast.error("ベンチャー監査役の会の会員種別を選択してください");
        return;
      }
    }

    // 権限チェック: 選択したコミュニティへのアクセス権があるか確認
    const selectedCommunities: CommunityScope[] = [];
    if (auditCommunityChecked) selectedCommunities.push("ベンチャー監査役の会");
    if (naikanCommunityChecked) selectedCommunities.push("ないかんMeetup");
    if (aiCommunityChecked) selectedCommunities.push("AI部会");

    const customerData = {
      communities: selectedCommunities,
    };

    if (!hasPermission("customer", customerData)) {
      toast.error("この顧客を登録する権限がありません");
      return;
    }

    toast.success("顧客情報を登録しました");
    router.push("/admin/customers");
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">顧客登録</h1>
          <p className="text-sm text-muted-foreground">
            新しい顧客情報をシステムに登録します。
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 会員情報セクション */}
        <Card>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">会員情報</h2>
              <Separator className="mt-2" />
            </div>
            {/* コミュニティ選択 */}
            <div className="grid gap-2">
              <Label>コミュニティ</Label>
              {currentAdmin?.role === "super" || 
               (currentAdmin?.role === "community_admin" && 
                currentAdmin.communityScopes && 
                currentAdmin.communityScopes.length > 1) ? (
                <>
                  <div className="flex items-center gap-6">
                    {currentAdmin?.role === "super" ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="audit-community" 
                            checked={auditCommunityChecked} 
                            onCheckedChange={(c) => setAuditCommunityChecked(c === true)} 
                          />
                          <Label htmlFor="audit-community" className="cursor-pointer">ベンチャー監査役の会</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="naikan-community" 
                            checked={naikanCommunityChecked} 
                            onCheckedChange={(c) => setNaikanCommunityChecked(c === true)} 
                          />
                          <Label htmlFor="naikan-community" className="cursor-pointer">ないかんMeetup</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="ai-community" 
                            checked={aiCommunityChecked} 
                            onCheckedChange={(c) => setAiCommunityChecked(c === true)} 
                          />
                          <Label htmlFor="ai-community" className="cursor-pointer">AI部会</Label>
                        </div>
                      </>
                    ) : (
                      <>
                        {currentAdmin?.communityScopes?.includes("ベンチャー監査役の会") && (
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="audit-community" 
                              checked={auditCommunityChecked} 
                              onCheckedChange={(c) => setAuditCommunityChecked(c === true)} 
                            />
                            <Label htmlFor="audit-community" className="cursor-pointer">ベンチャー監査役の会</Label>
                          </div>
                        )}
                        {currentAdmin?.communityScopes?.includes("ないかんMeetup") && (
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="naikan-community" 
                              checked={naikanCommunityChecked} 
                              onCheckedChange={(c) => setNaikanCommunityChecked(c === true)} 
                            />
                            <Label htmlFor="naikan-community" className="cursor-pointer">ないかんMeetup</Label>
                          </div>
                        )}
                        {currentAdmin?.communityScopes?.includes("AI部会") && (
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="ai-community" 
                              checked={aiCommunityChecked} 
                              onCheckedChange={(c) => setAiCommunityChecked(c === true)} 
                            />
                            <Label htmlFor="ai-community" className="cursor-pointer">AI部会</Label>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">何も選択しない場合は非会員として登録されます</p>
                </>
              ) : (
                <div className="text-sm text-foreground">
                  {currentAdmin?.communityScopes?.map((scope, index) => (
                    <span key={scope}>
                      {index > 0 && "、"}
                      {scope}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 会員区分・詳細 (コミュニティが選択されている場合のみ) */}
            {(auditCommunityChecked || naikanCommunityChecked) && (
              <>
                {/* 契約主体 */}
                <div className="grid gap-2">
                  <Label>契約主体 <span className="text-destructive">*</span></Label>
                  <RadioGroup 
                    value={contractType} 
                    onValueChange={(v) => setContractType(v as any)}
                  >
                    <div className="flex items-center gap-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="corporate" id="corporate" />
                        <Label htmlFor="corporate" className="cursor-pointer">法人</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="individual" />
                        <Label htmlFor="individual" className="cursor-pointer">個人</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* 会員区分 */}
                <div className="grid gap-2">
                  <Label>会員区分 <span className="text-destructive">*</span></Label>
                  <RadioGroup 
                    value={memberCategory || ""} 
                    onValueChange={(v) => setMemberCategory(v as any)}
                  >
                    <div className="flex items-center gap-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="member" id="member" />
                        <Label htmlFor="member" className="cursor-pointer">会員</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sponsor" id="sponsor" />
                        <Label htmlFor="sponsor" className="cursor-pointer">スポンサー</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="observer" id="observer" />
                        <Label htmlFor="observer" className="cursor-pointer">オブザーバー</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* ベンチャー監査役の会 詳細 */}
                {auditCommunityChecked && (
                  <div className="rounded-lg border p-4 space-y-6 bg-slate-50">
                    <div className="space-y-3">
                      <Label>ベンチャー監査役の会</Label>
                      <div className="border-b border-border"></div>
                    </div>
                    
                    {/* 会員の場合のみ会員種別とプレミアム表示 */}
                    {memberCategory === "member" && (
                      <div className="grid gap-2">
                        <Label>会員種別 <span className="text-destructive">*</span></Label>
                        <div className="flex items-center gap-4">
                          <Select value={auditMemberType} onValueChange={setAuditMemberType}>
                            <SelectTrigger className="w-[300px] bg-white">
                              <SelectValue placeholder="会員種別を選択" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {auditMemberTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value} className="bg-white hover:bg-gray-100">
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="audit-premium" 
                              checked={auditMemberPremium} 
                              onCheckedChange={(c) => setAuditMemberPremium(c === true)} 
                            />
                            <Label htmlFor="audit-premium" className="cursor-pointer">プレミアム会員</Label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 入会資格 */}
                    <div className="grid gap-2">
                      <Label>入会資格</Label>
                      <Select value={membershipQualification} onValueChange={setMembershipQualification}>
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {membershipQualifications.map((qualification) => (
                            <SelectItem key={qualification} value={qualification} className="bg-white hover:bg-gray-100">
                              {qualification}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 出身業種 */}
                    <div className="grid gap-2">
                      <Label>出身業種</Label>
                      <Select value={originIndustry} onValueChange={setOriginIndustry}>
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {originIndustries.map((industry) => (
                            <SelectItem key={industry} value={industry} className="bg-white hover:bg-gray-100">
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="auditJoinedAt" className="px-1">入会日</Label>
                        <DatePickerWithInput
                          id="auditJoinedAt"
                          date={auditJoinedAt}
                          setDate={setAuditJoinedAt}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="auditResignedAt" className="px-1">脱退日</Label>
                        <DatePickerWithInput
                          id="auditResignedAt"
                          date={auditResignedAt}
                          setDate={setAuditResignedAt}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ないかんMeetup 詳細 */}
                {naikanCommunityChecked && (
                  <div className="rounded-lg border p-4 space-y-6 bg-slate-50">
                    <div className="space-y-3">
                      <Label>ないかんMeetup</Label>
                      <div className="border-b border-border"></div>
                    </div>
                    
                    {/* 所属 */}
                    <div className="grid gap-2">
                      <Label>所属</Label>
                      <Select value={naikanAffiliation} onValueChange={setNaikanAffiliation}>
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {naikanAffiliations.map((affiliation) => (
                            <SelectItem key={affiliation} value={affiliation} className="bg-white hover:bg-gray-100">
                              {affiliation}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="naikanJoinedAt" className="px-1">入会日</Label>
                        <DatePickerWithInput
                          id="naikanJoinedAt"
                          date={naikanJoinedAt}
                          setDate={setNaikanJoinedAt}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="naikanResignedAt" className="px-1">脱退日</Label>
                        <DatePickerWithInput
                          id="naikanResignedAt"
                          date={naikanResignedAt}
                          setDate={setNaikanResignedAt}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* AI部会 詳細 */}
                {aiCommunityChecked && (
                  <div className="rounded-lg border p-4 space-y-6 bg-slate-50">
                    <div className="space-y-3">
                      <Label>AI部会</Label>
                      <div className="border-b border-border"></div>
                    </div>
                    
                    {/* 所属 */}
                    <div className="grid gap-2">
                      <Label>所属</Label>
                      <Select value={aiAffiliation} onValueChange={setAiAffiliation}>
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {aiAffiliations.map((affiliation) => (
                            <SelectItem key={affiliation} value={affiliation} className="bg-white hover:bg-gray-100">
                              {affiliation}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="aiJoinedAt" className="px-1">入会日</Label>
                        <DatePickerWithInput
                          id="aiJoinedAt"
                          date={aiJoinedAt}
                          setDate={setAiJoinedAt}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="aiResignedAt" className="px-1">脱退日</Label>
                        <DatePickerWithInput
                          id="aiResignedAt"
                          date={aiResignedAt}
                          setDate={setAiResignedAt}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* プロフィールセクション */}
            <div>
              <h2 className="text-lg font-semibold">プロフィール</h2>
              <Separator className="mt-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lastName">姓 <span className="text-destructive">*</span></Label>
                <Input 
                  id="lastName" 
                  placeholder="例: 山田" 
                  required 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="firstName">名 <span className="text-destructive">*</span></Label>
                <Input 
                  id="firstName" 
                  placeholder="例: 太郎" 
                  required 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lastNameKana">セイ</Label>
                <Input 
                  id="lastNameKana" 
                  placeholder="例: ヤマダ" 
                  value={lastNameKana} 
                  onChange={e => setLastNameKana(e.target.value)} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="firstNameKana">メイ</Label>
                <Input 
                  id="firstNameKana" 
                  placeholder="例: タロウ" 
                  value={firstNameKana} 
                  onChange={e => setFirstNameKana(e.target.value)} 
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">メールアドレス <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  className="flex-1" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                {subEmails.length < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddSubEmail}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {subEmails.map((subEmail, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={`サブメールアドレス ${index + 1}`}
                    value={subEmail}
                    onChange={(e) => handleSubEmailChange(index, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveSubEmail(index)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company">会社名</Label>
              <Input 
                id="company" 
                placeholder="例: 株式会社マルコポーロ" 
                value={company}
                onChange={e => setCompany(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>上場区分</Label>
              <Select 
                value={listingCategory} 
                onValueChange={(value) => {
                  if (value === "選択してください") {
                    setListingCategory("");
                  } else {
                    setListingCategory(value);
                  }
                }}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="選択してください" className="bg-white hover:bg-gray-100">
                    選択してください
                  </SelectItem>
                  <SelectItem value="未上場" className="bg-white hover:bg-gray-100">
                    未上場
                  </SelectItem>
                  {listingOptions.map((option) => (
                    <SelectGroup key={option.exchange}>
                      <SelectLabel className="bg-gray-100">{option.exchange}</SelectLabel>
                      {option.markets.map((market) => (
                        <SelectItem
                          key={`${option.exchange}-${market}`}
                          value={`${option.exchange}-${market}`}
                          className="bg-white hover:bg-gray-100"
                        >
                          {market}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="例: 0312345678" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="postalCode">郵便番号</Label>
              <Input 
                id="postalCode" 
                type="text" 
                placeholder="例: 1234567" 
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>都道府県</Label>
              <Select 
                value={prefecture} 
                onValueChange={(value) => {
                  if (value === "選択してください") {
                    setPrefecture("");
                  } else {
                    setPrefecture(value);
                  }
                }}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="選択してください" className="bg-white hover:bg-gray-100">
                    選択してください
                  </SelectItem>
                  {prefectures.map((pref) => (
                    <SelectItem key={pref} value={pref} className="bg-white hover:bg-gray-100">
                      {pref}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="city">市区町村以下</Label>
              <Input 
                id="city" 
                type="text" 
                placeholder="例: 千代田区丸の内1-1-1" 
                value={city}
                onChange={e => setCity(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>性別</Label>
              <RadioGroup
                value={gender}
                onValueChange={(value) => setGender(value as "male" | "female")}
              >
                <div className="flex items-center gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="cursor-pointer">男性</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="cursor-pointer">女性</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">備考</Label>
              <Textarea 
                id="note" 
                placeholder="紹介者や特記事項など" 
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="default" className="cursor-pointer">登録</Button>
        </div>
      </form>
    </div>
  );
}
