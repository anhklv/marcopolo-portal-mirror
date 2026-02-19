import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "@/__tests__/helpers/mock-prisma";

// next/cache, next/navigation のモック
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// auth関連のモック
const mockRequireAuth = vi.fn();
const mockGetScopedCommunityIds = vi.fn();

vi.mock("@/lib/auth/permissions", () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  canAccessCustomer: vi.fn(),
  getScopedCommunityIds: (...args: unknown[]) => mockGetScopedCommunityIds(...args),
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
  mockRequireAuth.mockResolvedValue({
    user: { id: "1", role: "super", firstName: "管理", lastName: "太郎", email: "admin@example.com" },
  });
  mockPrisma.admin.findUnique.mockResolvedValue({
    id: 1,
    role: "super",
    adminCommunities: [],
  });
  mockGetScopedCommunityIds.mockResolvedValue([1, 2, 3]);
}

const makeExportCustomer = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  firstName: "太郎",
  lastName: "田中",
  firstNameKana: "タロウ",
  lastNameKana: "タナカ",
  email: "tanaka@example.com",
  company: "テスト株式会社",
  memberCategory: "member",
  registeredAt: new Date("2024-01-15"),
  prefecture: { name: "東京都" },
  listingCategory: { marketName: "プライム" },
  customerCommunities: [
    {
      community: { code: "venture_auditor", name: "ベンチャー監査役の会" },
      originIndustry: { name: "公認会計士" },
      membershipQualification: { name: "監査役" },
    },
  ],
  ...overrides,
});

describe("exportCustomersAction - CSV生成", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSuperAdmin();
  });

  it("正常系: CSV文字列が生成される（ヘッダー + データ行）", async () => {
    mockRepoFindAll.mockResolvedValue([makeExportCustomer()]);

    const result = await exportCustomersAction();
    expect(result).toHaveProperty("csv");
    const csv = (result as { csv: string }).csv;

    // ヘッダー行確認
    expect(csv).toContain("ID,姓,名,セイ,メイ,メールアドレス,会社名,所属コミュニティ,会員区分,都道府県,上場区分,出身業種,入会資格,登録日");
    // データ行確認
    expect(csv).toContain("1,田中,太郎,タナカ,タロウ,tanaka@example.com,テスト株式会社,ベンチャー監査役の会,会員,東京都,プライム,公認会計士,監査役,2024/01/15");
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
            originIndustry: null,
            membershipQualification: null,
          },
          {
            community: { code: "naikan_meetup", name: "ないかんMeetup" },
            originIndustry: null,
            membershipQualification: null,
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
      }),
    ]);

    const result = await exportCustomersAction();
    const csv = (result as { csv: string }).csv;
    const dataLine = csv.split("\n")[1];

    // null フィールドは空文字
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

    // カンマを含む値はクォートで囲まれる
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
