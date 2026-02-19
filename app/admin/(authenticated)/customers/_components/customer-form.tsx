"use client";

import { useState, useTransition } from "react";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Stack } from "@/components/ui/stack";
import { SectionHeading } from "@/components/ui/section-heading";
import { PageHeader } from "@/components/ui/page-header";
import { ActionButton } from "@/components/ui/action-button";
import { DatePickerWithInput } from "@/components/ui/date-picker-with-input";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import {
  AUDIT_MEMBER_TYPES,
  JOB_CHANGE_INTENT_OPTIONS,
} from "@/lib/constants/customer";
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/lib/actions/customer.actions";
import type { ActionResult } from "@/lib/actions/customer.actions";

// ============================================================
// 型定義
// ============================================================

interface MasterData {
  id: number;
  name: string;
}

interface CommunityData {
  id: number;
  code: string;
  name: string;
}

interface InitialCommunityData {
  communityId: number;
  joinedAt: string | null;
  resignedAt: string | null;
  auditMemberType: string | null;
  auditMemberPremium: boolean | null;
  affiliationId: number | null;
  originIndustryId: number | null;
  membershipQualificationId: number | null;
}

interface InitialData {
  id: number;
  firstName: string;
  lastName: string;
  firstNameKana: string | null;
  lastNameKana: string | null;
  email: string;
  subEmails: string[];
  company: string | null;
  phone: string | null;
  postalCode: string | null;
  prefectureId: number | null;
  city: string | null;
  gender: string | null;
  listingCategoryId: number | null;
  memberCategory: string | null;
  contractType: string | null;
  jobChangeIntent: string | null;
  note: string | null;
  communities: InitialCommunityData[];
}

interface CustomerFormProps {
  mode: "create" | "edit";
  initialData?: InitialData;
  communities: CommunityData[];
  prefectures: MasterData[];
  listingCategories: MasterData[];
  originIndustries: MasterData[];
  membershipQualifications: MasterData[];
  affiliations: MasterData[];
  isSuper: boolean;
  scopedCommunityIds: number[];
}

// ============================================================
// 定数
// ============================================================

const NONE_VALUE = "__none__";

// ============================================================
// ヘルパー
// ============================================================

function findCommunityByCode(communities: CommunityData[], code: string): CommunityData | undefined {
  return communities.find((c) => c.code === code);
}

function getInitialCommunityData(
  initialData: InitialData | undefined,
  communityId: number
): InitialCommunityData | undefined {
  return initialData?.communities.find((c) => c.communityId === communityId);
}

function parseDateStr(dateStr: string | null | undefined): Date | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? undefined : d;
}

