"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/lib/actions/customer.actions";
import type { ActionResult } from "@/lib/actions/customer.actions";
import type { CommunityOption } from "@/lib/types/serialized";
import {
  customerFormSchema,
  validateDateInput,
  validateKatakana,
  validatePhone,
  validatePostalCode,
} from "@/lib/validations/customer";

// ============================================================
// 型定義
// ============================================================

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

export interface InitialData {
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

interface UseCustomerFormProps {
  mode: "create" | "edit";
  initialData?: InitialData;
  communities: CommunityOption[];
  isSuper: boolean;
  scopedCommunityIds: number[];
}

// ============================================================
// ヘルパー
// ============================================================

function findCommunityByCode(communities: CommunityOption[], code: string): CommunityOption | undefined {
  return communities.find((c) => c.code === code);
}

function getInitialCommunityData(
  initialData: InitialData | undefined,
  communityId: number
): InitialCommunityData | undefined {
  return initialData?.communities.find((c) => c.communityId === communityId);
}

/** ISO形式(YYYY-MM-DDまたはYYYY-MM-DDTHH:mm:ss.sssZ) → 表示形式(YYYY/MM/DD) */
function isoToDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 10).replace(/-/g, "/");
}

/** 表示形式(YYYY/M/DまたはYYYY/MM/DD) → ISO形式(YYYY-MM-DD)、空文字はnull */
function displayToIso(value: string): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  const y = match[1];
  const m = match[2].padStart(2, "0");
  const d = match[3].padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface CommunityEntry {
  communityId: number;
  joinedAt: string | null;
  resignedAt: string | null;
  auditMemberType: string | null;
  auditMemberPremium: boolean | null;
  affiliationId: number | null;
  originIndustryId: number | null;
  membershipQualificationId: number | null;
}

function buildCommunityEntry(
  communityId: number,
  joinedAt: string,
  resignedAt: string,
  overrides?: Partial<Pick<CommunityEntry, "auditMemberType" | "auditMemberPremium" | "affiliationId" | "originIndustryId" | "membershipQualificationId">>,
): CommunityEntry {
  return {
    communityId,
    joinedAt: displayToIso(joinedAt),
    resignedAt: displayToIso(resignedAt),
    auditMemberType: null,
    auditMemberPremium: null,
    affiliationId: null,
    originIndustryId: null,
    membershipQualificationId: null,
    ...overrides,
  };
}

// ============================================================
// カスタムフック
// ============================================================

