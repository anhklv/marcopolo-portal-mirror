export interface PreviewCustomer {
  id: number;
  auditCommunity: boolean;
  naikanCommunity: boolean;
  aiCommunity: boolean;
  contractType: "corporate" | "individual";
  memberCategory: "member" | "sponsor" | "observer";
  auditMemberType: "regular" | "online" | "";
  auditMemberPremium: boolean;
  auditMembershipQualification: string;
  auditMembershipQualificationId?: number;
  auditOriginIndustry: string;
  auditOriginIndustryId?: number;
  auditJoinedAt: string;
  auditResignedAt: string;
  naikanAffiliation: string;
  naikanAffiliationId?: number;
  naikanJoinedAt: string;
  naikanResignedAt: string;
  aiAffiliation: string;
  aiAffiliationId?: number;
  aiJoinedAt: string;
  aiResignedAt: string;
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  email: string;
  subEmail1: string;
  subEmail2: string;
  subEmail3: string;
  visibleSubEmailCount?: number;
  company: string;
  affiliationInternalAudit: boolean;
  affiliationAuditor: boolean;
  affiliationManagement: boolean;
  affiliationExecutive: boolean;
  affiliationConsultant: boolean;
  affiliationNaikanSponsor: boolean;
  affiliationObserver: boolean;
  affiliationOther: boolean;
  affiliationOtherText: string;
  listingCategory: string;
  listingCategoryId?: number;
  phone: string;
  postalCode: string;
  prefecture: string;
  prefectureId?: number;
  city: string;
  gender: "male" | "female" | "";
  jobChangeIntent: "active" | "considering" | "if_good" | "not_thinking" | "";
  note: string;
  error?: string;
}

