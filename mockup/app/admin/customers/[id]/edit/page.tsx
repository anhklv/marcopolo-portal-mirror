"use client";

import { useState, use } from "react";
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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Plus, X } from "lucide-react";
import { customers } from "@/lib/data/mock";
import type { Customer } from "@/lib/types";
import {
  PREFECTURES,
  ORIGIN_INDUSTRIES,
  MEMBERSHIP_QUALIFICATIONS,
  LISTING_OPTIONS,
  AUDIT_MEMBER_TYPES,
} from "@/lib/constants/customer";

export default function CustomerEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const customer = customers.find((c) => c.id === id);

  if (!customer) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">顧客が見つかりません</h1>
            <p className="text-muted-foreground">
              指定された顧客IDの情報が見つかりませんでした。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // コミュニティの選択状態（既存データから初期化）
  const auditOrganizationInitial = customer.communities.includes("ベンチャー監査役協会");
  const naikanOrganizationInitial = customer.communities.includes("ないかんMeetup");
  
  // 名前の分割
  const nameParts = customer.name.split(" ");
  const nameKanaParts = customer.nameKana?.split(" ") || ["", ""];

  // フォームの状態管理
  // コミュニティを最初に選択（チェックボックス、複数選択可能）
  const [auditOrganizationChecked, setAuditOrganizationChecked] = useState(auditOrganizationInitial);
  const [naikanOrganizationChecked, setNaikanOrganizationChecked] = useState(naikanOrganizationInitial);
  
  // 会員区分（コミュニティが選択されている場合のみ表示）
  const [memberCategory, setMemberCategory] = useState<"member" | "sponsor" | "observer">(
    customer.memberCategory || (customer.communities.length > 0 ? "member" : "member")
  );
  
  // ベンチャー監査役協会関連
  const [auditMemberType, setAuditMemberType] = useState<string>(customer.auditMemberType || "");
  const [auditMemberPremium, setAuditMemberPremium] = useState(customer.auditMemberPremium || false);
  const [contractType, setContractType] = useState<"corporate" | "individual">(
    customer.contractType || "corporate"
  );
  const [lastName, setLastName] = useState(nameParts[0] || "");
  const [firstName, setFirstName] = useState(nameParts[1] || "");
  const [lastNameKana, setLastNameKana] = useState(nameKanaParts[0] || "");
  const [firstNameKana, setFirstNameKana] = useState(nameKanaParts[1] || "");
  const [email, setEmail] = useState(customer.email);
  const [subEmails, setSubEmails] = useState<string[]>(customer.subEmails || []);
  const [company, setCompany] = useState(customer.company || "");
  const [phone, setPhone] = useState(customer.phone || "");
  const [postalCode, setPostalCode] = useState(customer.postalCode || "");
  const [prefecture, setPrefecture] = useState(customer.prefecture || "");
  const [city, setCity] = useState(customer.city || "");
  const [gender, setGender] = useState<"male" | "female" | "">(customer.gender || "");
  const [listingCategory, setListingCategory] = useState<string>(customer.listingCategory || "");
  const [originIndustry, setOriginIndustry] = useState<string>(customer.originIndustry || "");
  const [membershipQualification, setMembershipQualification] = useState<string>(customer.membershipQualification || "");
  const [note, setNote] = useState(customer.note || "");
  const [isInactive, setIsInactive] = useState(customer.status === "inactive");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

    // コミュニティが選択されている場合のバリデーション
    if (auditOrganizationChecked || naikanOrganizationChecked) {
      // ベンチャー監査役協会の会員を選択した場合、会員種別を選択しているかチェック
      if (memberCategory === "member" && auditOrganizationChecked && !auditMemberType) {
        toast.error("ベンチャー監査役協会の会員種別を選択してください");
        return;
      }
    }

    toast.success("顧客情報を更新しました");
    router.push(`/admin/customers/${id}`);
  };

  const handleDelete = () => {
    toast.success("顧客を削除しました");
    setIsDeleteDialogOpen(false);
    router.push("/admin/customers");
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/customers/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">顧客編集</h1>
          <p className="text-muted-foreground">
            顧客情報を編集・更新します。
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border p-8 shadow-sm">
        <div className="space-y-6">
          {/* コミュニティ選択（最優先、チェックボックスで横並び） */}
          <div className="grid gap-2">
            <Label>コミュニティ</Label>
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

          {/* 会員区分選択（コミュニティが選択されている場合のみ表示） */}
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
              <Input
                id="lastName"
                placeholder="例: 山田"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="firstName">名 <span className="text-red-500">*</span></Label>
              <Input
                id="firstName"
                placeholder="例: 太郎"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
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
                onChange={(e) => setLastNameKana(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="firstNameKana">メイ</Label>
              <Input
                id="firstNameKana"
                placeholder="例: タロウ"
                value={firstNameKana}
                onChange={(e) => setFirstNameKana(e.target.value)}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
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
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">電話番号</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="例: 0312345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="postalCode">郵便番号</Label>
            <Input
              id="postalCode"
              type="text"
              placeholder="例: 1234567"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
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
            <Input
              id="city"
              type="text"
              placeholder="例: 千代田区丸の内1-1-1"
              value={city}
              onChange={(e) => setCity(e.target.value)}
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
            <Textarea
              id="note"
              placeholder="紹介者や特記事項など"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inactive"
                checked={isInactive}
                onCheckedChange={(checked) => setIsInactive(checked === true)}
              />
              <Label htmlFor="inactive" className="cursor-pointer">
                非アクティブ
              </Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              非アクティブにすると、この顧客は検索結果から除外されます。
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                削除
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>顧客を削除</DialogTitle>
                <DialogDescription>
                  この顧客を削除してもよろしいですか？この操作は取り消せません。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="cursor-pointer"
                >
                  キャンセル
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="cursor-pointer text-destructive hover:text-destructive"
                >
                  削除
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button type="submit" variant="outline" className="cursor-pointer">
            更新する
          </Button>
        </div>
      </form>
    </div>
  );
}
