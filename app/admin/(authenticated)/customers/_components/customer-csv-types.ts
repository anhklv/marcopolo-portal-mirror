import {
  customerFormSchema,
  type CustomerFormInput,
  validatePhone,
  validatePostalCode,
} from "@/lib/validations/customer";
import { COMMUNITY_CODE } from "@/lib/constants/community";
import type {
  CommunityOption,
  ListingCategoryOption,
  MasterData,
} from "@/lib/types/serialized";

export const CUSTOMER_CSV_HEADERS = [
  "コミュニティ_ベンチャー監査役の会",
  "コミュニティ_ないかんMeetup",
  "コミュニティ_AI部会",
  "契約主体",
  "会員区分",
  "ベンチャー監査役の会_会員種別",
  "ベンチャー監査役の会_プレミアム会員",
  "ベンチャー監査役の会_入会資格",
  "ベンチャー監査役の会_出身業種",
  "ベンチャー監査役の会_入会日",
  "ベンチャー監査役の会_脱退日",
  "ないかんMeetup_所属",
  "ないかんMeetup_入会日",
  "ないかんMeetup_脱退日",
  "AI部会_所属",
  "AI部会_入会日",
  "AI部会_脱退日",
  "姓",
  "名",
  "セイ",
  "メイ",
  "メールアドレス",
  "サブメール1",
  "サブメール2",
  "サブメール3",
  "会社名",
  "所属部署_内部監査室",
  "所属部署_監査役",
  "所属部署_管理部門",
  "所属部署_経営者",
  "所属部署_コンサルタント",
  "所属部署_スポンサー",
  "所属部署_オブザーバー",
  "所属部署_その他",
  "役職",
  "上場区分",
  "電話番号",
  "郵便番号",
  "都道府県",
  "市区町村以下",
  "性別",
  "転職意欲",
  "備考",
] as const;

export const CUSTOMER_CSV_FIELD_ORDER: Array<keyof PreviewCustomer> = [
  "auditCommunity",
  "naikanCommunity",
  "aiCommunity",
  "contractType",
  "memberCategory",
  "auditMemberType",
  "auditMemberPremium",
  "auditMembershipQualificationId",
  "auditOriginIndustryId",
  "auditJoinedAt",
  "auditResignedAt",
  "naikanAffiliationId",
  "naikanJoinedAt",
  "naikanResignedAt",
  "aiAffiliationId",
  "aiJoinedAt",
  "aiResignedAt",
  "lastName",
  "firstName",
  "lastNameKana",
  "firstNameKana",
  "email",
  "subEmail1",
  "subEmail2",
  "subEmail3",
  "company",
  "affiliationInternalAudit",
  "affiliationAuditor",
  "affiliationManagement",
  "affiliationExecutive",
  "affiliationConsultant",
  "affiliationNaikanSponsor",
  "affiliationObserver",
  "affiliationOtherText",
  "position",
  "listingCategoryId",
  "phone",
  "postalCode",
  "prefectureId",
  "city",
  "gender",
  "jobChangeIntent",
  "note",
];

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
  csvEmailValue?: string;
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
  position: string;
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
  payload?: CustomerFormInput;
  error?: string;
  csvIssues?: Array<{ key: keyof PreviewCustomer; message: string }>;
  fieldErrors?: Partial<Record<keyof PreviewCustomer, string[]>>;
}
export interface CsvMappingOptions {
  communities: CommunityOption[];
  prefectures: MasterData[];
  listingCategories: ListingCategoryOption[];
  departments: MasterData[];
  originIndustries: MasterData[];
  membershipQualifications: MasterData[];
  affiliations: MasterData[];
  isSuper: boolean;
  scopedCommunityIds: number[];
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === "") quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (quoted) throw new Error("CSVファイルの引用符が正しくありません。");
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export async function readCustomerCsv(
  file: File,
  o: CsvMappingOptions,
): Promise<PreviewCustomer[]> {
  if (!file.name.toLowerCase().endsWith(".csv"))
    throw new Error("CSVファイルを指定してください。");
  if (file.size > 5 * 1024 * 1024)
    throw new Error("ファイルサイズが上限を超えています。");
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true })
      .decode(await file.arrayBuffer())
      .replace(/^\uFEFF/, "");
  } catch {
    throw new Error("ファイルの文字コードが不正です。");
  }
  const rows = parseCsv(text);
  if (!rows.length) throw new Error("ヘッダー行が存在しません。");
  const header = rows[0].map((x) => x.trim());
  if (
    header.length !== 43 ||
    header.some((x, i) => x !== CUSTOMER_CSV_HEADERS[i])
  )
    throw new Error("CSVファイルの列数が不正です。");
  const data = rows.slice(1).filter((r) => r.some(Boolean));
  if (!data.length) throw new Error("ファイルにデータが存在しません。");
  if (data.length > 1000) throw new Error("取込可能件数を超えています。");
  const customers = data.map((r, i) => mapRow(r, i + 1, o));
  const emailRows = new Map<string, number[]>();
  customers.forEach((customer) => {
    const email = customer.email.trim().toLocaleLowerCase();
    if (email) emailRows.set(email, [...(emailRows.get(email) ?? []), customer.id]);
  });

  customers.forEach((customer) => {
    const email = customer.email.trim().toLocaleLowerCase();
    if ((emailRows.get(email)?.length ?? 0) > 1) {
      const originalEmail = customer.email;
      customer.csvIssues?.push({
        key: "email",
        message: `${customer.id}行目: メールアドレス「${originalEmail}」がCSVファイル内で重複しています。`,
      });
      Object.assign(
        customer,
        rebuildPayload({ ...customer }, o),
      );
    }
  });
  return customers;
}

