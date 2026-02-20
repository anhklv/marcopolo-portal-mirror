import { Label } from "@/components/ui/label";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { DatePickerWithInput } from "@/components/ui/date-picker-with-input";
import { AUDIT_MEMBER_TYPES } from "@/lib/constants/customer";
import type { MasterData } from "@/lib/types/serialized";

const NONE_VALUE = "__none__";

interface AuditCommunityFieldsProps {
  memberCategory: string;
  auditMemberType: string;
  setAuditMemberType: (v: string) => void;
  auditMemberPremium: boolean;
  setAuditMemberPremium: (v: boolean) => void;
  membershipQualificationId: number | undefined;
  setMembershipQualificationId: (v: number | undefined) => void;
  originIndustryId: number | undefined;
  setOriginIndustryId: (v: number | undefined) => void;
  auditJoinedAt: Date | undefined;
  setAuditJoinedAt: (v: Date | undefined) => void;
  auditResignedAt: Date | undefined;
  setAuditResignedAt: (v: Date | undefined) => void;
  membershipQualifications: MasterData[];
  originIndustries: MasterData[];
}

export function AuditCommunityFields({
  memberCategory,
  auditMemberType,
  setAuditMemberType,
  auditMemberPremium,
  setAuditMemberPremium,
  membershipQualificationId,
  setMembershipQualificationId,
  originIndustryId,
  setOriginIndustryId,
  auditJoinedAt,
  setAuditJoinedAt,
  auditResignedAt,
  setAuditResignedAt,
  membershipQualifications,
  originIndustries,
}: AuditCommunityFieldsProps) {
  return (
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
            <SelectValue placeholder="----" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value={NONE_VALUE} className="bg-white hover:bg-gray-100">----</SelectItem>
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
            <SelectValue placeholder="----" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value={NONE_VALUE} className="bg-white hover:bg-gray-100">----</SelectItem>
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
  );
}
