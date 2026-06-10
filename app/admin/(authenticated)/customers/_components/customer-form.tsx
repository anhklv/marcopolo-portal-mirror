"use client";

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
import { FormField } from "@/components/ui/form-field";
import { Stack } from "@/components/ui/stack";
import { SectionHeading } from "@/components/ui/section-heading";
import { PageHeader } from "@/components/ui/page-header";
import { ActionButton } from "@/components/ui/action-button";
import { Plus, X } from "lucide-react";
import { JOB_CHANGE_INTENT_OPTIONS } from "@/lib/constants/customer";
import type { MasterData, CommunityOption, ListingCategoryOption } from "@/lib/types/serialized";
import { useCustomerForm } from "./use-customer-form";
import type { InitialData } from "./use-customer-form";
import { AuditCommunityFields } from "./audit-community-fields";
import { SimpleCommunityFields } from "./simple-community-fields";
import { NONE_VALUE } from "@/lib/constants/form";

interface CustomerFormProps {
  mode: "create" | "edit";
  initialData?: InitialData;
  communities: CommunityOption[];
  prefectures: MasterData[];
  listingCategories: ListingCategoryOption[];
  originIndustries: MasterData[];
  membershipQualifications: MasterData[];
  affiliations: MasterData[];
  isSuper: boolean;
  scopedCommunityIds: number[];
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
  const form = useCustomerForm({
    mode,
    initialData,
    communities,
    isSuper,
    scopedCommunityIds,
  });

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