export function applyExistingCustomerEmailIssues(
  customers: PreviewCustomer[],
  existingEmails: readonly string[],
  o: CsvMappingOptions,
): PreviewCustomer[] {
  const existing = new Set(
    existingEmails.map((email) => email.trim().toLocaleLowerCase()),
  );
  return customers.map((customer) => {
    const originalEmail = customer.csvEmailValue?.trim() ?? "";
    if (!originalEmail || !existing.has(originalEmail.toLocaleLowerCase()))
      return customer;
    const withIssue: PreviewCustomer = {
      ...customer,
      csvIssues: [
        ...(customer.csvIssues ?? []),
        {
          key: "email",
          // message: `${customer.id}行目：Toメールアドレス「${originalEmail}」は既存顧客のメールアドレスと重複しています。`,
          message: `${customer.id}行目：このメールアドレスは既に登録されています`,
        },
      ],
    };
    return rebuildPayload(withIssue, o);
  });
}

function mapRow(
  row: string[],
  id: number,
  o: CsvMappingOptions,
): PreviewCustomer {
  const errors: string[] = [];
  if (row.length !== 42) errors.push("列数が不正です");
  const v = (i: number) => (row[i] ?? "").trim();
  const csvIssues: NonNullable<PreviewCustomer["csvIssues"]> = [];
  const remember = (
    key: keyof PreviewCustomer,
    label: string,
    message: string,
  ) => csvIssues.push({ key, message: `${id}行目: ${label}${message}` });
  const invalidValue = (key: keyof PreviewCustomer, label: string, value: string) =>
    remember(key, label, `「${value}」は正しくありません。`);
  const tooLong = (
    column: number,
    key: keyof PreviewCustomer,
    label: string,
    max: number,
  ) => {
    if (v(column).length > max)
      remember(key, label, `は${max}文字以内で入力してください。`);
  };
  const invalidDate = (value: string) => {
    const match = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(value);
    if (!match) return !!value;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return (
      date.getFullYear() !== Number(match[1]) ||
      date.getMonth() !== Number(match[2]) - 1 ||
      date.getDate() !== Number(match[3])
    );
  };
  const flag = (i: number, label: string) => {
    if (!["0", "1"].includes(v(i)))
      errors.push(`${label}は0または1で入力してください`);
    return v(i) === "1";
  };
  const pick = <T extends string>(
    i: number,
    map: Record<string, T>,
    label: string,
    fallback: T,
  ) => {
    const x = map[v(i)];
    if (!x) errors.push(`${label}の値が不正です`);
    return x ?? fallback;
  };
  const master = (label: string, value: string, items: MasterData[]) => {
    if (!value) return undefined;
    const x = items.find((y) => y.name === value);
    if (!x) errors.push(`${label}「${value}」が見つかりません`);
    return x?.id;
  };
  const audit = flag(0, "コミュニティ"),
    naikan = flag(1, "コミュニティ"),
    ai = flag(2, "コミュニティ");
  const byCode = (code: string) => o.communities.find((x) => x.code === code);
  const selected = [
    [audit, byCode(COMMUNITY_CODE.VENTURE_AUDITOR)],
    [naikan, byCode(COMMUNITY_CODE.NAIKAN_MEETUP)],
    [ai, byCode(COMMUNITY_CODE.AI_CLUB)],
  ] as const;
  selected.forEach(([on, c]) => {
    if (on && (!c || (!o.isSuper && !o.scopedCommunityIds.includes(c.id))))
      errors.push("権限のないコミュニティが含まれています");
  });
  const contractType = pick(
    3,
    { "1": "corporate", "2": "individual" },
    "契約主体",
    "corporate",
  ),
    memberCategory = pick(
      4,
      { "1": "member", "2": "sponsor", "3": "observer" },
      "会員区分",
      "member",
    );
  const auditMemberType =
    v(5) === "正会員" ? "regular" : v(5) === "オンライン会員" ? "online" : "";
  if (v(5) && !auditMemberType) errors.push("会員種別の値が不正です");
  const auditPremium = flag(6, "プレミアム会員");
  const qualificationId = master("入会資格", v(7), o.membershipQualifications),
    originId = master("出身業種", v(8), o.originIndustries),
    naikanAffId = master("ないかんMeetup_所属", v(11), o.affiliations),
    aiAffId = master("AI部会_所属", v(14), o.affiliations);
  const deptNames = [
    "内部監査室",
    "監査役",
    "管理部門",
    "経営者",
    "コンサルタント",
    "スポンサー",
    "オブザーバー",
  ],
    deptFlags = deptNames.map(
      (name, i) => [name, flag(26 + i, `所属部署_${name}`)] as const,
    ),
    other = v(33),
    otherId = o.departments.find((x) => x.name === "その他")?.id;
  const departmentIds = deptFlags
    .filter((x) => x[1])
    .map((x) => o.departments.find((d) => d.name === x[0])?.id)
    .filter((x): x is number => !!x);
  if (other && otherId) departmentIds.push(otherId);
  const listing = v(35)
    ? o.listingCategories.find(
      (x) =>
        x.marketName === v(35) ||
        `${x.stockExchangeName} ${x.marketName}` === v(35),
    )
    : undefined;
  if (v(35) && !listing) errors.push(`上場区分「${v(35)}」が見つかりません`);
  const prefectureId = master("都道府県", v(38), o.prefectures);
  const communities: NonNullable<CustomerFormInput["communities"]> = [];
  const add = (
    on: boolean,
    c: CommunityOption | undefined,
    joinedAt: string,
    resignedAt: string,
    extra: object,
  ) => {
    if (on && c)
      communities.push({ communityId: c.id, joinedAt, resignedAt, ...extra });
  };
  add(audit, byCode(COMMUNITY_CODE.VENTURE_AUDITOR), v(9), v(10), {
    auditMemberType: auditMemberType || null,
    auditMemberPremium: auditPremium,
    membershipQualificationId: qualificationId,
    originIndustryId: originId,
  });
  add(naikan, byCode(COMMUNITY_CODE.NAIKAN_MEETUP), v(12), v(13), {
    affiliationId: naikanAffId,
  });
  add(ai, byCode(COMMUNITY_CODE.AI_CLUB), v(15), v(16), {
    affiliationId: aiAffId,
  });
  const gender = v(40)
    ? pick(40, { "1": "male", "2": "female" }, "性別", "")
    : null,
    jobChangeIntent = v(41)
      ? pick(
        41,
        {
          "1": "active",
          "2": "considering",
          "3": "if_good",
          "4": "not_thinking",
        },
        "転職意欲",
        "",
      )
      : null;
  const raw = {
    firstName: v(18),
    lastName: v(17),
    firstNameKana: v(20),
    lastNameKana: v(19),
    email: v(21),
    subEmails: [v(22), v(23), v(24)].filter(Boolean),
    company: v(25),
    position: v(34),
    phone: v(36),
    postalCode: v(37),
    prefectureId,
    city: v(39),
    gender,
    listingCategoryId: listing?.id,
    memberCategory,
    contractType,
    jobChangeIntent,
    note: v(42),
    departmentIds,
    otherDepartmentId: otherId,
    departmentOtherNote: other,
    communities,
  };
  const parsed = customerFormSchema.safeParse(raw);
  if (!parsed.success)
    errors.push(...parsed.error.issues.map((x) => x.message));
  if (audit && memberCategory === "member" && !auditMemberType)
    errors.push("会員種別を選択してください");
  const flagKeys: Array<keyof PreviewCustomer> = [
    "auditCommunity",
    "naikanCommunity",
    "aiCommunity",
    "auditMemberPremium",
    "affiliationInternalAudit",
    "affiliationAuditor",
    "affiliationManagement",
    "affiliationExecutive",
    "affiliationConsultant",
    "affiliationNaikanSponsor",
    "affiliationObserver",
  ];
  [0, 1, 2, 6, 26, 27, 28, 29, 30, 31, 32].forEach((column, index) => {
    if (!["0", "1"].includes(v(column)))
      invalidValue(flagKeys[index], CUSTOMER_CSV_HEADERS[column], v(column));
  });
  if (!["1", "2"].includes(v(3)))
    invalidValue("contractType", CUSTOMER_CSV_HEADERS[3], v(3));
  if (!["1", "2", "3"].includes(v(4)))
    invalidValue("memberCategory", CUSTOMER_CSV_HEADERS[4], v(4));
  if (v(5) && !auditMemberType)
    invalidValue("auditMemberType", CUSTOMER_CSV_HEADERS[5], v(5));
  if (v(40) && !["1", "2"].includes(v(40)))
    invalidValue("gender", CUSTOMER_CSV_HEADERS[40], v(40));
  if (v(41) && !["1", "2", "3", "4"].includes(v(41)))
    invalidValue("jobChangeIntent", CUSTOMER_CSV_HEADERS[41], v(41));
  if (v(7) && !qualificationId)
    invalidValue("auditMembershipQualificationId", CUSTOMER_CSV_HEADERS[7], v(7));
  if (v(8) && !originId)
    invalidValue("auditOriginIndustryId", CUSTOMER_CSV_HEADERS[8], v(8));
  if (v(11) && !naikanAffId)
    invalidValue("naikanAffiliationId", CUSTOMER_CSV_HEADERS[11], v(11));
  if (v(14) && !aiAffId)
    invalidValue("aiAffiliationId", CUSTOMER_CSV_HEADERS[14], v(14));
  if (v(35) && !listing)
    remember("listingCategoryId", CUSTOMER_CSV_HEADERS[35], `「${v(35)}」は存在しません。`);
  if (v(38) && !prefectureId)
    remember("prefectureId", CUSTOMER_CSV_HEADERS[38], `「${v(38)}」は都道府県マスタに存在しません。`);

  const lengthRules: Array<[number, keyof PreviewCustomer, number]> = [
    [5, "auditMemberType", 50], [7, "auditMembershipQualificationId", 100],
    [8, "auditOriginIndustryId", 100], [11, "naikanAffiliationId", 100],
    [14, "aiAffiliationId", 100], [17, "lastName", 100], [18, "firstName", 100],
    [19, "lastNameKana", 100], [20, "firstNameKana", 100], [21, "email", 255],
    [25, "company", 200], [33, "affiliationOtherText", 255],
    [34, "position", 50], [38, "prefectureId", 20], [39, "city", 255],
    [42, "note", 500],
  ];
  lengthRules.forEach(([column, key, max]) =>
    tooLong(column, key, CUSTOMER_CSV_HEADERS[column], max),
  );
  const subEmailTotal = [v(22), v(23), v(24)].join("").length;
  if (subEmailTotal > 255)
    ["subEmail1", "subEmail2", "subEmail3"].forEach((key) =>
      remember(
        key as keyof PreviewCustomer,
        "Ccメールアドレス",
        "は255文字以内で入力してください。",
      ),
    );
  if (!v(17)) remember("lastName", "姓", "を入力してください");
  if (!v(18)) remember("firstName", "名", "を入力してください");
  if (!v(21)) remember("email", "メールアドレス", "を入力してください");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (v(21) && !emailPattern.test(v(21)))
    // remember("email", "Toメールアドレス", `「${v(21)}」の形式が正しくありません。`);
    remember("email", "", `有効なメールアドレスを入力してください`);
  [22, 23, 24].forEach((column, index) => {
    if (v(column) && !emailPattern.test(v(column)))
      remember(
        `subEmail${index + 1}` as keyof PreviewCustomer,
        CUSTOMER_CSV_HEADERS[column],
        `「${v(column)}」の形式が正しくありません。`,
      );
  });
  const allEmails = [v(21), v(22), v(23), v(24)]
    .filter(Boolean)
    .map((email) => email.toLocaleLowerCase());
  if (new Set(allEmails).size !== allEmails.length)
    remember("email", "メールアドレス", `「${v(21)}」が重複しています。`);
  const dateRules: Array<[number, keyof PreviewCustomer]> = [
    [9, "auditJoinedAt"], [10, "auditResignedAt"], [12, "naikanJoinedAt"],
    [13, "naikanResignedAt"], [15, "aiJoinedAt"], [16, "aiResignedAt"],
  ];
  dateRules.forEach(([column, key]) => {
    if (invalidDate(v(column)))
      remember(key, CUSTOMER_CSV_HEADERS[column], "は正しい日付形式で入力してください。");
  });
  const phoneError = validatePhone(v(36));
  if (phoneError)
    remember(
      "phone",
      "",
      `${phoneError.startsWith("電話番号") ? phoneError : `電話番号は${phoneError}`}。`,
    );
  const postalCodeError = validatePostalCode(v(37));
  if (postalCodeError)
    remember(
      "postalCode",
      "",
      `${postalCodeError.startsWith("郵便番号") ? postalCodeError : `郵便番号は${postalCodeError}`}。`,
    );
  selected.forEach(([on, community], index) => {
    if (
      on &&
      (!community ||
        (!o.isSuper && !o.scopedCommunityIds.includes(community.id)))
    )
      remember(
        ["auditCommunity", "naikanCommunity", "aiCommunity"][
        index
        ] as keyof PreviewCustomer,
        CUSTOMER_CSV_HEADERS[index],
        "は操作権限がありません。",
      );
  });
  const hasCsvIssue = (key: keyof PreviewCustomer) =>
    csvIssues.some((issue) => issue.key === key);
  const csvString = (key: keyof PreviewCustomer, column: number) =>
    hasCsvIssue(key) ? "" : v(column);
  const preview: PreviewCustomer = {
    id,
    auditCommunity: audit,
    naikanCommunity: naikan,
    aiCommunity: ai,
    contractType,
    memberCategory,
    auditMemberType,
    auditMemberPremium: auditPremium,
    auditMembershipQualification: csvString("auditMembershipQualificationId", 7),
    auditMembershipQualificationId: hasCsvIssue(
      "auditMembershipQualificationId",
    )
      ? undefined
      : qualificationId,
    auditOriginIndustry: csvString("auditOriginIndustryId", 8),
    auditOriginIndustryId: hasCsvIssue("auditOriginIndustryId")
      ? undefined
      : originId,
    auditJoinedAt: v(9),
    auditResignedAt: v(10),
    naikanAffiliation: csvString("naikanAffiliationId", 11),
    naikanAffiliationId: hasCsvIssue("naikanAffiliationId")
      ? undefined
      : naikanAffId,
    naikanJoinedAt: v(12),
    naikanResignedAt: v(13),
    aiAffiliation: csvString("aiAffiliationId", 14),
    aiAffiliationId: hasCsvIssue("aiAffiliationId") ? undefined : aiAffId,
    aiJoinedAt: v(15),
    aiResignedAt: v(16),
    lastName: v(17),
    firstName: v(18),
    lastNameKana: v(19),
    firstNameKana: v(20),
    email: v(21),
    csvEmailValue: v(21),
    subEmail1: v(22),
    subEmail2: v(23),
    subEmail3: v(24),
    visibleSubEmailCount: [
      v(22),
      v(23),
      v(24),
    ].filter(Boolean).length,
    company: v(25),
    affiliationInternalAudit: deptFlags[0][1],
    affiliationAuditor: deptFlags[1][1],
    affiliationManagement: deptFlags[2][1],
    affiliationExecutive: deptFlags[3][1],
    affiliationConsultant: deptFlags[4][1],
    affiliationNaikanSponsor: deptFlags[5][1],
    affiliationObserver: deptFlags[6][1],
    affiliationOther: !!other,
    affiliationOtherText: v(33),
    position: v(34),
    listingCategory: csvString("listingCategoryId", 35),
    listingCategoryId: hasCsvIssue("listingCategoryId")
      ? undefined
      : listing?.id,
    phone: v(36),
    postalCode: v(37),
    prefecture: csvString("prefectureId", 38),
    prefectureId: hasCsvIssue("prefectureId") ? undefined : prefectureId,
    city: v(39),
    gender: (gender ?? "") as PreviewCustomer["gender"],
    jobChangeIntent: (jobChangeIntent ??
      "") as PreviewCustomer["jobChangeIntent"],
    note: v(42),
    csvIssues,
  };
  return rebuildPayload(preview, o);
}

