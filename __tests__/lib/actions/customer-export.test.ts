import { describe, it, expect, vi, beforeEach } from "vitest";
import "@/__tests__/helpers/mock-prisma";
import { CUSTOMER_EXPORT_HEADERS } from "@/lib/helpers/customer-export-csv";

// next/cache, next/navigation のモック
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// auth関連のモック
const mockRequireAuthenticatedAdmin = vi.fn();

vi.mock("@/lib/auth/permissions", () => ({
  requireAuthenticatedAdmin: (...args: unknown[]) => mockRequireAuthenticatedAdmin(...args),
  canAccessCustomer: vi.fn(),
}));

// repository のモック
const mockRepoFindAll = vi.fn();

vi.mock("@/lib/repositories/customer.repository", () => ({
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  existsByEmail: vi.fn(),
  findAll: (...args: unknown[]) => mockRepoFindAll(...args),
}));

import { exportCustomersAction } from "@/lib/actions/customer.actions";

function setupSuperAdmin() {
  mockRequireAuthenticatedAdmin.mockResolvedValue({
    admin: { id: 1, role: "super", adminCommunities: [] },
    isSuper: true,
    scopedCommunityIds: [1, 2, 3],
  });
}

const makeExportCustomer = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  firstName: "太郎",
  lastName: "田中",
  firstNameKana: "タロウ",
  lastNameKana: "タナカ",
  email: "tanaka@example.com",
  subEmails: ["sub1@example.com", "sub2@example.com"],
  phone: "090-1234-5678",
  company: "テスト株式会社",
  postalCode: "100-0001",
  city: "千代田区",
  gender: "male",
  memberCategory: "member",
  contractType: "corporate",
  jobChangeIntent: "active",
  note: "備考テスト",
  registeredAt: new Date("2024-01-15"),
  prefecture: { name: "東京都" },
  listingCategory: { marketName: "プライム", stockExchangeName: "東京証券取引所" },
  customerCommunities: [
    {
      community: { code: "venture_auditor", name: "ベンチャー監査役の会" },
      auditMemberType: "regular",
      auditMemberPremium: true,
      originIndustry: { name: "公認会計士" },
      membershipQualification: { name: "監査役" },
      joinedAt: new Date("2023-04-01"),
      resignedAt: null,
      affiliation: null,
    },
    {
      community: { code: "naikan_meetup", name: "ないかんMeetup" },
      auditMemberType: null,
      auditMemberPremium: null,
      originIndustry: null,
      membershipQualification: null,
      joinedAt: new Date("2023-05-01"),
      resignedAt: null,
      affiliation: { name: "ないかん所属" },
    },
    {
      community: { code: "ai_club", name: "AI部会" },
      auditMemberType: null,
      auditMemberPremium: null,
      originIndustry: null,
      membershipQualification: null,
      joinedAt: new Date("2023-06-01"),
      resignedAt: null,
      affiliation: { name: "AI所属" },
    },
  ],
  ...overrides,
});

describe("exportCustomersAction - CSV生成", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSuperAdmin();
  });

  it("正常系: 全項目ヘッダーとデータ行が生成される", async () => {
    mockRepoFindAll.mockResolvedValue([makeExportCustomer()]);

    const result = await exportCustomersAction();
    expect(result).toHaveProperty("csv");
    const csv = (result as { csv: string }).csv;

    expect(csv).toContain(CUSTOMER_EXPORT_HEADERS.join(","));
    expect(csv).toContain(
      "1,田中,太郎,タナカ,タロウ,tanaka@example.com,sub1@example.com,sub2@example.com,,090-1234-5678,テスト株式会社,東京証券取引所 プライム,100-0001,東京都,千代田区,男性,会員,法人,積極的に検討中,備考テスト,ベンチャー監査役の会・ないかんMeetup・AI部会,正会員,はい,監査役,公認会計士,2023/04/01,,ないかん所属,2023/05/01,,AI所属,2023/06/01,,2024/01/15"
    );
  });

  it("BOM付き確認（先頭がFEFF）", async () => {
    mockRepoFindAll.mockResolvedValue([makeExportCustomer()]);

    const result = await exportCustomersAction();
    const csv = (result as { csv: string }).csv;

    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("日付フォーマット: registeredAt → YYYY/MM/DD", async () => {
    mockRepoFindAll.mockResolvedValue([
      makeExportCustomer({ registeredAt: new Date("2024-12-31") }),
    ]);

    const result = await exportCustomersAction();
    const csv = (result as { csv: string }).csv;

    expect(csv).toContain("2024/12/31");
  });

  it("複数コミュニティ所属: 中黒で結合", async () => {
    mockRepoFindAll.mockResolvedValue([
      makeExportCustomer({
        customerCommunities: [
          {
            community: { code: "venture_auditor", name: "ベンチャー監査役の会" },
            auditMemberType: null,
            auditMemberPremium: null,
            originIndustry: null,
            membershipQualification: null,
            joinedAt: null,
            resignedAt: null,
            affiliation: null,
          },
          {
            community: { code: "naikan_meetup", name: "ないかんMeetup" },
            auditMemberType: null,
            auditMemberPremium: null,
            originIndustry: null,
            membershipQualification: null,
            joinedAt: null,
            resignedAt: null,
            affiliation: null,
          },
        ],
      }),
    ]);

    const result = await exportCustomersAction();
    const csv = (result as { csv: string }).csv;

    expect(csv).toContain("ベンチャー監査役の会・ないかんMeetup");
  });

  it("空のオプショナルフィールド → 空文字で出力", async () => {
    mockRepoFindAll.mockResolvedValue([
      makeExportCustomer({
        firstNameKana: null,
        lastNameKana: null,
        company: null,
        subEmails: [],
        phone: null,
        postalCode: null,
        city: null,
        gender: null,
        contractType: null,
        jobChangeIntent: null,
        note: null,
        customerCommunities: [],
      }),
    ]);

    const result = await exportCustomersAction();
    const csv = (result as { csv: string }).csv;
    const dataLine = csv.split("\n")[1];

    expect(dataLine).toContain(",,");
  });

  it("特殊文字（カンマ、ダブルクォート）のエスケープ", async () => {
    mockRepoFindAll.mockResolvedValue([
      makeExportCustomer({
        company: 'テスト,株式会社"ABC"',
      }),
    ]);

    const result = await exportCustomersAction();
    const csv = (result as { csv: string }).csv;

    expect(csv).toContain('"テスト,株式会社""ABC"""');
  });

  it("CSVインジェクション対策: = で始まる値をサニタイズ", async () => {
    mockRepoFindAll.mockResolvedValue([
      makeExportCustomer({
        company: "=SUM(A1:A10)",
      }),
    ]);

    const result = await exportCustomersAction();
    const csv = (result as { csv: string }).csv;

    expect(csv).toContain("'=SUM(A1:A10)");
    expect(csv).not.toMatch(/[^']={1}SUM/);
  });

  it("CSVインジェクション対策: +, -, @ で始まる値もサニタイズ", async () => {
    mockRepoFindAll.mockResolvedValue([
      makeExportCustomer({ id: 1, company: "+cmd" }),
      makeExportCustomer({ id: 2, company: "-cmd", email: "test2@example.com" }),
      makeExportCustomer({ id: 3, company: "@cmd", email: "test3@example.com" }),
    ]);

    const result = await exportCustomersAction();
    const csv = (result as { csv: string }).csv;

    expect(csv).toContain("'+cmd");
    expect(csv).toContain("'-cmd");
    expect(csv).toContain("'@cmd");
  });
});
