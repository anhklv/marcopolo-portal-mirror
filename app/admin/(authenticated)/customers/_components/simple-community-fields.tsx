import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { DatePickerWithInput } from "@/components/ui/date-picker-with-input";
import type { MasterData } from "@/lib/types/serialized";

const NONE_VALUE = "__none__";

interface SimpleCommunityFieldsProps {
  label: string;
  affiliationId: number | undefined;
  setAffiliationId: (v: number | undefined) => void;
  joinedAt: string;
  setJoinedAt: (v: string) => void;
  resignedAt: string;
  setResignedAt: (v: string) => void;
  joinedAtError?: string;
  resignedAtError?: string;
  affiliations: MasterData[];
}

export function SimpleCommunityFields({
  label,
  affiliationId,
  setAffiliationId,
  joinedAt,
  setJoinedAt,
  resignedAt,
  setResignedAt,
  joinedAtError,
  resignedAtError,
  affiliations,
}: SimpleCommunityFieldsProps) {
  return (
    <div className="rounded-lg border p-4 space-y-6 bg-slate-50">
      <div className="space-y-3">
        <Label>{label}</Label>
        <div className="border-b border-border" />
      </div>

      <div className="grid gap-2">
        <Label>所属</Label>
        <Select
          value={affiliationId ? String(affiliationId) : NONE_VALUE}
          onValueChange={(v) => setAffiliationId(v === NONE_VALUE ? undefined : Number(v))}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="----" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value={NONE_VALUE} className="bg-white hover:bg-gray-100">----</SelectItem>
            {affiliations.map((a) => (
              <SelectItem key={a.id} value={String(a.id)} className="bg-white hover:bg-gray-100">{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 items-start gap-4">
        <FormField label="入会日">
          <DatePickerWithInput value={joinedAt} onChange={setJoinedAt} error={joinedAtError} />
        </FormField>
        <FormField label="脱退日">
          <DatePickerWithInput value={resignedAt} onChange={setResignedAt} error={resignedAtError} />
        </FormField>
      </div>
    </div>
  );
}