function dateToIsoString(date: Date | undefined): string | null {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ============================================================
// コンポーネント
// ============================================================

export function CustomerForm({
  mode,
  initialData,
  communities,
  prefectures,
  listingCategories,
  originIndustries,
  membershipQualifications,
  affiliations,
  isSuper,
  scopedCommunityIds,
}: CustomerFormProps) {
  const [isPending, startTransition] = useTransition();

  // コミュニティ情報
  const auditCommunity = findCommunityByCode(communities, "venture_auditor");
  const naikanCommunity = findCommunityByCode(communities, "naikan_meetup");
  const aiCommunity = findCommunityByCode(communities, "ai_club");

  // コミュニティのスコープ内チェック
  const canAccessAudit = isSuper || (auditCommunity && scopedCommunityIds.includes(auditCommunity.id));
  const canAccessNaikan = isSuper || (naikanCommunity && scopedCommunityIds.includes(naikanCommunity.id));
  const canAccessAi = isSuper || (aiCommunity && scopedCommunityIds.includes(aiCommunity.id));

  // 初期値
  const auditInitial = auditCommunity ? getInitialCommunityData(initialData, auditCommunity.id) : undefined;
  const naikanInitial = naikanCommunity ? getInitialCommunityData(initialData, naikanCommunity.id) : undefined;
  const aiInitial = aiCommunity ? getInitialCommunityData(initialData, aiCommunity.id) : undefined;

  // コミュニティ選択状態
  const [auditChecked, setAuditChecked] = useState(!!auditInitial);
  const [naikanChecked, setNaikanChecked] = useState(!!naikanInitial);
  const [aiChecked, setAiChecked] = useState(!!aiInitial);

  const anyCommunityChecked = auditChecked || naikanChecked || aiChecked;

  // 会員区分・契約主体
  const [memberCategory, setMemberCategory] = useState<string>(
    initialData?.memberCategory ?? "member"
  );
  const [contractType, setContractType] = useState<string>(
    initialData?.contractType ?? "corporate"
  );

  // ベンチャー監査役の会
  const [auditMemberType, setAuditMemberType] = useState(auditInitial?.auditMemberType || "regular");
  const [auditMemberPremium, setAuditMemberPremium] = useState(auditInitial?.auditMemberPremium ?? false);
  const [auditJoinedAt, setAuditJoinedAt] = useState<Date | undefined>(parseDateStr(auditInitial?.joinedAt));
  const [auditResignedAt, setAuditResignedAt] = useState<Date | undefined>(parseDateStr(auditInitial?.resignedAt));
  const [originIndustryId, setOriginIndustryId] = useState<number | undefined>(auditInitial?.originIndustryId ?? undefined);
  const [membershipQualificationId, setMembershipQualificationId] = useState<number | undefined>(auditInitial?.membershipQualificationId ?? undefined);

  // ないかんMeetup
  const [naikanAffiliationId, setNaikanAffiliationId] = useState<number | undefined>(naikanInitial?.affiliationId ?? undefined);
  const [naikanJoinedAt, setNaikanJoinedAt] = useState<Date | undefined>(parseDateStr(naikanInitial?.joinedAt));
  const [naikanResignedAt, setNaikanResignedAt] = useState<Date | undefined>(parseDateStr(naikanInitial?.resignedAt));

  // AI部会
  const [aiAffiliationId, setAiAffiliationId] = useState<number | undefined>(aiInitial?.affiliationId ?? undefined);
  const [aiJoinedAt, setAiJoinedAt] = useState<Date | undefined>(parseDateStr(aiInitial?.joinedAt));
  const [aiResignedAt, setAiResignedAt] = useState<Date | undefined>(parseDateStr(aiInitial?.resignedAt));

  // プロフィール
  const [firstName, setFirstName] = useState(initialData?.firstName ?? "");
  const [lastName, setLastName] = useState(initialData?.lastName ?? "");
  const [firstNameKana, setFirstNameKana] = useState(initialData?.firstNameKana ?? "");
  const [lastNameKana, setLastNameKana] = useState(initialData?.lastNameKana ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [subEmails, setSubEmails] = useState<string[]>(initialData?.subEmails ?? []);
  const [company, setCompany] = useState(initialData?.company ?? "");
  const [listingCategoryId, setListingCategoryId] = useState<number | undefined>(initialData?.listingCategoryId ?? undefined);
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [postalCode, setPostalCode] = useState(initialData?.postalCode ?? "");
  const [prefectureId, setPrefectureId] = useState<number | undefined>(initialData?.prefectureId ?? undefined);
  const [city, setCity] = useState(initialData?.city ?? "");
  const [gender, setGender] = useState(initialData?.gender ?? "");
  const [jobChangeIntent, setJobChangeIntent] = useState(initialData?.jobChangeIntent ?? "");
  const [note, setNote] = useState(initialData?.note ?? "");

  // エラー状態
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // サブメール操作
  const handleAddSubEmail = () => {
    if (subEmails.length < 3) {
      setSubEmails([...subEmails, ""]);
    }
  };

  const handleRemoveSubEmail = (index: number) => {
    setSubEmails(subEmails.filter((_, i) => i !== index));
  };

  const handleSubEmailChange = (index: number, value: string) => {
    const updated = [...subEmails];
    updated[index] = value;
    setSubEmails(updated);
  };

  // フォーム送信
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    // ベンチャー監査役の会・会員の場合、会員種別は必須
    if (auditChecked && memberCategory === "member" && !auditMemberType) {
      toast.error("会員種別を選択してください");
      return;
    }

    // コミュニティデータ構築
    const communitiesData: Array<{
      communityId: number;
      joinedAt: string | null;
      resignedAt: string | null;
      auditMemberType: string | null;
      auditMemberPremium: boolean | null;
      affiliationId: number | null;
      originIndustryId: number | null;
      membershipQualificationId: number | null;
    }> = [];

    if (auditChecked && auditCommunity) {
      communitiesData.push({
        communityId: auditCommunity.id,
        joinedAt: dateToIsoString(auditJoinedAt),
        resignedAt: dateToIsoString(auditResignedAt),
        auditMemberType: memberCategory === "member" ? (auditMemberType || null) : null,
        auditMemberPremium: memberCategory === "member" ? auditMemberPremium : null,
        affiliationId: null,
        originIndustryId: originIndustryId || null,
        membershipQualificationId: membershipQualificationId || null,
      });
    }

    if (naikanChecked && naikanCommunity) {
      communitiesData.push({
        communityId: naikanCommunity.id,
        joinedAt: dateToIsoString(naikanJoinedAt),
        resignedAt: dateToIsoString(naikanResignedAt),
        auditMemberType: null,
        auditMemberPremium: null,
        affiliationId: naikanAffiliationId || null,
        originIndustryId: null,
        membershipQualificationId: null,
      });
    }

    if (aiChecked && aiCommunity) {
      communitiesData.push({
        communityId: aiCommunity.id,
        joinedAt: dateToIsoString(aiJoinedAt),
        resignedAt: dateToIsoString(aiResignedAt),
        auditMemberType: null,
        auditMemberPremium: null,
        affiliationId: aiAffiliationId || null,
        originIndustryId: null,
        membershipQualificationId: null,
      });
    }

    const formData = {
      firstName,
      lastName,
      firstNameKana: firstNameKana || "",
      lastNameKana: lastNameKana || "",
      email,
      subEmails: subEmails.filter((e) => e.trim() !== ""),
      company,
      phone,
      postalCode,
      prefectureId: prefectureId || null,
      city,
      gender: gender || null,
      listingCategoryId: listingCategoryId || null,
      memberCategory: anyCommunityChecked ? memberCategory : null,
      contractType: anyCommunityChecked ? contractType : null,
      jobChangeIntent: jobChangeIntent || null,
      note,
      communities: communitiesData,
    };

    startTransition(async () => {
      try {
        let result: ActionResult | void;
        if (mode === "create") {
          result = await createCustomerAction(formData);
        } else {
          result = await updateCustomerAction(initialData!.id, formData);
        }

        // redirect が成功した場合はここに来ない
        if (result?.fieldErrors) {
          setFieldErrors(result.fieldErrors);
          toast.error("入力内容に誤りがあります");
        } else if (result?.error) {
          setGeneralError(result.error);
          toast.error(result.error);
        }
      } catch (err) {
        // redirect() は例外を投げるので、NEXT_REDIRECT は正常動作
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
          toast.success(mode === "create" ? "顧客情報を登録しました" : "顧客情報を更新しました");
          return;
        }
        toast.error("エラーが発生しました");
      }
    });
  };

  const pageTitle = mode === "create" ? "顧客登録" : "顧客編集";
  const pageDescription = mode === "create"
    ? "新しい顧客情報をシステムに登録します。"
    : initialData
      ? `${initialData.lastName} ${initialData.firstName}さんの情報を編集します。`
      : "顧客情報を編集します。";
  const submitLabel = mode === "create" ? "登録" : "更新";

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        backHref={mode === "edit" ? `/admin/customers/${initialData?.id}` : "/admin/customers"}
        title={pageTitle}
        description={pageDescription}
      />

      {generalError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <Stack gap="lg">
          <SectionHeading>会員情報</SectionHeading>

          {/* コミュニティ選択 */}
          <div className="grid gap-2">
            <Label>コミュニティ</Label>
            <div className="flex items-center gap-6">
              {canAccessAudit && (
                <CheckboxItem
                  id="audit-community"
                  label="ベンチャー監査役の会"
                  checked={auditChecked}
                  onCheckedChange={setAuditChecked}
                />
              )}
              {canAccessNaikan && (
                <CheckboxItem
                  id="naikan-community"
                  label="ないかんMeetup"
                  checked={naikanChecked}
                  onCheckedChange={setNaikanChecked}
                />
              )}
              {canAccessAi && (
                <CheckboxItem
                  id="ai-community"
                  label="AI部会"
                  checked={aiChecked}
                  onCheckedChange={setAiChecked}
                />
              )}
            </div>
            {isSuper && (
              <p className="text-xs text-muted-foreground">
                何も選択しない場合は非会員として登録されます
              </p>
            )}
          </div>

          {/* 会員区分・詳細 */}
          {anyCommunityChecked && (
            <>
              {/* 契約主体 */}
              <div className="grid gap-2">
                <Label>契約主体 <span className="text-destructive">*</span></Label>
                <RadioGroup value={contractType} onValueChange={setContractType}>
                  <div className="flex items-center gap-6">
                    <RadioItem value="corporate" label="法人" />
                    <RadioItem value="individual" label="個人" />
                  </div>
                </RadioGroup>
              </div>

              {/* 会員区分 */}
              <div className="grid gap-2">
                <Label>会員区分 <span className="text-destructive">*</span></Label>
                <RadioGroup value={memberCategory} onValueChange={setMemberCategory}>
                  <div className="flex items-center gap-6">
                    <RadioItem value="member" label="会員" />
                    <RadioItem value="sponsor" label="スポンサー" />
                    <RadioItem value="observer" label="オブザーバー" />
                  </div>
                </RadioGroup>
              </div>

              {/* ベンチャー監査役の会 詳細 */}
              {auditChecked && (
                <div className="rounded-lg border p-4 space-y-6 bg-slate-50">
                  <div className="space-y-3">
                    <Label>ベンチャー監査役の会</Label>
                    <div className="border-b border-border" />
                  </div>

                  {memberCategory === "member" && (
                    <div className="grid gap-2">
                      <Label>会員種別 <span className="text-destructive">*</span></Label>
                      <div className="flex items-center gap-4">
                        <Select value={auditMemberType} onValueChange={setAuditMemberType}>
                          <SelectTrigger className="w-[300px] bg-white">
                            <SelectValue placeholder="会員種別を選択" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            {AUDIT_MEMBER_TYPES.map((type) => (
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
                          onCheckedChange={setAuditMemberPremium}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label>入会資格</Label>
                    <Select
                      value={membershipQualificationId ? String(membershipQualificationId) : NONE_VALUE}
                      onValueChange={(v) => setMembershipQualificationId(v === NONE_VALUE ? undefined : Number(v))}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value={NONE_VALUE} className="bg-white hover:bg-gray-100 text-muted-foreground">選択してください</SelectItem>
                        {membershipQualifications.map((q) => (
                          <SelectItem key={q.id} value={String(q.id)} className="bg-white hover:bg-gray-100">{q.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>出身業種</Label>
                    <Select
                      value={originIndustryId ? String(originIndustryId) : NONE_VALUE}
                      onValueChange={(v) => setOriginIndustryId(v === NONE_VALUE ? undefined : Number(v))}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value={NONE_VALUE} className="bg-white hover:bg-gray-100 text-muted-foreground">選択してください</SelectItem>
                        {originIndustries.map((i) => (
                          <SelectItem key={i.id} value={String(i.id)} className="bg-white hover:bg-gray-100">{i.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="入会日">
                      <DatePickerWithInput date={auditJoinedAt} setDate={setAuditJoinedAt} />
                    </FormField>
                    <FormField label="脱退日">
                      <DatePickerWithInput date={auditResignedAt} setDate={setAuditResignedAt} />
                    </FormField>
                  </div>
                </div>
              )}

              {/* ないかんMeetup 詳細 */}
              {naikanChecked && (
                <div className="rounded-lg border p-4 space-y-6 bg-slate-50">
                  <div className="space-y-3">
                    <Label>ないかんMeetup</Label>
                    <div className="border-b border-border" />
                  </div>

                  <div className="grid gap-2">
                    <Label>所属</Label>
                    <Select
                      value={naikanAffiliationId ? String(naikanAffiliationId) : NONE_VALUE}
                      onValueChange={(v) => setNaikanAffiliationId(v === NONE_VALUE ? undefined : Number(v))}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value={NONE_VALUE} className="bg-white hover:bg-gray-100 text-muted-foreground">選択してください</SelectItem>
                        {affiliations.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)} className="bg-white hover:bg-gray-100">{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="入会日">
                      <DatePickerWithInput date={naikanJoinedAt} setDate={setNaikanJoinedAt} />
                    </FormField>
                    <FormField label="脱退日">
                      <DatePickerWithInput date={naikanResignedAt} setDate={setNaikanResignedAt} />
                    </FormField>
                  </div>
                </div>
              )}

              {/* AI部会 詳細 */}
              {aiChecked && (
                <div className="rounded-lg border p-4 space-y-6 bg-slate-50">
                  <div className="space-y-3">
                    <Label>AI部会</Label>
                    <div className="border-b border-border" />
                  </div>

                  <div className="grid gap-2">
                    <Label>所属</Label>
                    <Select
                      value={aiAffiliationId ? String(aiAffiliationId) : NONE_VALUE}
                      onValueChange={(v) => setAiAffiliationId(v === NONE_VALUE ? undefined : Number(v))}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value={NONE_VALUE} className="bg-white hover:bg-gray-100 text-muted-foreground">選択してください</SelectItem>
                        {affiliations.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)} className="bg-white hover:bg-gray-100">{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="入会日">
                      <DatePickerWithInput date={aiJoinedAt} setDate={setAiJoinedAt} />
                    </FormField>
                    <FormField label="脱退日">
                      <DatePickerWithInput date={aiResignedAt} setDate={setAiResignedAt} />
                    </FormField>
                  </div>
                </div>
              )}
            </>
          )}

          {/* プロフィール */}
          <SectionHeading>プロフィール</SectionHeading>

          <div className="grid grid-cols-2 gap-6">
            <FormField label="姓" required id="lastName" error={fieldErrors["lastName"]?.[0]}>
              <Input
                placeholder="例: 山田"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </FormField>
            <FormField label="名" required id="firstName" error={fieldErrors["firstName"]?.[0]}>
              <Input
                placeholder="例: 太郎"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <FormField label="セイ">
              <Input
                placeholder="例: ヤマダ"
                value={lastNameKana}
                onChange={(e) => setLastNameKana(e.target.value)}
              />
            </FormField>
            <FormField label="メイ">
              <Input
                placeholder="例: タロウ"
                value={firstNameKana}
                onChange={(e) => setFirstNameKana(e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">
              メールアドレス <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="flex-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
            {fieldErrors["email"] && (
              <p className="text-sm text-destructive">{fieldErrors["email"][0]}</p>
            )}
            {subEmails.map((sub, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="email"
                  placeholder={`サブメールアドレス ${index + 1}`}
                  value={sub}
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
              onChange={(e) => setCompany(e.target.value)}
            />
          </FormField>

          <FormField label="上場区分">
            <Select
              value={listingCategoryId ? String(listingCategoryId) : NONE_VALUE}
              onValueChange={(v) => setListingCategoryId(v === NONE_VALUE ? undefined : Number(v))}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value={NONE_VALUE} className="bg-white hover:bg-gray-100 text-muted-foreground">選択してください</SelectItem>
                {listingCategories.map((option) => (
                  <SelectItem
                    key={option.id}
                    value={String(option.id)}
                    className="bg-white hover:bg-gray-100"
                  >
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="電話番号">
            <Input
              type="tel"
              placeholder="例: 0312345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </FormField>

          <FormField label="郵便番号">
            <Input
              type="text"
              placeholder="例: 1234567"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </FormField>

          <FormField label="都道府県">
            <Select
              value={prefectureId ? String(prefectureId) : NONE_VALUE}
              onValueChange={(v) => setPrefectureId(v === NONE_VALUE ? undefined : Number(v))}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value={NONE_VALUE} className="bg-white hover:bg-gray-100 text-muted-foreground">選択してください</SelectItem>
                {prefectures.map((pref) => (
                  <SelectItem key={pref.id} value={String(pref.id)} className="bg-white hover:bg-gray-100">
                    {pref.name}
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
              onChange={(e) => setCity(e.target.value)}
            />
          </FormField>

          <div className="grid gap-2">
            <Label>性別</Label>
            <RadioGroup value={gender} onValueChange={setGender}>
              <div className="flex items-center gap-6">
                <RadioItem value="male" label="男性" />
                <RadioItem value="female" label="女性" />
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label>転職意欲</Label>
            <RadioGroup value={jobChangeIntent} onValueChange={setJobChangeIntent}>
              <div className="flex items-center gap-6">
                {JOB_CHANGE_INTENT_OPTIONS.map((opt) => (
                  <RadioItem key={opt.value} value={opt.value} id={`job-${opt.value}`} label={opt.label} />
                ))}
              </div>
            </RadioGroup>
          </div>

          <FormField label="備考">
            <Textarea
              placeholder="紹介者や特記事項など"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-32"
            />
          </FormField>
        </Stack>

        <div className="flex justify-center">
          <ActionButton type="submit" disabled={isPending}>
            {isPending ? "処理中..." : submitLabel}
          </ActionButton>
        </div>
      </form>
    </div>
  );
}
