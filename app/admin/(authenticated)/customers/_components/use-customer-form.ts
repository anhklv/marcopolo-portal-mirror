"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/lib/actions/customer.actions";
import type { ActionResult } from "@/lib/types/action";
import { COMMUNITY_CODE, COMMUNITY_NAME } from "@/lib/constants/community";
import { useFieldErrors } from "@/lib/hooks/use-field-errors";
import type { CommunityOption } from "@/lib/types/serialized";
import { isoToDisplay, isRedirectError } from "@/lib/utils";
import {
  customerFormSchema,
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
  position: string | null;
  phone: string | null;
  postalCode: string | null;
  prefectureId: number | null;
  city: string | null;
  gender: string | null;
  listingCategoryId: number | null;
  departmentIds: number[];
  departmentOtherNote: string | null;
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
  otherDepartmentId?: number;
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
    joinedAt: joinedAt || null,
    resignedAt: resignedAt || null,
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
  otherDepartmentId,
  isSuper,
  scopedCommunityIds,
}: UseCustomerFormProps) {
  const [isPending, startTransition] = useTransition();

  // コミュニティ情報
  const auditCommunity = findCommunityByCode(communities, COMMUNITY_CODE.VENTURE_AUDITOR);
  const naikanCommunity = findCommunityByCode(communities, COMMUNITY_CODE.NAIKAN_MEETUP);
  const aiCommunity = findCommunityByCode(communities, COMMUNITY_CODE.AI_CLUB);

  // コミュニティのスコープ内チェック
  const canAccessAudit = !!(isSuper || (auditCommunity && scopedCommunityIds.includes(auditCommunity.id)));
  const canAccessNaikan = !!(isSuper || (naikanCommunity && scopedCommunityIds.includes(naikanCommunity.id)));
  const canAccessAi = !!(isSuper || (aiCommunity && scopedCommunityIds.includes(aiCommunity.id)));

  // 初期値
  const auditInitial = auditCommunity ? getInitialCommunityData(initialData, auditCommunity.id) : undefined;
  const naikanInitial = naikanCommunity ? getInitialCommunityData(initialData, naikanCommunity.id) : undefined;
  const aiInitial = aiCommunity ? getInitialCommunityData(initialData, aiCommunity.id) : undefined;

  // コミュニティ選択状態
  const [auditChecked, setAuditChecked] = useState(!!auditInitial && canAccessAudit);
  const [naikanChecked, setNaikanChecked] = useState(!!naikanInitial && canAccessNaikan);
  const [aiChecked, setAiChecked] = useState(!!aiInitial && canAccessAi);

  const anyCommunityChecked =
    (canAccessAudit && auditChecked) ||
    (canAccessNaikan && naikanChecked) ||
    (canAccessAi && aiChecked);

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
  const [position, setPosition] = useState(initialData?.position ?? "");
  const [listingCategoryId, setListingCategoryId] = useState<number | undefined>(initialData?.listingCategoryId ?? undefined);
  const [departmentIds, setDepartmentIds] = useState<number[]>(initialData?.departmentIds ?? []);
  const [departmentOtherNote, setDepartmentOtherNote] = useState(initialData?.departmentOtherNote ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [postalCode, setPostalCode] = useState(initialData?.postalCode ?? "");
  const [prefectureId, setPrefectureId] = useState<number | undefined>(initialData?.prefectureId ?? undefined);
  const [city, setCity] = useState(initialData?.city ?? "");
  const [gender, setGender] = useState(initialData?.gender ?? "");
  const [jobChangeIntent, setJobChangeIntent] = useState(initialData?.jobChangeIntent ?? "");
  const [note, setNote] = useState(initialData?.note ?? "");

  // エラー状態
  const { fieldErrors, setFieldErrors, generalError, setGeneralError, clearFieldError } = useFieldErrors();

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
      if (canAccessAudit && auditInitial && !auditChecked) removedCommunities.push(COMMUNITY_NAME[COMMUNITY_CODE.VENTURE_AUDITOR]);
      if (canAccessNaikan && naikanInitial && !naikanChecked) removedCommunities.push(COMMUNITY_NAME[COMMUNITY_CODE.NAIKAN_MEETUP]);
      if (canAccessAi && aiInitial && !aiChecked) removedCommunities.push(COMMUNITY_NAME[COMMUNITY_CODE.AI_CLUB]);

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

    // コミュニティデータ構築（日付は表示形式のままZodで検証・変換）
    const communitiesData: CommunityEntry[] = [];

    if (canAccessAudit && auditChecked && auditCommunity) {
      communitiesData.push(buildCommunityEntry(auditCommunity.id, auditJoinedAt, auditResignedAt, {
        auditMemberType: memberCategory === "member" ? (auditMemberType || null) : null,
        auditMemberPremium: memberCategory === "member" ? auditMemberPremium : null,
        originIndustryId: originIndustryId || null,
        membershipQualificationId: membershipQualificationId || null,
      }));
    }

    if (canAccessNaikan && naikanChecked && naikanCommunity) {
      communitiesData.push(buildCommunityEntry(naikanCommunity.id, naikanJoinedAt, naikanResignedAt, {
        affiliationId: naikanAffiliationId || null,
      }));
    }

    if (canAccessAi && aiChecked && aiCommunity) {
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
      position,
      phone,
      postalCode,
      prefectureId: prefectureId || null,
      city,
      gender: gender || null,
      listingCategoryId: listingCategoryId || null,
      departmentIds,
      otherDepartmentId: otherDepartmentId || null,
      departmentOtherNote,
      memberCategory: anyCommunityChecked ? memberCategory : null,
      contractType: anyCommunityChecked ? contractType : null,
      jobChangeIntent: jobChangeIntent || null,
      note,
      communities: communitiesData,
    };

    // Zodスキーマで全フィールドを一括チェック（日付のYYYY/MM/DD→YYYY-MM-DD変換も含む）
    const clientErrors: Record<string, string[]> = {};
    const parsed = customerFormSchema.safeParse(formData);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path;
        let key = path.join(".");

        // communities.N.joinedAt/resignedAt → {prefix}JoinedAt/ResignedAt にマッピング
        if (path[0] === "communities" && typeof path[1] === "number") {
          const community = communitiesData[path[1]];
          const prefix = community?.communityId === auditCommunity?.id ? "audit"
            : community?.communityId === naikanCommunity?.id ? "naikan"
            : community?.communityId === aiCommunity?.id ? "ai" : null;
          if (prefix && (path[2] === "joinedAt" || path[2] === "resignedAt")) {
            key = `${prefix}${path[2] === "joinedAt" ? "JoinedAt" : "ResignedAt"}`;
          }
        }

        if (!clientErrors[key]) clientErrors[key] = [];
        clientErrors[key].push(issue.message);
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
        if (isRedirectError(err)) {
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
    position, setPosition,
    listingCategoryId, setListingCategoryId,
    departmentIds, setDepartmentIds,
    departmentOtherNote, setDepartmentOtherNote,
    phone, setPhone,
    postalCode, setPostalCode,
    prefectureId, setPrefectureId,
    city, setCity,
    gender, setGender,
    jobChangeIntent, setJobChangeIntent,
    note, setNote,

    // エラー
    fieldErrors,
    setFieldErrors,
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
