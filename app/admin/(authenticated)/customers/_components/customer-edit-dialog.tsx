"use client";

import { Plus, TriangleAlert, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { RadioItem } from "@/components/ui/radio-item";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { JOB_CHANGE_INTENT_OPTIONS } from "@/lib/constants/customer";
import {
  CUSTOMER_CSV_FIELD_ORDER,
  clearCsvIssues,
  clearCsvIssuesForFieldChange,
  isCsvIssueApplicable,
  rebuildPayload,
  type PreviewCustomer,
} from "./customer-csv-types";
import type {
  CommunityOption,
  ListingCategoryOption,
  MasterData,
} from "@/lib/types/serialized";
import { NONE_VALUE } from "@/lib/constants/form";
import { AuditCommunityFields } from "./audit-community-fields";
import { SimpleCommunityFields } from "./simple-community-fields";
import { COMMUNITY_CODE } from "@/lib/constants/community";

interface Props {
  customer: PreviewCustomer | null;
  onOpenChange: (open: boolean) => void;
  onChange: (customer: PreviewCustomer) => void;
  onSave: () => void | Promise<void>;
  prefectures: MasterData[];
  listingCategories: ListingCategoryOption[];
  departments: MasterData[];
  originIndustries: MasterData[];
  membershipQualifications: MasterData[];
  affiliations: MasterData[];
  communities: CommunityOption[];
  isSuper: boolean;
  scopedCommunityIds: number[];
}

const PLACEHOLDERS: Record<string, string> = {
  姓: "例: 山田",
  名: "例: 太郎",
  セイ: "例: ヤマダ",
  メイ: "例: タロウ",
  メールアドレス: "name@example.com",
  サブメール1: "sub1@example.com",
  サブメール2: "sub2@example.com",
  サブメール3: "sub3@example.com",
  会社名: "例: 株式会社マルコポーロ",
  電話番号: "例: 0312345678",
  郵便番号: "例: 1234567",
  都道府県: "例: 東京都",
  市区町村以下: "例: 千代田区丸の内1-1-1",
};

export function CustomerEditDialog({
  customer,
  onOpenChange,
  onChange,
  onSave,
  prefectures,
  listingCategories,
  departments,
  originIndustries,
  membershipQualifications,
  affiliations,
  communities,
  isSuper,
  scopedCommunityIds,
}: Props) {
  const set = <K extends keyof PreviewCustomer>(
    key: K,
    value: PreviewCustomer[K],
  ) =>
    customer &&
    onChange(
      clearCsvIssuesForFieldChange({ ...customer, [key]: value }, key, value),
    );
  const update = (
    patch: Partial<PreviewCustomer>,
    correctedKeys: Array<keyof PreviewCustomer>,
  ) =>
    customer &&
    onChange(clearCsvIssues({ ...customer, ...patch }, correctedKeys));
  const anyCommunity = !!(
    customer?.auditCommunity ||
    customer?.naikanCommunity ||
    customer?.aiCommunity
  );
  const canAccess = (code: string) => {
    const community = communities.find((item) => item.code === code);
    return !!(
      community &&
      (isSuper || scopedCommunityIds.includes(community.id))
    );
  };
  const validatedCustomer = customer
    ? rebuildPayload(customer, {
      communities,
      departments,
      isSuper,
      scopedCommunityIds,
    })
    : undefined;
  const validationError = validatedCustomer?.error;
  // Get all warning each field
  // const warningSummary = (customer?.csvIssues ?? [])
  //   .filter((issue) => isCsvIssueApplicable(customer!, issue.key))
  //   .sort(
  //     (a, b) =>
  //       CUSTOMER_CSV_FIELD_ORDER.indexOf(a.key) -
  //       CUSTOMER_CSV_FIELD_ORDER.indexOf(b.key),
  //   )
  //   .map((issue) => issue.message)
  //   .filter(
  //     (warning, index, warnings) =>
  //       warnings.findIndex((candidate) => candidate === warning) === index,
  //   );
  // Get the first warning each field
  const warningSummary = [...(customer?.csvIssues ?? [])]
    .filter((issue) => isCsvIssueApplicable(customer!, issue.key))
    .sort(
      (a, b) =>
        CUSTOMER_CSV_FIELD_ORDER.indexOf(a.key) -
        CUSTOMER_CSV_FIELD_ORDER.indexOf(b.key),
    )
    .filter(
      (issue, index, issues) =>
        issues.findIndex((candidate) => candidate.key === issue.key) === index,
    )
    .map((issue) => issue.message);
  const errorFor = (key: keyof PreviewCustomer) =>
    validatedCustomer?.fieldErrors?.[key]?.[0];
  const departmentError = errorFor("affiliationInternalAudit");
  const visibleSubEmails = customer
    ? (customer.visibleSubEmailCount ??
      [customer.subEmail1, customer.subEmail2, customer.subEmail3].reduce(
        (count, value, index) => (value ? index + 1 : count),
        0,
      ))
    : 0;
  return (
    <Dialog open={customer !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden bg-card p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          <DialogTitle>{customer?.id}行目のデータを編集</DialogTitle>
          <DialogDescription>
            CSVから読み込んだ顧客情報を修正します。
          </DialogDescription>
        </DialogHeader>
        {customer && (
          <div className="overflow-y-auto px-6 py-5">
            <div className="space-y-8">
              {warningSummary.length > 0 && (
                <div
                  role="status"
                  className="space-y-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                >
                  <p className="flex items-center gap-2 font-medium">
                    <TriangleAlert className="h-4 w-4 shrink-0" />
                    CSVの入力内容に警告があります
                  </p>
                  <p className="text-xs">
                    不正な値には初期値が設定されています。必要に応じて修正してください。
                  </p>
                  <ul className="list-disc space-y-1 pl-5">
                    {warningSummary.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* {errorSummary.length > 0 && (
                <div
                  role="alert"
                  className="space-y-2 border border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  <p className="font-medium">入力内容にエラーがあります</p>
                  <ul className="list-disc space-y-1 pl-5">
                    {errorSummary.map(({ label, message }) => (
                      <li key={`${label}:${message}`}>
                        <span className="font-medium">{label}:</span> {message}
                      </li>
                    ))}
                  </ul>
                </div>
              )} */}
              <SectionHeading>会員情報</SectionHeading>
              <div className="grid gap-2">
                <Label>コミュニティ</Label>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {(canAccess(COMMUNITY_CODE.VENTURE_AUDITOR) ||
                    customer.auditCommunity) && (
                      <CheckboxItem
                        id="csv-audit"
                        label="ベンチャー監査役の会"
                        checked={customer.auditCommunity}
                        onCheckedChange={(v) => set("auditCommunity", v)}
                      // aria-invalid={!!communityError}
                      // aria-describedby={communityError ? "csv-community-error" : undefined}
                      />
                    )}
                  {(canAccess(COMMUNITY_CODE.NAIKAN_MEETUP) ||
                    customer.naikanCommunity) && (
                      <CheckboxItem
                        id="csv-naikan"
                        label="ないかんMeetup"
                        checked={customer.naikanCommunity}
                        onCheckedChange={(v) => set("naikanCommunity", v)}
                      // aria-invalid={!!communityError}
                      // aria-describedby={communityError ? "csv-community-error" : undefined}
                      />
                    )}
                  {(canAccess(COMMUNITY_CODE.AI_CLUB) ||
                    customer.aiCommunity) && (
                      <CheckboxItem
                        id="csv-ai"
                        label="AI部会"
                        checked={customer.aiCommunity}
                        onCheckedChange={(v) => set("aiCommunity", v)}
                      // aria-invalid={!!communityError}
                      // aria-describedby={communityError ? "csv-community-error" : undefined}
                      />
                    )}
                </div>
                {/* {communityError && (
                  <p id="csv-community-error" className="text-sm text-destructive">
                    {communityError}
                  </p>
                )} */}
                {isSuper && (
                  <p className="text-xs text-muted-foreground">
                    何も選択しない場合は非会員として登録されます
                  </p>
                )}
              </div>
              {anyCommunity && (
                <>
                  <RadioField
                    label="契約主体"
                    error={errorFor("contractType")}
                    value={customer.contractType}
                    options={[
                      ["corporate", "法人"],
                      ["individual", "個人"],
                    ]}
                    onChange={(v) =>
                      set("contractType", v as PreviewCustomer["contractType"])
                    }
                  />
                  <RadioField
                    label="会員区分"
                    error={errorFor("memberCategory")}
                    value={customer.memberCategory}
                    options={[
                      ["member", "会員"],
                      ["sponsor", "スポンサー"],
                      ["observer", "オブザーバー"],
                    ]}
                    onChange={(v) =>
                      set(
                        "memberCategory",
                        v as PreviewCustomer["memberCategory"],
                      )
                    }
                  />
                  {customer.auditCommunity && (
                    <AuditCommunityFields
                      memberCategory={customer.memberCategory}
                      auditMemberType={customer.auditMemberType}
                      setAuditMemberType={(v) =>
                        set(
                          "auditMemberType",
                          v as PreviewCustomer["auditMemberType"],
                        )
                      }
                      auditMemberPremium={customer.auditMemberPremium}
                      setAuditMemberPremium={(v) =>
                        set("auditMemberPremium", v)
                      }
                      membershipQualificationId={resolveMasterId(
                        customer.auditMembershipQualificationId,
                        customer.auditMembershipQualification,
                        membershipQualifications,
                      )}
                      setMembershipQualificationId={(id) =>
                        update(
                          {
                            auditMembershipQualificationId: id,
                            auditMembershipQualification:
                              membershipQualifications.find((x) => x.id === id)
                                ?.name ?? "",
                          },
                          ["auditMembershipQualificationId"],
                        )
                      }
                      originIndustryId={resolveMasterId(
                        customer.auditOriginIndustryId,
                        customer.auditOriginIndustry,
                        originIndustries,
                      )}
                      setOriginIndustryId={(id) =>
                        update(
                          {
                            auditOriginIndustryId: id,
                            auditOriginIndustry:
                              originIndustries.find((x) => x.id === id)?.name ??
                              "",
                          },
                          ["auditOriginIndustryId"],
                        )
                      }
                      auditJoinedAt={customer.auditJoinedAt}
                      setAuditJoinedAt={(v) => set("auditJoinedAt", v)}
                      auditResignedAt={customer.auditResignedAt}
                      setAuditResignedAt={(v) => set("auditResignedAt", v)}
                      membershipQualifications={membershipQualifications}
                      originIndustries={originIndustries}
                      memberTypeError={errorFor("auditMemberType")}
                      membershipQualificationError={errorFor(
                        "auditMembershipQualificationId",
                      )}
                      originIndustryError={errorFor("auditOriginIndustryId")}
                      joinedAtError={errorFor("auditJoinedAt")}
                      resignedAtError={errorFor("auditResignedAt")}
                    />
                  )}
                  {customer.naikanCommunity && (
                    <SimpleCommunityFields
                      label="ないかんMeetup"
                      affiliations={affiliations}
                      affiliationId={resolveMasterId(
                        customer.naikanAffiliationId,
                        customer.naikanAffiliation,
                        affiliations,
                      )}
                      setAffiliationId={(id) =>
                        update(
                          {
                            naikanAffiliationId: id,
                            naikanAffiliation:
                              affiliations.find((x) => x.id === id)?.name ?? "",
                          },
                          ["naikanAffiliationId"],
                        )
                      }
                      joinedAt={customer.naikanJoinedAt}
                      setJoinedAt={(v) => set("naikanJoinedAt", v)}
                      resignedAt={customer.naikanResignedAt}
                      setResignedAt={(v) => set("naikanResignedAt", v)}
                      affiliationError={errorFor("naikanAffiliationId")}
                      joinedAtError={errorFor("naikanJoinedAt")}
                      resignedAtError={errorFor("naikanResignedAt")}
                    />
                  )}
                  {customer.aiCommunity && (
                    <SimpleCommunityFields
                      label="AI部会"
                      affiliations={affiliations}
                      affiliationId={resolveMasterId(
                        customer.aiAffiliationId,
                        customer.aiAffiliation,
                        affiliations,
                      )}
                      setAffiliationId={(id) =>
                        update(
                          {
                            aiAffiliationId: id,
                            aiAffiliation:
                              affiliations.find((x) => x.id === id)?.name ?? "",
                          },
                          ["aiAffiliationId"],
                        )
                      }
                      joinedAt={customer.aiJoinedAt}
                      setJoinedAt={(v) => set("aiJoinedAt", v)}
                      resignedAt={customer.aiResignedAt}
                      setResignedAt={(v) => set("aiResignedAt", v)}
                      affiliationError={errorFor("aiAffiliationId")}
                      joinedAtError={errorFor("aiJoinedAt")}
                      resignedAtError={errorFor("aiResignedAt")}
                    />
                  )}
                </>
              )}
              <SectionHeading>プロフィール</SectionHeading>
              <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2">
                <Field
                  required
                  label="姓"
                  error={errorFor("lastName")}
                  value={customer.lastName}
                  onChange={(v) => set("lastName", v)}
                />
                <Field
                  required
                  label="名"
                  error={errorFor("firstName")}
                  value={customer.firstName}
                  onChange={(v) => set("firstName", v)}
                />
              </div>
              <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2">
                <Field
                  label="セイ"
                  error={errorFor("lastNameKana")}
                  value={customer.lastNameKana}
                  onChange={(v) => set("lastNameKana", v)}
                />
                <Field
                  label="メイ"
                  error={errorFor("firstNameKana")}
                  value={customer.firstNameKana}
                  onChange={(v) => set("firstNameKana", v)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="csv-email">
                  メールアドレス <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="csv-email"
                    type="email"
                    placeholder="name@example.com"
                    className="flex-1"
                    aria-invalid={!!errorFor("email")}
                    value={customer.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                  {visibleSubEmails < 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() =>
                        set("visibleSubEmailCount", visibleSubEmails + 1)
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {errorFor("email") && (
                  <p className="text-sm text-destructive">{errorFor("email")}</p>
                )}
                {[customer.subEmail1, customer.subEmail2, customer.subEmail3]
                  .slice(0, visibleSubEmails)
                  .map((value, index) => (
                    <div key={index} className="flex flex-col">
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder={`サブメールアドレス ${index + 1}`}
                          className="flex-1"
                          aria-invalid={
                            !!errorFor(
                              `subEmail${index + 1}` as keyof PreviewCustomer,
                            )
                          }
                          value={value}
                          onChange={(e) =>
                            set(
                              `subEmail${index + 1}` as
                              | "subEmail1"
                              | "subEmail2"
                              | "subEmail3",
                              e.target.value,
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          onClick={() => {
                            const compacted = [
                              customer.subEmail1,
                              customer.subEmail2,
                              customer.subEmail3,
                            ];
                            compacted.splice(index, 1);
                            compacted.push("");
                            onChange({
                              ...customer,
                              subEmail1: compacted[0],
                              subEmail2: compacted[1],
                              subEmail3: compacted[2],
                              visibleSubEmailCount: Math.max(
                                0,
                                visibleSubEmails - 1,
                              ),
                            });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {errorFor(
                        `subEmail${index + 1}` as keyof PreviewCustomer,
                      ) && (
                          <p className="col-span-full text-sm text-destructive">
                            {errorFor(
                              `subEmail${index + 1}` as keyof PreviewCustomer,
                            )}
                          </p>
                        )}
                    </div>
                  ))}
              </div>
              <Field
                label="会社名"
                error={errorFor("company")}
                value={customer.company}
                onChange={(v) => set("company", v)}
              />
              <div className="grid gap-2">
                <Label>
                  所属部署<span className="text-destructive"> *</span>
                </Label>
                <div className="grid gap-3">
                  {departments.map((department) => {
                    const key = departmentKeyByName(department.name);
                    if (!key) return null;
                    return (
                      <CheckboxItem
                        key={department.id}
                        id={`csv-department-${department.id}`}
                        label={department.name}
                        checked={customer[key]}
                        onCheckedChange={(v) => set(key, v)}
                      // aria-invalid={!!departmentError}
                      // aria-describedby={
                      //   departmentError ? "csv-department-error" : undefined
                      // }
                      />
                    );
                  })}
                </div>
                {departmentError && (
                  <p id="csv-department-error" className="text-sm text-destructive">
                    {departmentError}
                  </p>
                )}
                {customer.affiliationOther && (
                  <FormField
                    label="その他の所属"
                    error={errorFor("affiliationOtherText")}
                  >
                    <Input
                      placeholder="その他"
                      value={customer.affiliationOtherText}
                      onChange={(e) =>
                        set("affiliationOtherText", e.target.value)
                      }
                    />
                  </FormField>
                )}
              </div>
              <Field
                label="役職"
                error={errorFor("position")}
                value={customer.position}
                maxLength={50}
                onChange={(v) => set("position", v)}
              />
              <FormField label="上場区分" error={errorFor("listingCategoryId")}>
                <Select
                  value={String(
                    resolveListingId(
                      customer.listingCategoryId,
                      customer.listingCategory,
                      listingCategories,
                    ) ?? NONE_VALUE,
                  )}
                  onValueChange={(v) => {
                    const id = v === NONE_VALUE ? undefined : Number(v);
                    update(
                      {
                        listingCategoryId: id,
                        listingCategory:
                          listingCategories.find((x) => x.id === id)
                            ?.marketName ?? "",
                      },
                      ["listingCategoryId"],
                    );
                  }}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="----" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem
                      value={NONE_VALUE}
                      className="bg-white hover:bg-gray-100"
                    >
                      ----
                    </SelectItem>
                    {listingCategories
                      .filter((x) => !x.stockExchangeName)
                      .map((x) => (
                        <SelectItem
                          key={x.id}
                          value={String(x.id)}
                          className="bg-white hover:bg-gray-100"
                        >
                          {x.marketName}
                        </SelectItem>
                      ))}
                    {[
                      ...new Set(
                        listingCategories
                          .map((x) => x.stockExchangeName)
                          .filter(Boolean),
                      ),
                    ].map((exchange) => (
                      <SelectGroup key={exchange}>
                        <SelectLabel className="bg-gray-100">
                          {exchange}
                        </SelectLabel>
                        {listingCategories
                          .filter((x) => x.stockExchangeName === exchange)
                          .map((x) => (
                            <SelectItem
                              key={x.id}
                              value={String(x.id)}
                              className="bg-white hover:bg-gray-100"
                            >
                              {x.marketName}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <Field
                tel
                label="電話番号"
                error={errorFor("phone")}
                value={customer.phone}
                onChange={(v) => set("phone", v)}
              />
              <Field
                label="郵便番号"
                error={errorFor("postalCode")}
                value={customer.postalCode}
                onChange={(v) => set("postalCode", v)}
              />
              <FormField label="都道府県" error={errorFor("prefectureId")}>
                <Select
                  value={String(
                    resolveMasterId(
                      customer.prefectureId,
                      customer.prefecture,
                      prefectures,
                    ) ?? NONE_VALUE,
                  )}
                  onValueChange={(v) => {
                    const id = v === NONE_VALUE ? undefined : Number(v);
                    update(
                      {
                        prefectureId: id,
                        prefecture:
                          prefectures.find((x) => x.id === id)?.name ?? "",
                      },
                      ["prefectureId"],
                    );
                  }}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="----" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem
                      value={NONE_VALUE}
                      className="bg-white hover:bg-gray-100"
                    >
                      ----
                    </SelectItem>
                    {prefectures.map((x) => (
                      <SelectItem
                        key={x.id}
                        value={String(x.id)}
                        className="bg-white hover:bg-gray-100"
                      >
                        {x.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <Field
                label="市区町村以下"
                error={errorFor("city")}
                value={customer.city}
                onChange={(v) => set("city", v)}
              />
              <RadioField
                label="性別"
                error={errorFor("gender")}
                required={false}
                value={customer.gender}
                options={[
                  ["male", "男性"],
                  ["female", "女性"],
                ]}
                onChange={(v) => set("gender", v as PreviewCustomer["gender"])}
              />
              <RadioField
                label="転職意欲"
                error={errorFor("jobChangeIntent")}
                required={false}
                value={customer.jobChangeIntent}
                options={JOB_CHANGE_INTENT_OPTIONS.map((x) => [
                  x.value,
                  x.label,
                ])}
                onChange={(v) =>
                  set(
                    "jobChangeIntent",
                    v as PreviewCustomer["jobChangeIntent"],
                  )
                }
              />
              <FormField label="備考" error={errorFor("note")}>
                <Textarea
                  placeholder="紹介者や特記事項など"
                  className="min-h-32"
                  value={customer.note}
                  onChange={(e) => set("note", e.target.value)}
                />
              </FormField>
            </div>
          </div>
        )}
        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            キャンセル
          </Button>

          <Button type="button" disabled={!!validationError} onClick={onSave}>
            更新する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  date,
  email,
  tel,
  error,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  date?: boolean;
  email?: boolean;
  tel?: boolean;
  error?: string;
  maxLength?: number;
}) {
  return (
    <FormField label={label} required={required} error={error}>
      <Input
        type={date ? "date" : email ? "email" : tel ? "tel" : "text"}
        placeholder={PLACEHOLDERS[label]}
        aria-invalid={!!error}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </FormField>
  );
}
function RadioField({
  label,
  value,
  options,
  onChange,
  required = true,
  error,
}: {
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <RadioGroup value={value} onValueChange={onChange} aria-invalid={!!error}>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {options.map(([v, l]) => (
            <RadioItem key={v} value={v} label={l} />
          ))}
        </div>
      </RadioGroup>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
function resolveMasterId(
  id: number | undefined,
  name: string,
  items: MasterData[],
) {
  return items.some((x) => x.id === id)
    ? id
    : items.find((x) => x.name === name)?.id;
}

function resolveListingId(
  id: number | undefined,
  name: string,
  items: ListingCategoryOption[],
) {
  return items.some((x) => x.id === id)
    ? id
    : items.find(
      (x) =>
        x.marketName === name ||
        `${x.stockExchangeName} ${x.marketName}` === name,
    )?.id;
}

function departmentKeyByName(name: string) {
  const map = {
    内部監査室: "affiliationInternalAudit",
    監査役: "affiliationAuditor",
    管理部門: "affiliationManagement",
    経営者: "affiliationExecutive",
    コンサルタント: "affiliationConsultant",
    スポンサー: "affiliationNaikanSponsor",
    オブザーバー: "affiliationObserver",
    その他: "affiliationOther",
  } as const;
  return map[name as keyof typeof map];
}
