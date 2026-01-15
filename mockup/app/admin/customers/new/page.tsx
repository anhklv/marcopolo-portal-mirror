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
  const [memberCategory, setMemberCategory] = useState<"member" | "sponsor" | "observer" | undefined>("member");
  const [auditMemberChecked, setAuditMemberChecked] = useState(false);
  const [auditMemberType, setAuditMemberType] = useState<string>("");
  const [auditMemberPremium, setAuditMemberPremium] = useState(false);
  const [naikanMember, setNaikanMember] = useState(false);
  const [auditSponsorChecked, setAuditSponsorChecked] = useState(false);
  const [naikanSponsorChecked, setNaikanSponsorChecked] = useState(false);
  const [auditObserverChecked, setAuditObserverChecked] = useState(false);
  const [naikanObserverChecked, setNaikanObserverChecked] = useState(false);
  const [contractType, setContractType] = useState<"corporate" | "individual">("corporate");
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

    // 非会員の場合はmemberCategoryがundefined、communitiesが空配列
    if (!memberCategory) {
      // 非会員の場合、コミュニティのチェックが外れていることを確認
      if (auditMemberChecked || naikanMember || auditSponsorChecked || naikanSponsorChecked || auditObserverChecked || naikanObserverChecked) {
        toast.error("非会員の場合は、コミュニティの選択を外してください");
        return;
      }
    }

    // 会員を選択した場合、少なくとも1つのコミュニティを選択しているかチェック
    if (memberCategory === "member" && !auditMemberChecked && !naikanMember) {
      toast.error("会員を選択した場合、少なくとも1つのコミュニティを選択してください");
      return;
    }

    // ベンチャー監査役協会の会員を選択した場合、会員種別を選択しているかチェック
    if (memberCategory === "member" && auditMemberChecked && !auditMemberType) {
      toast.error("ベンチャー監査役協会の会員種別を選択してください");
      return;
    }

    // スポンサーを選択した場合、少なくとも1つのコミュニティを選択しているかチェック
    if (memberCategory === "sponsor" && !auditSponsorChecked && !naikanSponsorChecked) {
      toast.error("スポンサーを選択した場合、少なくとも1つのコミュニティを選択してください");
      return;
    }

    // オブザーバーを選択した場合、少なくとも1つのコミュニティを選択しているかチェック
    if (memberCategory === "observer" && !auditObserverChecked && !naikanObserverChecked) {
      toast.error("オブザーバーを選択した場合、少なくとも1つのコミュニティを選択してください");
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

      <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border p-8 shadow-sm">
        <div className="space-y-6">
          <div className="grid gap-2">
            <Label>会員区分 <span className="text-red-500">*</span></Label>
            <RadioGroup
              value={memberCategory || ""}
              onValueChange={(value) => {
                const newCategory = value as "member" | "sponsor" | "observer" | "";
                if (newCategory === "") {
                  setMemberCategory(undefined);
                } else {
                  setMemberCategory(newCategory);
                }
                // 切り替え時にクリア
                if (newCategory === "") {
                  // 非会員の場合
                  setAuditMemberChecked(false);
                  setAuditMemberType("");
                  setAuditMemberPremium(false);
                  setNaikanMember(false);
                  setAuditSponsorChecked(false);
                  setNaikanSponsorChecked(false);
                  setAuditObserverChecked(false);
                  setNaikanObserverChecked(false);
                } else if (newCategory === "member") {
                  setAuditSponsorChecked(false);
                  setNaikanSponsorChecked(false);
                  setAuditObserverChecked(false);
                  setNaikanObserverChecked(false);
                } else if (newCategory === "sponsor") {
                  setAuditMemberChecked(false);
                  setAuditMemberType("");
                  setAuditMemberPremium(false);
                  setNaikanMember(false);
                  setAuditObserverChecked(false);
                  setNaikanObserverChecked(false);
                } else if (newCategory === "observer") {
                  setAuditMemberChecked(false);
                  setAuditMemberType("");
                  setAuditMemberPremium(false);
                  setNaikanMember(false);
                  setAuditSponsorChecked(false);
                  setNaikanSponsorChecked(false);
                }
              }}
            >
              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="member" id="member" />
                  <Label htmlFor="member" className="cursor-pointer">会員</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="" id="non-member" />
                  <Label htmlFor="non-member" className="cursor-pointer">非会員</Label>
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
            
            {/* 会員の場合 */}
            {memberCategory === "member" && (
              <div className="ml-6 mt-4 space-y-4">
                {/* ベンチャー監査役協会 */}
                <div className="grid gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="audit-check"
                      checked={auditMemberChecked}
                      onCheckedChange={(checked) => {
                        setAuditMemberChecked(checked === true);
                        if (!checked) {
                          setAuditMemberType("");
                          setAuditMemberPremium(false);
                        }
                      }}
                    />
                    <Label htmlFor="audit-check" className="cursor-pointer font-medium">ベンチャー監査役協会</Label>
                  </div>
                  {auditMemberChecked && (
                    <div className="ml-6">
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
                </div>

                {/* ないかんMeetup */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="naikan-check"
                    checked={naikanMember}
                    onCheckedChange={(checked) => setNaikanMember(checked === true)}
                  />
                  <Label htmlFor="naikan-check" className="cursor-pointer font-medium">ないかんMeetup</Label>
                </div>
              </div>
            )}

            {/* スポンサーの場合 */}
            {memberCategory === "sponsor" && (
              <div className="ml-6 mt-4 space-y-4">
                {/* ベンチャー監査役協会 */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="audit-sponsor-check"
                    checked={auditSponsorChecked}
                    onCheckedChange={(checked) => setAuditSponsorChecked(checked === true)}
                  />
                  <Label htmlFor="audit-sponsor-check" className="cursor-pointer font-medium">ベンチャー監査役協会</Label>
                </div>

                {/* ないかんMeetup */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="naikan-sponsor-check"
                    checked={naikanSponsorChecked}
                    onCheckedChange={(checked) => setNaikanSponsorChecked(checked === true)}
                  />
                  <Label htmlFor="naikan-sponsor-check" className="cursor-pointer font-medium">ないかんMeetup</Label>
                </div>
              </div>
            )}

            {/* オブザーバーの場合 */}
            {memberCategory === "observer" && (
              <div className="ml-6 mt-4 space-y-4">
                {/* ベンチャー監査役協会 */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="audit-observer-check"
                    checked={auditObserverChecked}
                    onCheckedChange={(checked) => setAuditObserverChecked(checked === true)}
                  />
                  <Label htmlFor="audit-observer-check" className="cursor-pointer font-medium">ベンチャー監査役協会</Label>
                </div>

                {/* ないかんMeetup */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="naikan-observer-check"
                    checked={naikanObserverChecked}
                    onCheckedChange={(checked) => setNaikanObserverChecked(checked === true)}
                  />
                  <Label htmlFor="naikan-observer-check" className="cursor-pointer font-medium">ないかんMeetup</Label>
                </div>
              </div>
            )}
          </div>

          {memberCategory === "member" && (
            <div className="grid gap-2">
              <Label>契約主体 <span className="text-red-500">*</span></Label>
              <RadioGroup
                value={contractType}
                onValueChange={(value) => setContractType(value as "corporate" | "individual")}
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
