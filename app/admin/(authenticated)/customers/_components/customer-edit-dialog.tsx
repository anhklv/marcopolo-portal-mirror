"use client";

import { Plus, X } from "lucide-react";

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
import { validateCustomer, type PreviewCustomer } from "./customer-csv-types";
import type { ListingCategoryOption, MasterData } from "@/lib/types/serialized";
import { NONE_VALUE } from "@/lib/constants/form";
import { AuditCommunityFields } from "./audit-community-fields";
import { SimpleCommunityFields } from "./simple-community-fields";

interface Props {
  customer: PreviewCustomer | null;
  onOpenChange: (open: boolean) => void;
  onChange: (customer: PreviewCustomer) => void;
  onSave: () => void;
  prefectures: MasterData[];
  listingCategories: ListingCategoryOption[];
  departments: MasterData[];
  originIndustries: MasterData[];
  membershipQualifications: MasterData[];
  affiliations: MasterData[];
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
}: Props) {
  const set = <K extends keyof PreviewCustomer>(
    key: K,
    value: PreviewCustomer[K],
  ) => customer && onChange({ ...customer, [key]: value });
  const anyCommunity = !!(
    customer?.auditCommunity ||
    customer?.naikanCommunity ||
    customer?.aiCommunity
  );
  const validationError = customer ? validateCustomer(customer) : undefined;
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
              <SectionHeading>会員情報</SectionHeading>
              <div className="grid gap-2">
                <Label>コミュニティ</Label>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  <CheckboxItem
                    id="csv-audit"
                    label="ベンチャー監査役の会"
                    checked={customer.auditCommunity}
                    onCheckedChange={(v) => set("auditCommunity", v)}
                  />
                  <CheckboxItem
                    id="csv-naikan"
                    label="ないかんMeetup"
                    checked={customer.naikanCommunity}
                    onCheckedChange={(v) => set("naikanCommunity", v)}
                  />
                  <CheckboxItem
                    id="csv-ai"
                    label="AI部会"
                    checked={customer.aiCommunity}
                    onCheckedChange={(v) => set("aiCommunity", v)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  何も選択しない場合は非会員として登録されます
                </p>
              </div>
              {anyCommunity && (
                <>
                  <RadioField
                    label="契約主体"
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
                        onChange({
                          ...customer,
                          auditMembershipQualificationId: id,
                          auditMembershipQualification:
                            membershipQualifications.find((x) => x.id === id)
                              ?.name ?? "",
                        })
                      }
                      originIndustryId={resolveMasterId(
                        customer.auditOriginIndustryId,
                        customer.auditOriginIndustry,
                        originIndustries,
                      )}
                      setOriginIndustryId={(id) =>
                        onChange({
                          ...customer,
                          auditOriginIndustryId: id,
                          auditOriginIndustry:
                            originIndustries.find((x) => x.id === id)?.name ??
                            "",
                        })
                      }
                      auditJoinedAt={customer.auditJoinedAt}
                      setAuditJoinedAt={(v) => set("auditJoinedAt", v)}
                      auditResignedAt={customer.auditResignedAt}
                      setAuditResignedAt={(v) => set("auditResignedAt", v)}
                      membershipQualifications={membershipQualifications}
                      originIndustries={originIndustries}
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
                        onChange({
                          ...customer,
                          naikanAffiliationId: id,
                          naikanAffiliation:
                            affiliations.find((x) => x.id === id)?.name ?? "",
                        })
                      }
                      joinedAt={customer.naikanJoinedAt}
                      setJoinedAt={(v) => set("naikanJoinedAt", v)}
                      resignedAt={customer.naikanResignedAt}
                      setResignedAt={(v) => set("naikanResignedAt", v)}
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
                        onChange({
                          ...customer,
                          aiAffiliationId: id,
                          aiAffiliation:
                            affiliations.find((x) => x.id === id)?.name ?? "",
                        })
                      }
                      joinedAt={customer.aiJoinedAt}
                      setJoinedAt={(v) => set("aiJoinedAt", v)}
                      resignedAt={customer.aiResignedAt}
                      setResignedAt={(v) => set("aiResignedAt", v)}
                    />
                  )}
                </>
              )}
              <SectionHeading>プロフィール</SectionHeading>
              <div className="grid grid-cols-2 items-start gap-6">
                <Field
                  required
                  label="姓"
                  value={customer.lastName}
                  onChange={(v) => set("lastName", v)}
                />
                <Field
                  required
                  label="名"
                  value={customer.firstName}
                  onChange={(v) => set("firstName", v)}
                />
              </div>
              <div className="grid grid-cols-2 items-start gap-6">
                <Field
                  label="セイ"
                  value={customer.lastNameKana}
                  onChange={(v) => set("lastNameKana", v)}
                />
                <Field
                  label="メイ"
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
                {[customer.subEmail1, customer.subEmail2, customer.subEmail3]
                  .slice(0, visibleSubEmails)
                  .map((value, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="email"
                        placeholder={`サブメールアドレス ${index + 1}`}
                        className="flex-1"
                        value={value}
                        onChange={(e) =>
                          set(
                            `subEmail${index + 1}` as
                            "subEmail1" | "subEmail2" | "subEmail3",
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
                  ))}
              </div>
              <Field
                label="会社名"
                value={customer.company}
                onChange={(v) => set("company", v)}
              />
              <div className="grid gap-2">
                <Label>所属部署<span className="text-destructive"> *</span></Label>
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
                    />
                    );
                  })}
                </div>
                {customer.affiliationOther && (
                  <Input
                    aria-label="その他の所属"
                    placeholder="その他"
                    value={customer.affiliationOtherText}
                    onChange={(e) =>
                      set("affiliationOtherText", e.target.value)
                    }
                  />
                )}
              </div>
              <FormField label="上場区分">
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
                    onChange({
                      ...customer,
                      listingCategoryId: id,
                      listingCategory:
                        listingCategories.find((x) => x.id === id)
                          ?.marketName ?? "",
                    });
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
                value={customer.phone}
                onChange={(v) => set("phone", v)}
              />
              <Field
                label="郵便番号"
                value={customer.postalCode}
                onChange={(v) => set("postalCode", v)}
              />
              <FormField label="都道府県">
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
                    onChange({
                      ...customer,
                      prefectureId: id,
                      prefecture:
                        prefectures.find((x) => x.id === id)?.name ?? "",
                    });
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
                value={customer.city}
                onChange={(v) => set("city", v)}
              />
              <RadioField
                label="性別"
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
              <FormField label="備考">
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
          {validationError && (
            <p className="mr-auto text-sm text-destructive">
              {validationError}
            </p>
          )}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  date?: boolean;
  email?: boolean;
  tel?: boolean;
}) {
  return (
    <FormField label={label} required={required}>
      <Input
        type={date ? "date" : email ? "email" : tel ? "tel" : "text"}
        placeholder={PLACEHOLDERS[label]}
        aria-invalid={required && !value}
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
}: {
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <RadioGroup value={value} onValueChange={onChange}>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {options.map(([v, l]) => (
            <RadioItem key={v} value={v} label={l} />
          ))}
        </div>
      </RadioGroup>
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
    "内部監査室": "affiliationInternalAudit",
    "監査役": "affiliationAuditor",
    "管理部門": "affiliationManagement",
    "経営者": "affiliationExecutive",
    "コンサルタント": "affiliationConsultant",
    "スポンサー": "affiliationNaikanSponsor",
    "オブザーバー": "affiliationObserver",
    "その他": "affiliationOther",
  } as const;
  return map[name as keyof typeof map];
}
