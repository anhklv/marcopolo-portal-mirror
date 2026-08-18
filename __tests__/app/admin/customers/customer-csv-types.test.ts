import { describe, expect, it } from "vitest";
import {
  CUSTOMER_CSV_HEADERS,
  clearCsvIssues,
  clearCsvIssuesForFieldChange,
  parseCsv,
  readCustomerCsv,
  rebuildPayload,
} from "@/app/admin/(authenticated)/customers/_components/customer-csv-types";
import {
  customerFormSchema,
  normalizeCustomerFormDatesForValidation,
} from "@/lib/validations/customer";

describe("customer CSV parser", () => {
  const csvFile = (text: string) =>
    ({
      name: "customers.csv",
      size: new TextEncoder().encode(text).byteLength,
      arrayBuffer: async () => new TextEncoder().encode(text).buffer,
    }) as File;
  it("parses RFC4180 quotes, commas, escaped quotes and quoted newlines", () => {
    expect(parseCsv('a,"b,c","d""e"\r\n1,"two\nlines",3')).toEqual([
      ["a", "b,c", 'd"e'],
      ["1", "two\nlines", "3"],
    ]);
  });

  it("rejects a CSV without data rows", async () => {
    const file = csvFile(CUSTOMER_CSV_HEADERS.join(","));
    await expect(
      readCustomerCsv(file, {
        communities: [],
        prefectures: [],
        listingCategories: [],
        departments: [],
        originIndustries: [],
        membershipQualifications: [],
        affiliations: [],
        isSuper: true,
        scopedCommunityIds: [],
      }),
    ).rejects.toThrow("ファイルにデータが存在しません。");
  });

  it("trims header cells before exact comparison", async () => {
    const row = Array.from({ length: 42 }, () => "");
    [0, 1, 2, 6, 26, 27, 28, 29, 30, 31, 32].forEach(
      (index) => (row[index] = "0"),
    );
    row[3] = "1";
    row[4] = "1";
    row[17] = "姓";
    row[18] = "名";
    row[21] = "test@example.com";
    const header = [...CUSTOMER_CSV_HEADERS];
    header[32] += " ";
    const file = csvFile(`${header.join(",")}\n${row.join(",")}`);
    const result = await readCustomerCsv(file, {
      communities: [],
      prefectures: [],
      listingCategories: [],
      departments: [],
      originIndustries: [],
      membershipQualifications: [],
      affiliations: [],
      isSuper: true,
      scopedCommunityIds: [],
    });
    expect(result).toHaveLength(1);
  });

  it("allows the server to revalidate transformed CSV dates", () => {
    const payload = customerFormSchema.parse({
      firstName: "太郎",
      lastName: "山田",
      email: "taro@example.com",
      departmentIds: [1],
      communities: [
        { communityId: 1, joinedAt: "2024/04/01", resignedAt: "2025/03/31" },
      ],
    });

    expect(payload.communities?.[0].joinedAt).toBe("2024-04-01");
    expect(
      customerFormSchema.safeParse(
        normalizeCustomerFormDatesForValidation(payload),
      ).success,
    ).toBe(true);
  });

  it("keeps invalid CSV fallback errors until the responsible field is corrected", async () => {
    const row = Array.from({ length: 42 }, () => "");
    [0, 1, 2, 6, 26, 27, 28, 29, 30, 31, 32].forEach(
      (index) => (row[index] = "0"),
    );
    row[0] = "1";
    row[3] = "9";
    row[4] = "2";
    row[17] = "山田";
    row[18] = "太郎";
    row[21] = "taro@example.com";
    row[26] = "1";
    row[34] = "存在しない市場";
    row[37] = "存在しない県";
    const options = {
      communities: [
        { id: 10, code: "venture_auditor", name: "ベンチャー監査役の会" },
      ],
      prefectures: [{ id: 1, name: "東京都" }],
      listingCategories: [
        { id: 1, marketName: "プライム", stockExchangeName: "東京証券取引所" },
      ],
      departments: [{ id: 1, name: "内部監査室" }],
      originIndustries: [],
      membershipQualifications: [],
      affiliations: [],
      isSuper: true,
      scopedCommunityIds: [],
    };
    const [customer] = await readCustomerCsv(
      csvFile(`${CUSTOMER_CSV_HEADERS.join(",")}\n${row.join(",")}`),
      options,
    );

    expect(customer.csvIssues?.map((issue) => issue.key)).toEqual(
      expect.arrayContaining([
        "contractType",
        "listingCategoryId",
        "prefectureId",
      ]),
    );
    const invalid = rebuildPayload(customer, options);
    expect(invalid.error).toBeTruthy();
    expect(invalid.fieldErrors?.contractType).toContain(
      "契約主体を選択してください",
    );
    expect(invalid.fieldErrors?.listingCategoryId).toContain(
      "上場区分を選択してください",
    );
    expect(invalid.fieldErrors?.prefectureId).toContain(
      "都道府県を選択してください",
    );

    const onlyContractCorrected = clearCsvIssues(customer, ["contractType"]);
    expect(rebuildPayload(onlyContractCorrected, options).error).toContain(
      "上場区分を選択してください",
    );
    const allCorrected = clearCsvIssues(
      {
        ...customer,
        listingCategoryId: 1,
        prefectureId: 1,
      },
      ["contractType", "listingCategoryId", "prefectureId"],
    );
    expect(rebuildPayload(allCorrected, options).error).toBeUndefined();
  });

  it("does not block hidden dependent fields when invalid community checkboxes fall back to off", async () => {
    const row = Array.from({ length: 42 }, () => "");
    [0, 1, 2, 6].forEach((index) => (row[index] = "9"));
    [27, 28, 29, 30, 31, 32].forEach((index) => (row[index] = "0"));
    row[26] = "1";
    row[3] = "9";
    row[4] = "9";
    row[17] = "山田";
    row[18] = "太郎";
    row[21] = "taro@example.com";
    const options = {
      communities: [],
      prefectures: [],
      listingCategories: [],
      departments: [{ id: 1, name: "内部監査室" }],
      originIndustries: [],
      membershipQualifications: [],
      affiliations: [],
      isSuper: true,
      scopedCommunityIds: [],
    };
    const [customer] = await readCustomerCsv(
      csvFile(`${CUSTOMER_CSV_HEADERS.join(",")}\n${row.join(",")}`),
      options,
    );

    expect(customer.auditCommunity).toBe(false);
    expect(customer.naikanCommunity).toBe(false);
    expect(customer.aiCommunity).toBe(false);
    expect(customer.csvIssues?.map((issue) => issue.key)).toEqual(
      expect.arrayContaining([
        "auditCommunity",
        "naikanCommunity",
        "aiCommunity",
        "contractType",
        "memberCategory",
      ]),
    );
    expect(rebuildPayload(customer, options).error).toBeUndefined();
  });

  it("revalidates community scope after editing", () => {
    const customer = {
      id: 1,
      auditCommunity: true,
      naikanCommunity: false,
      aiCommunity: false,
      contractType: "corporate" as const,
      memberCategory: "sponsor" as const,
      auditMemberType: "" as const,
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
      lastName: "山田",
      firstName: "太郎",
      lastNameKana: "",
      firstNameKana: "",
      email: "taro@example.com",
      subEmail1: "",
      subEmail2: "",
      subEmail3: "",
      company: "",
      affiliationInternalAudit: true,
      affiliationAuditor: false,
      affiliationManagement: false,
      affiliationExecutive: false,
      affiliationConsultant: false,
      affiliationNaikanSponsor: false,
      affiliationObserver: false,
      affiliationOther: false,
      affiliationOtherText: "",
      listingCategory: "",
      phone: "",
      postalCode: "",
      prefecture: "",
      city: "",
      gender: "" as const,
      jobChangeIntent: "" as const,
      note: "",
    };
    expect(
      rebuildPayload(customer, {
        communities: [{ id: 10, code: "venture_auditor", name: "監査役" }],
        departments: [{ id: 1, name: "内部監査室" }],
        isSuper: false,
        scopedCommunityIds: [],
      }).error,
    ).toContain("権限のないコミュニティ");
  });

  it("clears hidden audit CSV issues when member category changes", () => {
    const customer = {
      id: 1,
      auditCommunity: true,
      naikanCommunity: false,
      aiCommunity: false,
      contractType: "corporate" as const,
      memberCategory: "member" as const,
      auditMemberType: "" as const,
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
      lastName: "山田",
      firstName: "太郎",
      lastNameKana: "",
      firstNameKana: "",
      email: "taro@example.com",
      subEmail1: "",
      subEmail2: "",
      subEmail3: "",
      company: "",
      affiliationInternalAudit: true,
      affiliationAuditor: false,
      affiliationManagement: false,
      affiliationExecutive: false,
      affiliationConsultant: false,
      affiliationNaikanSponsor: false,
      affiliationObserver: false,
      affiliationOther: false,
      affiliationOtherText: "",
      listingCategory: "",
      phone: "",
      postalCode: "",
      prefecture: "",
      city: "",
      gender: "" as const,
      jobChangeIntent: "" as const,
      note: "",
      csvIssues: [
        { key: "auditMemberType" as const, message: "会員種別が不正です" },
      ],
    };
    const changed = clearCsvIssuesForFieldChange(
      { ...customer, memberCategory: "sponsor" },
      "memberCategory",
      "sponsor",
    );
    expect(changed.csvIssues).toEqual([]);
    expect(
      rebuildPayload(changed, {
        communities: [{ id: 10, code: "venture_auditor", name: "監査役" }],
        departments: [{ id: 1, name: "内部監査室" }],
        isSuper: true,
        scopedCommunityIds: [],
      }).error,
    ).toBeUndefined();
  });

  it("clears all hidden community-specific CSV issues when deselected", () => {
    const customer = {
      id: 1,
      auditCommunity: false,
      csvIssues: [
        { key: "auditMemberType" as const, message: "会員種別が不正です" },
        { key: "auditJoinedAt" as const, message: "入会日が不正です" },
        { key: "email" as const, message: "メールが不正です" },
      ],
    } as Parameters<typeof clearCsvIssuesForFieldChange>[0];
    const changed = clearCsvIssuesForFieldChange(
      customer,
      "auditCommunity",
      false,
    );
    expect(changed.csvIssues).toEqual([
      { key: "email", message: "メールが不正です" },
    ]);
  });
});