export const INITIAL_PREVIEW_DATA: PreviewCustomer[] = [
  {
    id: 1,
    auditCommunity: true,
    naikanCommunity: true,
    aiCommunity: true,
    contractType: "corporate",
    memberCategory: "member",
    auditMemberType: "regular",
    auditMemberPremium: true,
    auditMembershipQualification: "元監査役",
    auditOriginIndustry: "銀行",
    auditJoinedAt: "2024-04-01",
    auditResignedAt: "",
    naikanAffiliation: "内部監査部門",
    naikanJoinedAt: "2025-05-20",
    naikanResignedAt: "",
    aiAffiliation: "総務部門",
    aiJoinedAt: "2024-01-24",
    aiResignedAt: "",
    lastName: "ないかん",
    firstName: "太郎",
    lastNameKana: "タイカン",
    firstNameKana: "タロウ",
    email: "takashi.aoki+fa@calme.dev",
    subEmail1: "takashi.aoki+fa2@calme.dev",
    subEmail2: "takashi.aoki+fa3@calme.dev",
    subEmail3: "",
    company: "株式会社Calme",
    affiliationInternalAudit: true,
    affiliationAuditor: true,
    affiliationManagement: true,
    affiliationExecutive: true,
    affiliationConsultant: true,
    affiliationNaikanSponsor: true,
    affiliationObserver: true,
    affiliationOther: false,
    affiliationOtherText: "",
    listingCategory: "東京証券取引所 プライム",
    phone: "8053643372",
    postalCode: "6360012",
    prefecture: "宮城県",
    city: "北葛城郡王寺町本町5-6-26",
    gender: "male",
    jobChangeIntent: "active",
    note: "中村さんの紹介",
  },
  {
    id: 2,
    auditCommunity: false,
    naikanCommunity: true,
    aiCommunity: false,
    contractType: "individual",
    memberCategory: "sponsor",
    auditMemberType: "",
    auditMemberPremium: false,
    auditMembershipQualification: "",
    auditOriginIndustry: "",
    auditJoinedAt: "",
    auditResignedAt: "",
    naikanAffiliation: "経営企画部門",
    naikanJoinedAt: "2025-10-01",
    naikanResignedAt: "",
    aiAffiliation: "",
    aiJoinedAt: "",
    aiResignedAt: "",
    lastName: "佐藤",
    firstName: "花子",
    lastNameKana: "サトウ",
    firstNameKana: "ハナコ",
    email: "hanako.sato@example.jp",
    subEmail1: "",
    subEmail2: "",
    subEmail3: "",
    company: "佐藤経営研究所",
    affiliationInternalAudit: false,
    affiliationAuditor: false,
    affiliationManagement: true,
    affiliationExecutive: true,
    affiliationConsultant: false,
    affiliationNaikanSponsor: true,
    affiliationObserver: true,
    affiliationOther: true,
    affiliationOtherText: "地域企業支援",
    listingCategory: "未上場",
    phone: "09012345678",
    postalCode: "1000005",
    prefecture: "東京都",
    city: "千代田区丸の内1-1-1",
    gender: "female",
    jobChangeIntent: "considering",
    note: "Meetupスポンサー",
  },
  {
    id: 3,
    auditCommunity: false,
    naikanCommunity: false,
    aiCommunity: false,
    contractType: "corporate",
    memberCategory: "observer",
    auditMemberType: "",
    auditMemberPremium: false,
    auditMembershipQualification: "",
    auditOriginIndustry: "",
    auditJoinedAt: "",
    auditResignedAt: "",
    naikanAffiliation: "",
    naikanJoinedAt: "",
    naikanResignedAt: "",
    aiAffiliation: "",
    aiJoinedAt: "",
    aiResignedAt: "",
    lastName: "鈴木",
    firstName: "一郎",
    lastNameKana: "スズキ",
    firstNameKana: "イチロウ",
    email: "invalid-email",
    subEmail1: "",
    subEmail2: "",
    subEmail3: "",
    company: "鈴木商事株式会社",
    affiliationInternalAudit: false,
    affiliationAuditor: false,
    affiliationManagement: false,
    affiliationExecutive: false,
    affiliationConsultant: true,
    affiliationNaikanSponsor: false,
    affiliationObserver: false,
    affiliationOther: false,
    affiliationOtherText: "",
    listingCategory: "",
    phone: "",
    postalCode: "",
    prefecture: "大阪府",
    city: "大阪市北区",
    gender: "male",
    jobChangeIntent: "not_thinking",
    note: "非会員として登録予定",
    error: "メールアドレスの形式が正しくありません。",
  },
];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isCsvFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".csv");
}

export function selectedCommunityNames(customer: PreviewCustomer): string {
  return [
    customer.auditCommunity && "ベンチャー監査役の会",
    customer.naikanCommunity && "ないかんMeetup",
    customer.aiCommunity && "AI部会",
  ]
    .filter(Boolean)
    .join("、");
}

export function validateCustomer(
  customer: PreviewCustomer,
): string | undefined {
  if (!customer.lastName || !customer.firstName || !customer.email)
    return "必須項目を入力してください。";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email))
    return "メールアドレスの形式が正しくありません。";
  return undefined;
}

export const FLAGS: Array<{
  key:
    | "affiliationInternalAudit"
    | "affiliationAuditor"
    | "affiliationManagement"
    | "affiliationExecutive"
    | "affiliationConsultant"
    | "affiliationNaikanSponsor"
    | "affiliationObserver"
    | "affiliationOther";
  label: string;
}> = [
  { key: "affiliationInternalAudit", label: "内部監査室" },
  { key: "affiliationAuditor", label: "監査役" },
  { key: "affiliationManagement", label: "管理部門" },
  { key: "affiliationExecutive", label: "経営者" },
  { key: "affiliationConsultant", label: "コンサルタント" },
  { key: "affiliationNaikanSponsor", label: "スポンサー" },
  { key: "affiliationObserver", label: "オブザーバー" },
  { key: "affiliationOther", label: "その他" },
];
