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
import { toast } from "sonner";
import { ArrowLeft, Plus, X } from "lucide-react";
import {
  PREFECTURES,
  ORIGIN_INDUSTRIES,
  MEMBERSHIP_QUALIFICATIONS,
  LISTING_OPTIONS,
  AUDIT_MEMBER_TYPES,
} from "@/lib/constants/customer";

export default function NewCustomerPage() {
  const router = useRouter();
  // 組織を最初に選択（チェックボックス、複数選択可能）
  const [auditOrganizationChecked, setAuditOrganizationChecked] = useState(false);
  const [naikanOrganizationChecked, setNaikanOrganizationChecked] = useState(false);
  
  // 会員区分（組織が選択されている場合のみ表示）
  const [memberCategory, setMemberCategory] = useState<"member" | "sponsor" | "observer">("member");
  
  // ベンチャー監査役協会関連
  const [auditMemberType, setAuditMemberType] = useState<string>("");
  const [auditMemberPremium, setAuditMemberPremium] = useState(false);
  
  const [memberType, setMemberType] = useState<"corporate" | "individual">("corporate");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [listingCategory, setListingCategory] = useState<string>("");
  const [originIndustry, setOriginIndustry] = useState<string>("");
  const [membershipQualification, setMembershipQualification] = useState<string>("");
  const [prefecture, setPrefecture] = useState<string>("");
  const [subEmails, setSubEmails] = useState<string[]>([]);

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

    // 組織が選択されている場合のバリデーション
    if (auditOrganizationChecked || naikanOrganizationChecked) {
      // ベンチャー監査役協会の会員を選択した場合、会員種別を選択しているかチェック
      if (memberCategory === "member" && auditOrganizationChecked && !auditMemberType) {
        toast.error("ベンチャー監査役協会の会員種別を選択してください");
        return;
      }
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

      <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border p-8 shadow-sm">
        <div className="space-y-6">
          {/* 組織選択（最優先、チェックボックスで横並び） */}
          <div className="grid gap-2">
            <Label>組織</Label>
            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="audit-org-check"
                  checked={auditOrganizationChecked}
                  onCheckedChange={(checked) => {
                    setAuditOrganizationChecked(checked === true);
                    if (!checked) {
                      setAuditMemberType("");
                      setAuditMemberPremium(false);
                    }
                  }}
                />
                <Label htmlFor="audit-org-check" className="cursor-pointer font-medium">
                  ベンチャー監査役協会
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="naikan-org-check"
                  checked={naikanOrganizationChecked}
                  onCheckedChange={(checked) => setNaikanOrganizationChecked(checked === true)}
                />
                <Label htmlFor="naikan-org-check" className="cursor-pointer font-medium">
                  ないかんMeetup
                </Label>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              何も選択しない場合は非会員として登録されます
            </p>
          </div>

          {/* 会員区分選択（組織が選択されている場合のみ表示） */}
          {(auditOrganizationChecked || naikanOrganizationChecked) && (
            <div className="grid gap-2">
              <Label>会員区分 <span className="text-red-500">*</span></Label>
              <RadioGroup
                value={memberCategory}
                onValueChange={(value) => {
                  const newCategory = value as "member" | "sponsor" | "observer";
                  setMemberCategory(newCategory);
                  // 切り替え時にクリア
                  if (newCategory !== "member") {
                    setAuditMemberType("");
                    setAuditMemberPremium(false);
                  }
                }}
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
          )}

          {/* ベンチャー監査役協会の会員種別（会員区分が「会員」でベンチャー監査役協会を選択している場合のみ表示） */}
          {memberCategory === "member" && auditOrganizationChecked && (
            <div className="grid gap-2">
              <Label>ベンチャー監査役協会 会員種別 <span className="text-red-500">*</span></Label>
              <div className="flex items-center gap-4">
                <Select value={auditMemberType} onValueChange={setAuditMemberType}>
                  <SelectTrigger className="w-1/2 bg-white">
                    <SelectValue placeholder="会員種別を選択" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {auditMemberTypes.map((type) => (
                      <SelectItem
                        key={type.value}
                        value={type.value}
                        className="bg-white hover:bg-gray-100"
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2 shrink-0">
                  <Checkbox
                    id="audit-premium-check"
                    checked={auditMemberPremium}
                    onCheckedChange={(checked) => setAuditMemberPremium(checked === true)}
                  />
                  <Label htmlFor="audit-premium-check" className="cursor-pointer">プレミアム会員</Label>
                </div>
              </div>
            </div>
          )}

          {(auditOrganizationChecked || naikanOrganizationChecked) && memberCategory === "member" && (
            <div className="grid gap-2">
              <Label>会員種別 <span className="text-red-500">*</span></Label>
              <RadioGroup
                value={memberType}
                onValueChange={(value) => setMemberType(value as "corporate" | "individual")}
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
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="lastName">姓 <span className="text-red-500">*</span></Label>
              <Input id="lastName" placeholder="例: 山田" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="firstName">名 <span className="text-red-500">*</span></Label>
              <Input id="firstName" placeholder="例: 太郎" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="lastNameKana">セイ</Label>
              <Input id="lastNameKana" placeholder="例: ヤマダ" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="firstNameKana">メイ</Label>
              <Input id="firstNameKana" placeholder="例: タロウ" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">メールアドレス <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              <Input id="email" type="email" placeholder="name@example.com" required className="flex-1" />
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
            <Input id="company" placeholder="例: 株式会社マルコポーロ" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">電話番号</Label>
            <Input id="phone" type="tel" placeholder="例: 0312345678" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="postalCode">郵便番号</Label>
            <Input id="postalCode" type="text" placeholder="例: 1234567" />
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
                <SelectItem
                  value="選択してください"
                  className="bg-white hover:bg-gray-100"
                >
                  選択してください
                </SelectItem>
                {prefectures.map((pref) => (
                  <SelectItem
                    key={pref}
                    value={pref}
                    className="bg-white hover:bg-gray-100"
                  >
                    {pref}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="city">市区町村以下</Label>
            <Input id="city" type="text" placeholder="例: 千代田区丸の内1-1-1" />
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
                <SelectItem
                  value="選択してください"
                  className="bg-white hover:bg-gray-100"
                >
                  選択してください
                </SelectItem>
                <SelectItem
                  value="未上場"
                  className="bg-white hover:bg-gray-100"
                >
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
                  <SelectItem
                    key={industry}
                    value={industry}
                    className="bg-white hover:bg-gray-100"
                  >
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
                  <SelectItem
                    key={qualification}
                    value={qualification}
                    className="bg-white hover:bg-gray-100"
                  >
                    {qualification}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note">備考</Label>
            <Textarea id="note" placeholder="紹介者や特記事項など" />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin/customers">キャンセル</Link>
          </Button>
          <Button type="submit" variant="outline" className="cursor-pointer">登録する</Button>
        </div>
      </form>
    </div>
  );
}