export function rebuildPayload(
  c: PreviewCustomer,
  o: Pick<
    CsvMappingOptions,
    "communities" | "departments" | "isSuper" | "scopedCommunityIds"
  >,
): PreviewCustomer {
  const byCode = (code: string) => o.communities.find((x) => x.code === code),
    communities: NonNullable<CustomerFormInput["communities"]> = [];
  const add = (
    on: boolean,
    code: string,
    j: string,
    r: string,
    extra: object,
  ) => {
    const x = byCode(code);
    if (on && x)
      communities.push({
        communityId: x.id,
        joinedAt: j.replace(/-/g, "/"),
        resignedAt: r.replace(/-/g, "/"),
        ...extra,
      });
  };
  add(
    c.auditCommunity,
    COMMUNITY_CODE.VENTURE_AUDITOR,
    c.auditJoinedAt,
    c.auditResignedAt,
    {
      auditMemberType: c.auditMemberType || null,
      auditMemberPremium: c.auditMemberPremium,
      membershipQualificationId: c.auditMembershipQualificationId,
      originIndustryId: c.auditOriginIndustryId,
    },
  );
  add(
    c.naikanCommunity,
    COMMUNITY_CODE.NAIKAN_MEETUP,
    c.naikanJoinedAt,
    c.naikanResignedAt,
    { affiliationId: c.naikanAffiliationId },
  );
  add(c.aiCommunity, COMMUNITY_CODE.AI_CLUB, c.aiJoinedAt, c.aiResignedAt, {
    affiliationId: c.aiAffiliationId,
  });
  const checks: [
    [boolean, string],
    [boolean, string],
    [boolean, string],
    [boolean, string],
    [boolean, string],
    [boolean, string],
    [boolean, string],
    [boolean, string],
  ] = [
      [c.affiliationInternalAudit, "内部監査室"],
      [c.affiliationAuditor, "監査役"],
      [c.affiliationManagement, "管理部門"],
      [c.affiliationExecutive, "経営者"],
      [c.affiliationConsultant, "コンサルタント"],
      [c.affiliationNaikanSponsor, "スポンサー"],
      [c.affiliationObserver, "オブザーバー"],
      [c.affiliationOther, "その他"],
    ],
    otherId = o.departments.find((x) => x.name === "その他")?.id;
  const raw = {
    firstName: c.firstName,
    lastName: c.lastName,
    firstNameKana: c.firstNameKana,
    lastNameKana: c.lastNameKana,
    email: c.email,
    subEmails: [c.subEmail1, c.subEmail2, c.subEmail3].filter(Boolean),
    company: c.company,
    position: c.position,
    phone: c.phone,
    postalCode: c.postalCode,
    prefectureId: c.prefectureId,
    city: c.city,
    gender: c.gender || null,
    listingCategoryId: c.listingCategoryId,
    memberCategory: c.memberCategory,
    contractType: c.contractType,
    jobChangeIntent: c.jobChangeIntent || null,
    note: c.note,
    departmentIds: checks
      .filter((x) => x[0])
      .map((x) => o.departments.find((d) => d.name === x[1])?.id)
      .filter((x): x is number => !!x),
    otherDepartmentId: otherId,
    departmentOtherNote: c.affiliationOtherText,
    communities,
  };
  const parsed = customerFormSchema.safeParse(raw),
    fieldErrors: NonNullable<PreviewCustomer["fieldErrors"]> = {},
    addFieldError = (key: keyof PreviewCustomer, message: string) => {
      fieldErrors[key] = [...(fieldErrors[key] ?? []), message];
    },
    issues = parsed.success ? [] : parsed.error.issues.map((x) => x.message);
  if (!parsed.success) {
    const communityKeys = [
      ...(c.auditCommunity
        ? [{ joinedAt: "auditJoinedAt", resignedAt: "auditResignedAt" }]
        : []),
      ...(c.naikanCommunity
        ? [{ joinedAt: "naikanJoinedAt", resignedAt: "naikanResignedAt" }]
        : []),
      ...(c.aiCommunity
        ? [{ joinedAt: "aiJoinedAt", resignedAt: "aiResignedAt" }]
        : []),
    ] as Array<Record<string, keyof PreviewCustomer>>;
    const directKeys: Record<string, keyof PreviewCustomer> = {
      departmentIds: "affiliationInternalAudit",
      departmentOtherNote: "affiliationOtherText",
      position: "position",
    };
    parsed.error.issues.forEach((issue) => {
      const [root, index, nested] = issue.path;
      let key: keyof PreviewCustomer | undefined;
      if (root === "subEmails" && typeof index === "number")
        key = `subEmail${index + 1}` as keyof PreviewCustomer;
      else if (root === "communities" && typeof index === "number")
        key = communityKeys[index]?.[String(nested)];
      else if (typeof root === "string")
        key = directKeys[root] ?? (root as keyof PreviewCustomer);
      if (key) addFieldError(key, issue.message);
    });
  }
  if (c.auditCommunity && c.memberCategory === "member" && !c.auditMemberType) {
    issues.push("会員種別を選択してください");
    addFieldError("auditMemberType", "会員種別を選択してください");
  }
  if (
    !o.isSuper &&
    communities.some(
      (community) => !o.scopedCommunityIds.includes(community.communityId),
    )
  )
    issues.push("権限のないコミュニティが含まれています");
  return {
    ...c,
    payload: parsed.success && !issues.length ? parsed.data : undefined,
    error: issues.length ? [...new Set(issues)].join("、") : undefined,
    fieldErrors,
  };
}