      {form.generalError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {form.generalError}
        </div>
      )}

      <form onSubmit={form.handleSubmit} className="space-y-8">
        <Stack gap="lg">
          <SectionHeading>会員情報</SectionHeading>

          {/* コミュニティ選択 */}
          <div className="grid gap-2">
            <Label>コミュニティ</Label>
            <div className="flex items-center gap-6">
              {form.canAccessAudit && (
                <CheckboxItem
                  id="audit-community"
                  label="ベンチャー監査役の会"
                  checked={form.auditChecked}
                  onCheckedChange={form.setAuditChecked}
                />
              )}
              {form.canAccessNaikan && (
                <CheckboxItem
                  id="naikan-community"
                  label="ないかんMeetup"
                  checked={form.naikanChecked}
                  onCheckedChange={form.setNaikanChecked}
                />
              )}
              {form.canAccessAi && (
                <CheckboxItem
                  id="ai-community"
                  label="AI部会"
                  checked={form.aiChecked}
                  onCheckedChange={form.setAiChecked}
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
          {form.anyCommunityChecked && (
            <>
              {/* 契約主体 */}
              <div className="grid gap-2">
                <Label>契約主体 <span className="text-destructive">*</span></Label>
                <RadioGroup value={form.contractType} onValueChange={form.setContractType}>
                  <div className="flex items-center gap-6">
                    <RadioItem value="corporate" label="法人" />
                    <RadioItem value="individual" label="個人" />
                  </div>
                </RadioGroup>
              </div>

              {/* 会員区分 */}
              <div className="grid gap-2">
                <Label>会員区分 <span className="text-destructive">*</span></Label>
                <RadioGroup value={form.memberCategory} onValueChange={form.setMemberCategory}>
                  <div className="flex items-center gap-6">
                    <RadioItem value="member" label="会員" />
                    <RadioItem value="sponsor" label="スポンサー" />
                    <RadioItem value="observer" label="オブザーバー" />
                  </div>
                </RadioGroup>
              </div>

              {/* ベンチャー監査役の会 詳細 */}
              {form.canAccessAudit && form.auditChecked && (
                <AuditCommunityFields
                  memberCategory={form.memberCategory}
                  auditMemberType={form.auditMemberType}
                  setAuditMemberType={form.setAuditMemberType}
                  auditMemberPremium={form.auditMemberPremium}
                  setAuditMemberPremium={form.setAuditMemberPremium}
                  membershipQualificationId={form.membershipQualificationId}
                  setMembershipQualificationId={form.setMembershipQualificationId}
                  originIndustryId={form.originIndustryId}
                  setOriginIndustryId={form.setOriginIndustryId}
                  auditJoinedAt={form.auditJoinedAt}
                  setAuditJoinedAt={(v) => { form.setAuditJoinedAt(v); form.clearFieldError("auditJoinedAt"); }}
                  auditResignedAt={form.auditResignedAt}
                  setAuditResignedAt={(v) => { form.setAuditResignedAt(v); form.clearFieldError("auditResignedAt"); }}
                  joinedAtError={form.fieldErrors["auditJoinedAt"]?.[0]}
                  resignedAtError={form.fieldErrors["auditResignedAt"]?.[0]}
                  membershipQualifications={membershipQualifications}
                  originIndustries={originIndustries}
                />
              )}

              {/* ないかんMeetup 詳細 */}
              {form.canAccessNaikan && form.naikanChecked && (
                <SimpleCommunityFields
                  label="ないかんMeetup"
                  affiliationId={form.naikanAffiliationId}
                  setAffiliationId={form.setNaikanAffiliationId}
                  joinedAt={form.naikanJoinedAt}
                  setJoinedAt={(v) => { form.setNaikanJoinedAt(v); form.clearFieldError("naikanJoinedAt"); }}
                  resignedAt={form.naikanResignedAt}
                  setResignedAt={(v) => { form.setNaikanResignedAt(v); form.clearFieldError("naikanResignedAt"); }}
                  joinedAtError={form.fieldErrors["naikanJoinedAt"]?.[0]}
                  resignedAtError={form.fieldErrors["naikanResignedAt"]?.[0]}
                  affiliations={affiliations}
                />
              )}

              {/* AI部会 詳細 */}
              {form.canAccessAi && form.aiChecked && (
                <SimpleCommunityFields
                  label="AI部会"
                  affiliationId={form.aiAffiliationId}
                  setAffiliationId={form.setAiAffiliationId}
                  joinedAt={form.aiJoinedAt}
                  setJoinedAt={(v) => { form.setAiJoinedAt(v); form.clearFieldError("aiJoinedAt"); }}
                  resignedAt={form.aiResignedAt}
                  setResignedAt={(v) => { form.setAiResignedAt(v); form.clearFieldError("aiResignedAt"); }}
                  joinedAtError={form.fieldErrors["aiJoinedAt"]?.[0]}
                  resignedAtError={form.fieldErrors["aiResignedAt"]?.[0]}
                  affiliations={affiliations}
                />
              )}
            </>
          )}

          {/* プロフィール */}
          <SectionHeading>プロフィール</SectionHeading>

          <div className="grid grid-cols-2 items-start gap-6">
            <FormField label="姓" required id="lastName" error={form.fieldErrors["lastName"]?.[0]}>
              <Input
                placeholder="例: 山田"
                value={form.lastName}
                onChange={(e) => { form.setLastName(e.target.value); form.clearFieldError("lastName"); }}
              />
            </FormField>
            <FormField label="名" required id="firstName" error={form.fieldErrors["firstName"]?.[0]}>
              <Input
                placeholder="例: 太郎"
                value={form.firstName}
                onChange={(e) => { form.setFirstName(e.target.value); form.clearFieldError("firstName"); }}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 items-start gap-6">
            <FormField label="セイ" error={form.fieldErrors["lastNameKana"]?.[0]}>
              <Input
                placeholder="例: ヤマダ"
                value={form.lastNameKana}
                onChange={(e) => form.setLastNameKana(e.target.value)}
                onBlur={form.handleLastNameKanaBlur}
              />
            </FormField>
            <FormField label="メイ" error={form.fieldErrors["firstNameKana"]?.[0]}>
              <Input
                placeholder="例: タロウ"
                value={form.firstNameKana}
                onChange={(e) => form.setFirstNameKana(e.target.value)}
                onBlur={form.handleFirstNameKanaBlur}
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
                aria-invalid={!!form.fieldErrors["email"]}
                value={form.email}
                onChange={(e) => { form.setEmail(e.target.value); form.clearFieldError("email"); }}
              />
              {form.subEmails.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={form.handleAddSubEmail}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            {form.fieldErrors["email"] && (
              <p className="text-sm text-destructive">{form.fieldErrors["email"][0]}</p>
            )}
            {form.subEmails.map((sub, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="email"
                  placeholder={`サブメールアドレス ${index + 1}`}
                  value={sub}
                  onChange={(e) => form.handleSubEmailChange(index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => form.handleRemoveSubEmail(index)}
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
              value={form.company}
              onChange={(e) => form.setCompany(e.target.value)}
            />
          </FormField>

          <FormField label="上場区分">
            <Select
              value={form.listingCategoryId ? String(form.listingCategoryId) : NONE_VALUE}
              onValueChange={(v) => form.setListingCategoryId(v === NONE_VALUE ? undefined : Number(v))}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="----" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value={NONE_VALUE} className="bg-white hover:bg-gray-100">----</SelectItem>
                {/* グループなし（未上場・その他） */}
                {listingCategories
                  .filter((lc) => lc.stockExchangeName === "")
                  .map((lc) => (
                    <SelectItem key={lc.id} value={String(lc.id)} className="bg-white hover:bg-gray-100">
                      {lc.marketName}
                    </SelectItem>
                  ))}
                {/* 取引所別グループ */}
                {[...new Set(listingCategories.map((lc) => lc.stockExchangeName).filter(Boolean))].map((exchangeName) => {
                  const items = listingCategories.filter((lc) => lc.stockExchangeName === exchangeName);
                  return (
                    <SelectGroup key={exchangeName}>
                      <SelectLabel className="bg-gray-100">{exchangeName}</SelectLabel>
                      {items.map((lc) => (
                        <SelectItem key={lc.id} value={String(lc.id)} className="bg-white hover:bg-gray-100">
                          {lc.marketName}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="電話番号" error={form.fieldErrors["phone"]?.[0]}>
            <Input
              type="tel"
              placeholder="例: 0312345678"
              value={form.phone}
              onChange={(e) => form.setPhone(e.target.value)}
              onBlur={form.handlePhoneBlur}
            />
          </FormField>

          <FormField label="郵便番号" error={form.fieldErrors["postalCode"]?.[0]}>
            <Input
              type="text"
              placeholder="例: 1234567"
              value={form.postalCode}
              onChange={(e) => form.setPostalCode(e.target.value)}
              onBlur={form.handlePostalCodeBlur}
            />
          </FormField>

          <FormField label="都道府県">
            <Select
              value={form.prefectureId ? String(form.prefectureId) : NONE_VALUE}
              onValueChange={(v) => form.setPrefectureId(v === NONE_VALUE ? undefined : Number(v))}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="----" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value={NONE_VALUE} className="bg-white hover:bg-gray-100">----</SelectItem>
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
              value={form.city}
              onChange={(e) => form.setCity(e.target.value)}
            />
          </FormField>

          <div className="grid gap-2">
            <Label>性別</Label>
            <RadioGroup value={form.gender} onValueChange={form.setGender}>
              <div className="flex items-center gap-6">
                <RadioItem value="male" label="男性" />
                <RadioItem value="female" label="女性" />
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label>転職意欲</Label>
            <RadioGroup value={form.jobChangeIntent} onValueChange={form.setJobChangeIntent}>
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
              value={form.note}
              onChange={(e) => form.setNote(e.target.value)}
              className="min-h-32"
            />
          </FormField>
        </Stack>

        <div className="flex justify-center">
          <ActionButton type="submit" disabled={form.isPending}>
            {form.isPending ? "処理中..." : submitLabel}
          </ActionButton>
        </div>
      </form>
    </div>
  );
}
