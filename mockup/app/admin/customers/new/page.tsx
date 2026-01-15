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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Plus, X } from "lucide-react";
import {
  PREFECTURES,
  ORIGIN_INDUSTRIES,
  MEMBERSHIP_QUALIFICATIONS,
  LISTING_OPTIONS,
  AUDIT_MEMBER_TYPES,
} from "@/lib/constants/customer";
import { useAuth } from "@/lib/contexts/auth.context";
import type { CommunityScope } from "@/lib/types";

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

  const [auditCommunityChecked, setAuditCommunityChecked] = useState(getInitialAuditCommunity());
  const [naikanCommunityChecked, setNaikanCommunityChecked] = useState(getInitialNaikanCommunity());

  // 会員区分
  const [memberCategory, setMemberCategory] = useState<"member" | "sponsor" | "observer" | undefined>("member");

  // ベンチャー監査役の会 詳細
  const [auditMemberType, setAuditMemberType] = useState<string>("");
  const [auditMemberPremium, setAuditMemberPremium] = useState(false);
  const [auditJoinedAt, setAuditJoinedAt] = useState<string>("");
  const [auditResignedAt, setAuditResignedAt] = useState<string>("");

  // ないかんMeetup 詳細
  const [naikanJoinedAt, setNaikanJoinedAt] = useState<string>("");
  const [naikanResignedAt, setNaikanResignedAt] = useState<string>("");

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
  const [originIndustry, setOriginIndustry] = useState<string>("");
  const [membershipQualification, setMembershipQualification] = useState<string>("");
  const [note, setNote] = useState("");

  const originIndustries = ORIGIN_INDUSTRIES;
  const membershipQualifications = MEMBERSHIP_QUALIFICATIONS;
  const listingOptions = LISTING_OPTIONS;
  const prefectures = PREFECTURES;
  const auditMemberTypes = AUDIT_MEMBER_TYPES;

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
    const isNonMember = !auditCommunityChecked && !naikanCommunityChecked;

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
          <h1 className="text-3xl font-bold tracking-tight">顧客登録</h1>
          <p className="text-muted-foreground">
            新しい顧客情報をシステムに登録します。
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 会員情報セクション */}
        <Card>
          <CardHeader>
            <CardTitle>会員情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* コミュニティ選択 */}
            <div className="grid gap-2">
              <Label className="text-base font-medium">コミュニティ</Label>
              {currentAdmin?.role === "super" ? (
                <>
                  <div className="flex items-center gap-6">
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
                  </div>
                  <p className="text-sm text-muted-foreground">何も選択しない場合は非会員として登録されます</p>
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
                  <Label className="text-base font-medium">契約主体 <span className="text-red-500">*</span></Label>
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
                  <Label className="text-base font-medium">会員区分 <span className="text-red-500">*</span></Label>
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
                  <div className="rounded-lg border p-4 space-y-4 bg-slate-50">
                    <Label className="font-semibold text-base">ベンチャー監査役の会</Label>
                    
                    {/* 会員の場合のみ会員種別とプレミアム表示 */}
                    {memberCategory === "member" && (
                      <div className="grid gap-2">
                        <Label className="text-sm font-medium">ベンチャー監査役の会 会員種別 <span className="text-red-500">*</span></Label>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="auditJoinedAt" className="text-sm">入会日</Label>
                        <Input 
                          id="auditJoinedAt" 
                          type="date" 
                          value={auditJoinedAt} 
                          onChange={(e) => setAuditJoinedAt(e.target.value)} 
                          className="bg-white" 
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="auditResignedAt" className="text-sm">脱退日</Label>
                        <Input 
                          id="auditResignedAt" 
                          type="date" 
                          value={auditResignedAt} 
                          onChange={(e) => setAuditResignedAt(e.target.value)} 
                          className="bg-white" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ないかんMeetup 詳細 */}
                {naikanCommunityChecked && (
                  <div className="rounded-lg border p-4 space-y-4 bg-slate-50">
                    <Label className="font-semibold text-base">ないかんMeetup</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="naikanJoinedAt" className="text-sm">入会日</Label>
                        <Input 
                          id="naikanJoinedAt" 
                          type="date" 
                          value={naikanJoinedAt} 
                          onChange={(e) => setNaikanJoinedAt(e.target.value)} 
                          className="bg-white" 
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="naikanResignedAt" className="text-sm">脱退日</Label>
                        <Input 
                          id="naikanResignedAt" 
                          type="date" 
                          value={naikanResignedAt} 
                          onChange={(e) => setNaikanResignedAt(e.target.value)} 
                          className="bg-white" 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* プロフィールセクション */}
        <Card>
          <CardHeader>
            <CardTitle>プロフィール</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lastName">姓 <span className="text-red-500">*</span></Label>
                <Input 
                  id="lastName" 
                  placeholder="例: 山田" 
                  required 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="firstName">名 <span className="text-red-500">*</span></Label>
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
              <Label htmlFor="email">メールアドレス <span className="text-red-500">*</span></Label>
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
              <Label htmlFor="company">会社名・所属</Label>
              <Input 
                id="company" 
                placeholder="例: 株式会社マルコポーロ" 
                value={company}
                onChange={e => setCompany(e.target.value)}
              />
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
          </CardContent>
        </Card>

        {/* その他情報セクション */}
        <Card>
          <CardHeader>
            <CardTitle>その他情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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

        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin/customers">キャンセル</Link>
          </Button>
          <Button type="submit" variant="default" className="cursor-pointer">登録する</Button>
        </div>
      </form>
    </div>
  );
}