export function isCsvIssueApplicable(
  customer: PreviewCustomer,
  key: keyof PreviewCustomer,
) {
  const anyCommunity =
    customer.auditCommunity ||
    customer.naikanCommunity ||
    customer.aiCommunity;
  if (key === "contractType" || key === "memberCategory") return anyCommunity;
  if (key === "auditMemberType" || key === "auditMemberPremium")
    return customer.auditCommunity && customer.memberCategory === "member";
  if (
    [
      "auditMembershipQualificationId",
      "auditOriginIndustryId",
      "auditJoinedAt",
      "auditResignedAt",
    ].includes(key)
  )
    return customer.auditCommunity;
  if (
    ["naikanAffiliationId", "naikanJoinedAt", "naikanResignedAt"].includes(
      key,
    )
  )
    return customer.naikanCommunity;
  if (["aiAffiliationId", "aiJoinedAt", "aiResignedAt"].includes(key))
    return customer.aiCommunity;
  return true;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
export function isCsvFile(file: File) {
  return file.name.toLowerCase().endsWith(".csv");
}
export function selectedCommunityNames(c: PreviewCustomer) {
  return [
    c.auditCommunity && "ベンチャー監査役の会",
    c.naikanCommunity && "ないかんMeetup",
    c.aiCommunity && "AI部会",
  ]
    .filter(Boolean)
    .join("、");
}
export function validateCustomer(c: PreviewCustomer) {
  return c.error;
}

export function clearCsvIssues(
  customer: PreviewCustomer,
  correctedKeys: Array<keyof PreviewCustomer>,
): PreviewCustomer {
  return {
    ...customer,
    csvIssues: customer.csvIssues?.filter(
      (issue) => !correctedKeys.includes(issue.key),
    ),
  };
}

export function clearCsvIssuesForFieldChange<K extends keyof PreviewCustomer>(
  customer: PreviewCustomer,
  key: K,
  value: PreviewCustomer[K],
): PreviewCustomer {
  const correctedKeys: Array<keyof PreviewCustomer> = [key];
  if (key === "auditCommunity" && value === false)
    correctedKeys.push(
      "auditMemberType",
      "auditMemberPremium",
      "auditMembershipQualificationId",
      "auditOriginIndustryId",
      "auditJoinedAt",
      "auditResignedAt",
    );
  if (key === "naikanCommunity" && value === false)
    correctedKeys.push(
      "naikanAffiliationId",
      "naikanJoinedAt",
      "naikanResignedAt",
    );
  if (key === "aiCommunity" && value === false)
    correctedKeys.push("aiAffiliationId", "aiJoinedAt", "aiResignedAt");
  if (key === "memberCategory" && value !== "member")
    correctedKeys.push("auditMemberType", "auditMemberPremium");
  return clearCsvIssues(customer, correctedKeys);
}