export function useCustomerForm({
  mode,
  initialData,
  communities,
  isSuper,
  scopedCommunityIds,
}: UseCustomerFormProps) {
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
  const [auditJoinedAt, setAuditJoinedAt] = useState(isoToDisplay(auditInitial?.joinedAt));
  const [auditResignedAt, setAuditResignedAt] = useState(isoToDisplay(auditInitial?.resignedAt));
  const [originIndustryId, setOriginIndustryId] = useState<number | undefined>(auditInitial?.originIndustryId ?? undefined);
  const [membershipQualificationId, setMembershipQualificationId] = useState<number | undefined>(auditInitial?.membershipQualificationId ?? undefined);

  // ないかんMeetup
  const [naikanAffiliationId, setNaikanAffiliationId] = useState<number | undefined>(naikanInitial?.affiliationId ?? undefined);
  const [naikanJoinedAt, setNaikanJoinedAt] = useState(isoToDisplay(naikanInitial?.joinedAt));
  const [naikanResignedAt, setNaikanResignedAt] = useState(isoToDisplay(naikanInitial?.resignedAt));

  // AI部会
  const [aiAffiliationId, setAiAffiliationId] = useState<number | undefined>(aiInitial?.affiliationId ?? undefined);
  const [aiJoinedAt, setAiJoinedAt] = useState(isoToDisplay(aiInitial?.joinedAt));
  const [aiResignedAt, setAiResignedAt] = useState(isoToDisplay(aiInitial?.resignedAt));

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

  // フィールドエラーのクリア（onChange時に使用）
  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // フィールド単位のblurバリデーション
  const validateFieldOnBlur = (field: string, value: string, validate: (v: string) => string | null) => {
    const error = validate(value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[field] = [error];
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handleLastNameKanaBlur = () => {
    validateFieldOnBlur("lastNameKana", lastNameKana, validateKatakana);
  };

  const handleFirstNameKanaBlur = () => {
    validateFieldOnBlur("firstNameKana", firstNameKana, validateKatakana);
  };

  const handlePhoneBlur = () => {
    validateFieldOnBlur("phone", phone, validatePhone);
  };

  const handlePostalCodeBlur = () => {
    validateFieldOnBlur("postalCode", postalCode, validatePostalCode);
  };

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

    // 編集時：元々所属していたコミュニティのチェックが外された場合、確認ダイアログを表示
    if (mode === "edit") {
      const removedCommunities: string[] = [];
      if (auditInitial && !auditChecked) removedCommunities.push("ベンチャー監査役の会");
      if (naikanInitial && !naikanChecked) removedCommunities.push("ないかんMeetup");
      if (aiInitial && !aiChecked) removedCommunities.push("AI部会");

      if (removedCommunities.length > 0) {
        const confirmed = window.confirm(
          `${removedCommunities.join("、")}の登録情報が削除されます。よろしいですか？`
        );
        if (!confirmed) return;
      }
    }

    setGeneralError(null);

    // ベンチャー監査役の会・会員の場合、会員種別は必須
    if (auditChecked && memberCategory === "member" && !auditMemberType) {
      toast.error("会員種別を選択してください");
      return;
    }

    // 日付フィールドのバリデーション（表示形式のまま検証）
    const clientErrors: Record<string, string[]> = {};
    const dateFields: { key: string; value: string; checked: boolean }[] = [
      { key: "auditJoinedAt", value: auditJoinedAt, checked: auditChecked },
      { key: "auditResignedAt", value: auditResignedAt, checked: auditChecked },
      { key: "naikanJoinedAt", value: naikanJoinedAt, checked: naikanChecked },
      { key: "naikanResignedAt", value: naikanResignedAt, checked: naikanChecked },
      { key: "aiJoinedAt", value: aiJoinedAt, checked: aiChecked },
      { key: "aiResignedAt", value: aiResignedAt, checked: aiChecked },
    ];
    for (const { key, value, checked } of dateFields) {
      if (!checked) continue;
      const error = validateDateInput(value);
      if (error) clientErrors[key] = [error];
    }

    // コミュニティデータ構築（日付は表示形式→ISO形式に変換）
    const communitiesData: CommunityEntry[] = [];

    if (auditChecked && auditCommunity) {
      communitiesData.push(buildCommunityEntry(auditCommunity.id, auditJoinedAt, auditResignedAt, {
        auditMemberType: memberCategory === "member" ? (auditMemberType || null) : null,
        auditMemberPremium: memberCategory === "member" ? auditMemberPremium : null,
        originIndustryId: originIndustryId || null,
        membershipQualificationId: membershipQualificationId || null,
      }));
    }

    if (naikanChecked && naikanCommunity) {
      communitiesData.push(buildCommunityEntry(naikanCommunity.id, naikanJoinedAt, naikanResignedAt, {
        affiliationId: naikanAffiliationId || null,
      }));
    }

    if (aiChecked && aiCommunity) {
      communitiesData.push(buildCommunityEntry(aiCommunity.id, aiJoinedAt, aiResignedAt, {
        affiliationId: aiAffiliationId || null,
      }));
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

    // Zodスキーマで全フィールドを一括チェック
    const parsed = customerFormSchema.safeParse(formData);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        if (!clientErrors[path]) clientErrors[path] = [];
        clientErrors[path].push(issue.message);
      }
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      toast.error("入力内容に誤りがあります");
      return;
    }

    setFieldErrors({});
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

  return {
    // トランジション
    isPending,

    // コミュニティ情報
    canAccessAudit,
    canAccessNaikan,
    canAccessAi,
    anyCommunityChecked,

    // コミュニティ選択状態
    auditChecked, setAuditChecked,
    naikanChecked, setNaikanChecked,
    aiChecked, setAiChecked,

    // 会員区分・契約主体
    memberCategory, setMemberCategory,
    contractType, setContractType,

    // ベンチャー監査役の会
    auditMemberType, setAuditMemberType,
    auditMemberPremium, setAuditMemberPremium,
    auditJoinedAt, setAuditJoinedAt,
    auditResignedAt, setAuditResignedAt,
    originIndustryId, setOriginIndustryId,
    membershipQualificationId, setMembershipQualificationId,

    // ないかんMeetup
    naikanAffiliationId, setNaikanAffiliationId,
    naikanJoinedAt, setNaikanJoinedAt,
    naikanResignedAt, setNaikanResignedAt,

    // AI部会
    aiAffiliationId, setAiAffiliationId,
    aiJoinedAt, setAiJoinedAt,
    aiResignedAt, setAiResignedAt,

    // プロフィール
    firstName, setFirstName,
    lastName, setLastName,
    firstNameKana, setFirstNameKana,
    lastNameKana, setLastNameKana,
    email, setEmail,
    subEmails, setSubEmails,
    company, setCompany,
    listingCategoryId, setListingCategoryId,
    phone, setPhone,
    postalCode, setPostalCode,
    prefectureId, setPrefectureId,
    city, setCity,
    gender, setGender,
    jobChangeIntent, setJobChangeIntent,
    note, setNote,

    // エラー
    fieldErrors,
    generalError,
    clearFieldError,

    // ハンドラ
    handleAddSubEmail,
    handleRemoveSubEmail,
    handleSubEmailChange,
    handleLastNameKanaBlur,
    handleFirstNameKanaBlur,
    handlePhoneBlur,
    handlePostalCodeBlur,
    handleSubmit,
  };
}
