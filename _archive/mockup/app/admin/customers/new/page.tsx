"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import { RadioItem } from "@/components/ui/radio-item";
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
import { FormField } from "@/components/ui/form-field";
import { Stack } from "@/components/ui/stack";
import { SectionHeading } from "@/components/ui/section-heading";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
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
      <PageHeader
        backHref="/admin/customers"
        title="顧客登録"
        description="新しい顧客情報をシステムに登録します。"
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 会員情報セクション */}
        <Stack gap="lg">
          <SectionHeading>会員情報</SectionHeading>
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
                        <CheckboxItem
                          id="audit-community"
                          label="ベンチャー監査役の会"
                          checked={auditCommunityChecked}
                          onCheckedChange={(c) => setAuditCommunityChecked(c)}
                        />
                        <CheckboxItem
                          id="naikan-community"
                          label="ないかんMeetup"
                          checked={naikanCommunityChecked}
                          onCheckedChange={(c) => setNaikanCommunityChecked(c)}
                        />
                        <CheckboxItem
                          id="ai-community"
                          label="AI部会"
                          checked={aiCommunityChecked}
                          onCheckedChange={(c) => setAiCommunityChecked(c)}
                        />
                      </>
                    ) : (
                      <>
                        {currentAdmin?.communityScopes?.includes("ベンチャー監査役の会") && (
                          <CheckboxItem
                            id="audit-community"
                            label="ベンチャー監査役の会"
                            checked={auditCommunityChecked}
                            onCheckedChange={(c) => setAuditCommunityChecked(c)}
                          />
                        )}
                        {currentAdmin?.communityScopes?.includes("ないかんMeetup") && (
                          <CheckboxItem
                            id="naikan-community"
                            label="ないかんMeetup"
                            checked={naikanCommunityChecked}
                            onCheckedChange={(c) => setNaikanCommunityChecked(c)}
                          />
                        )}
                        {currentAdmin?.communityScopes?.includes("AI部会") && (
                          <CheckboxItem
                            id="ai-community"
                            label="AI部会"
                            checked={aiCommunityChecked}
                            onCheckedChange={(c) => setAiCommunityChecked(c)}
                          />
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
            {(auditCommunityChecked || naikanCommunityChecked || aiCommunityChecked) && (
              <>
                {/* 契約主体 */}
                <div className="grid gap-2">
                  <Label>契約主体 <span className="text-destructive">*</span></Label>
                  <RadioGroup
                    value={contractType}
                    onValueChange={(v) => setContractType(v as any)}
                  >
                    <div className="flex items-center gap-6">
                      <RadioItem value="corporate" label="法人" />
                      <RadioItem value="individual" label="個人" />
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
                      <RadioItem value="member" label="会員" />
                      <RadioItem value="sponsor" label="スポンサー" />
                      <RadioItem value="observer" label="オブザーバー" />
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
                          <CheckboxItem
                            id="audit-premium"
                            label="プレミアム会員"
                            checked={auditMemberPremium}
                            onCheckedChange={(c) => setAuditMemberPremium(c)}
                          />
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
                      <FormField label="入会日">
                        <DatePickerWithInput
                          date={auditJoinedAt}
                          setDate={setAuditJoinedAt}
                        />
                      </FormField>
                      <FormField label="脱退日">
                        <DatePickerWithInput
                          date={auditResignedAt}
                          setDate={setAuditResignedAt}
                        />
                      </FormField>
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
                      <FormField label="入会日">
                        <DatePickerWithInput
                          date={naikanJoinedAt}
                          setDate={setNaikanJoinedAt}
                        />
                      </FormField>
                      <FormField label="脱退日">
                        <DatePickerWithInput
                          date={naikanResignedAt}
                          setDate={setNaikanResignedAt}
                        />
                      </FormField>
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
                      <FormField label="入会日">
                        <DatePickerWithInput
                          date={aiJoinedAt}
                          setDate={setAiJoinedAt}
                        />
                      </FormField>
                      <FormField label="脱退日">
                        <DatePickerWithInput
                          date={aiResignedAt}
                          setDate={setAiResignedAt}
                        />
                      </FormField>
                    </div>
                  </div>
                )}
              </>
            )}

              {/* プロフィールセクション */}
              <SectionHeading>プロフィール</SectionHeading>
              <div className="grid grid-cols-2 gap-6">
                <FormField label="姓" required id="lastName">
                  <Input
                    placeholder="例: 山田"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                  />
                </FormField>
                <FormField label="名" required id="firstName">
                  <Input
                    placeholder="例: 太郎"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <FormField label="セイ">
                  <Input
                    placeholder="例: ヤマダ"
                    value={lastNameKana}
                    onChange={e => setLastNameKana(e.target.value)}
                  />
                </FormField>
                <FormField label="メイ">
                  <Input
                    placeholder="例: タロウ"
                    value={firstNameKana}
                    onChange={e => setFirstNameKana(e.target.value)}
                  />
                </FormField>
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

              <FormField label="会社名">
                <Input
                  placeholder="例: 株式会社マルコポーロ"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                />
              </FormField>

              <FormField label="上場区分">
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
              </FormField>

              <FormField label="電話番号">
                <Input
                  type="tel"
                  placeholder="例: 0312345678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </FormField>

              <FormField label="郵便番号">
                <Input
                  type="text"
                  placeholder="例: 1234567"
                  value={postalCode}
                  onChange={e => setPostalCode(e.target.value)}
                />
              </FormField>

              <FormField label="都道府県">
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
              </FormField>

              <FormField label="市区町村以下">
                <Input
                  type="text"
                  placeholder="例: 千代田区丸の内1-1-1"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
              </FormField>

              <div className="grid gap-2">
                <Label>性別</Label>
                <RadioGroup
                  value={gender}
                  onValueChange={(value) => setGender(value as "male" | "female")}
                >
                  <div className="flex items-center gap-6">
                    <RadioItem value="male" label="男性" />
                    <RadioItem value="female" label="女性" />
                  </div>
                </RadioGroup>
              </div>

              <FormField label="備考">
                <Textarea
                  placeholder="紹介者や特記事項など"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="min-h-32"
                />
              </FormField>
        </Stack>

        <div className="flex justify-center">
          <ActionButton type="submit">登録</ActionButton>
        </div>
      </form>
    </div>
  );
}
