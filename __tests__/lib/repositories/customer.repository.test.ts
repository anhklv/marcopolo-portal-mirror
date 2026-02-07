import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/__tests__/helpers/mock-prisma";
import {
  findAll,
  findById,
  create,
  update,
  softDelete,
  existsByEmail,
} from "@/lib/repositories/customer.repository";

// テスト用データ
const makeCustomer = (overrides = {}) => ({
  id: 1,
  firstName: "太郎",
  lastName: "田中",
  firstNameKana: "タロウ",
  lastNameKana: "タナカ",
  email: "tanaka@example.com",
  subEmails: [],
  company: "テスト株式会社",
  phone: null,
  postalCode: null,
  prefecture: null,
  city: null,
  gender: null,
  listingCategory: null,
  originIndustry: null,
  membershipQualification: null,
  memberCategory: "member",
  contractType: null,
  note: null,
  registeredAt: new Date("2024-01-01"),
  deletedAt: null,
  ...overrides,
});

const makeCommunity = (id: number, code: string, name: string) => ({
  id,
  code,
  name,
  hasSurvey: false,
  sortOrder: id,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const makeCustomerCommunity = (customerId: number, communityId: number, overrides = {}) => ({
  id: customerId * 10 + communityId,
  customerId,
  communityId,
  joinedAt: new Date("2024-04-01"),
  resignedAt: null,
  auditMemberType: null,
  auditMemberPremium: null,
  affiliation: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  community: makeCommunity(communityId, `community_${communityId}`, `コミュニティ${communityId}`),
  ...overrides,
});

describe("customer.repository", () => {
  beforeEach(() => {
    Object.values(mockPrisma).forEach((model) => {
      if (typeof model === "object" && model !== null) {
        Object.values(model).forEach((fn) => {
          if (typeof fn === "function" && "mockReset" in fn) {
            (fn as ReturnType<typeof import("vitest").vi.fn>).mockReset();
          }
        });
      }
    });
  });

  // ============================================================
  // findAll
  // ============================================================
  describe("findAll", () => {
    it("super管理者: 全コミュニティの顧客を取得（deletedAt=null のみ）", async () => {
      const customers = [
        {
          ...makeCustomer(),
          customerCommunities: [makeCustomerCommunity(1, 1)],
        },
      ];
      mockPrisma.customer.findMany.mockResolvedValue(customers);

      const result = await findAll([], true);

      expect(result).toHaveLength(1);
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        })
      );
    });

    it("community_admin: scopedCommunityIds 内の顧客のみ取得", async () => {
      const customers = [
        {
          ...makeCustomer(),
          customerCommunities: [makeCustomerCommunity(1, 1)],
        },
      ];
      mockPrisma.customer.findMany.mockResolvedValue(customers);

      const result = await findAll([1], false);

      expect(result).toHaveLength(1);
      const calledArgs = mockPrisma.customer.findMany.mock.calls[0][0];
      expect(calledArgs.where.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            customerCommunities: {
              some: { communityId: { in: [1] } },
            },
          }),
        ])
      );
    });

    it("キーワード検索: firstName/lastName/company/email に部分一致", async () => {
      mockPrisma.customer.findMany.mockResolvedValue([]);

      await findAll([], true, { keyword: "田中" });

      const calledArgs = mockPrisma.customer.findMany.mock.calls[0][0];
      expect(calledArgs.where.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            OR: expect.arrayContaining([
              { firstName: { contains: "田中", mode: "insensitive" } },
              { lastName: { contains: "田中", mode: "insensitive" } },
              { company: { contains: "田中", mode: "insensitive" } },
              { email: { contains: "田中", mode: "insensitive" } },
            ]),
          }),
        ])
      );
    });

    it("includeNonMember=false（super）: コミュニティ未所属（履歴なし）を除外", async () => {
      mockPrisma.customer.findMany.mockResolvedValue([]);

      await findAll([], true, { includeNonMember: false });

      const calledArgs = mockPrisma.customer.findMany.mock.calls[0][0];
      // includeNonMember=false -> some: {} (履歴あり)
      expect(calledArgs.where.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            customerCommunities: { some: {} },
          }),
        ])
      );
    });

    it("includeNonMember=true（super）: コミュニティ未所属（履歴なし）を含める", async () => {
      mockPrisma.customer.findMany.mockResolvedValue([]);

      // includeNonMember=true -> customerCommunities の制約なし（全件）
      await findAll([], true, { includeNonMember: true });

      const calledArgs = mockPrisma.customer.findMany.mock.calls[0][0];
      // AND条件が存在しないか、customerCommunities関連が含まれていないことを確認
      if (calledArgs.where.AND) {
        const hasCommunityCondition = calledArgs.where.AND.some((cond: any) => 
          cond.customerCommunities && cond.customerCommunities.some && Object.keys(cond.customerCommunities.some).length === 0
        );
        expect(hasCommunityCondition).toBe(false);
      }
    });

    it("includeFormerMembers=true: resignedAt ありの顧客も含む", async () => {
      const customers = [
        {
          ...makeCustomer({ id: 1 }),
          customerCommunities: [
            makeCustomerCommunity(1, 1, { resignedAt: new Date("2025-01-01") }),
          ],
        },
      ];
      mockPrisma.customer.findMany.mockResolvedValue(customers);

      const result = await findAll([], true, { includeFormerMembers: true });

      expect(result).toHaveLength(1);
    });

    it("includeFormerMembers=false: 全コミュニティ脱退済みの顧客を除外", async () => {
      const customers = [
        {
          ...makeCustomer({ id: 1 }),
          customerCommunities: [
            makeCustomerCommunity(1, 1, { resignedAt: new Date("2025-01-01") }),
          ],
        },
        {
          ...makeCustomer({ id: 2 }),
          customerCommunities: [
            makeCustomerCommunity(2, 1, { resignedAt: null }),
          ],
        },
      ];
      mockPrisma.customer.findMany.mockResolvedValue(customers);

      const result = await findAll([], true, { includeFormerMembers: false });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it("memberCategories フィルタ: member/sponsor/observer で絞り込み", async () => {
      mockPrisma.customer.findMany.mockResolvedValue([]);

      await findAll([], true, { memberCategories: ["member", "sponsor"] });

      const calledArgs = mockPrisma.customer.findMany.mock.calls[0][0];
      expect(calledArgs.where.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            memberCategory: { in: ["member", "sponsor"] },
          }),
        ])
      );
    });

    it("auditMemberTypes フィルタ: regular/online で絞り込み", async () => {
      mockPrisma.customer.findMany.mockResolvedValue([]);

      await findAll([], true, { auditMemberTypes: ["regular"] });

      const calledArgs = mockPrisma.customer.findMany.mock.calls[0][0];
      expect(calledArgs.where.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            customerCommunities: {
              some: { auditMemberType: { in: ["regular"] } },
            },
          }),
        ])
      );
    });

    it("premiumOnly: auditMemberPremium=true の顧客のみ", async () => {
      mockPrisma.customer.findMany.mockResolvedValue([]);

      await findAll([], true, { premiumOnly: true });

      const calledArgs = mockPrisma.customer.findMany.mock.calls[0][0];
      expect(calledArgs.where.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            customerCommunities: {
              some: { auditMemberPremium: true },
            },
          }),
        ])
      );
    });

    it("空結果: 条件に一致する顧客なし → 空配列", async () => {
      mockPrisma.customer.findMany.mockResolvedValue([]);

      const result = await findAll([], true, { keyword: "存在しない" });

      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // findById
  // ============================================================
  describe("findById", () => {
    it("正常系: 存在する顧客 → Customer + customerCommunities + rsvps を返す", async () => {
      const customer = {
        ...makeCustomer(),
        customerCommunities: [makeCustomerCommunity(1, 1)],
        rsvps: [],
      };
      mockPrisma.customer.findFirst.mockResolvedValue(customer);

      const result = await findById(1);

      expect(result).toEqual(customer);
      expect(mockPrisma.customer.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1, deletedAt: null },
        })
      );
    });

    it("異常系: 存在しないID → null", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      const result = await findById(999);

      expect(result).toBeNull();
    });

    it("正常系: deletedAt ありの顧客 → null", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      const result = await findById(1);

      expect(result).toBeNull();
      expect(mockPrisma.customer.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1, deletedAt: null },
        })
      );
    });
  });

  // ============================================================
  // create
  // ============================================================
  describe("create", () => {
    it("正常系: Customer + CustomerCommunity を $transaction で同時作成", async () => {
      const createdCustomer = makeCustomer();
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        return fn(mockPrisma);
      });
      mockPrisma.customer.create.mockResolvedValue(createdCustomer);
      mockPrisma.customerCommunity.createMany.mockResolvedValue({ count: 1 });

      const result = await create({
        firstName: "太郎",
        lastName: "田中",
        email: "tanaka@example.com",
        communities: [
          {
            communityId: 1,
            joinedAt: new Date("2024-04-01"),
          },
        ],
      });

      expect(result).toEqual(createdCustomer);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.customer.create).toHaveBeenCalled();
      expect(mockPrisma.customerCommunity.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              customerId: 1,
              communityId: 1,
            }),
          ]),
        })
      );
    });

    it("正常系: コミュニティなし（非会員）→ Customer のみ作成", async () => {
      const createdCustomer = makeCustomer();
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        return fn(mockPrisma);
      });
      mockPrisma.customer.create.mockResolvedValue(createdCustomer);

      await create({
        firstName: "三郎",
        lastName: "渡辺",
        email: "watanabe@example.com",
        communities: [],
      });

      expect(mockPrisma.customer.create).toHaveBeenCalled();
      expect(mockPrisma.customerCommunity.createMany).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // update
  // ============================================================
  describe("update", () => {
    it("正常系: Customer 更新 + CustomerCommunity の差分更新", async () => {
      const updatedCustomer = makeCustomer({ firstName: "更新後" });
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        return fn(mockPrisma);
      });
      mockPrisma.customer.update.mockResolvedValue(updatedCustomer);
      mockPrisma.customerCommunity.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.customerCommunity.createMany.mockResolvedValue({ count: 2 });

      const result = await update(1, {
        firstName: "更新後",
        lastName: "田中",
        email: "tanaka@example.com",
        communities: [
          { communityId: 1 },
          { communityId: 2 },
        ],
      });

      expect(result).toEqual(updatedCustomer);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.customerCommunity.deleteMany).toHaveBeenCalledWith({
        where: { customerId: 1 },
      });
      expect(mockPrisma.customerCommunity.createMany).toHaveBeenCalled();
    });

    it("正常系: コミュニティを全削除 → 非会員化", async () => {
      const updatedCustomer = makeCustomer();
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        return fn(mockPrisma);
      });
      mockPrisma.customer.update.mockResolvedValue(updatedCustomer);
      mockPrisma.customerCommunity.deleteMany.mockResolvedValue({ count: 1 });

      await update(1, {
        firstName: "太郎",
        lastName: "田中",
        email: "tanaka@example.com",
        communities: [],
      });

      expect(mockPrisma.customerCommunity.deleteMany).toHaveBeenCalledWith({
        where: { customerId: 1 },
      });
      expect(mockPrisma.customerCommunity.createMany).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // softDelete
  // ============================================================
  describe("softDelete", () => {
    it("正常系: deletedAt が現在日時に設定される", async () => {
      const now = new Date();
      mockPrisma.customer.update.mockResolvedValue(
        makeCustomer({ deletedAt: now })
      );

      const result = await softDelete(1);

      expect(result.deletedAt).toBeTruthy();
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  // ============================================================
  // existsByEmail
  // ============================================================
  describe("existsByEmail", () => {
    it("正常系: 存在するメール → true", async () => {
      mockPrisma.customer.count.mockResolvedValue(1);

      const result = await existsByEmail("tanaka@example.com");

      expect(result).toBe(true);
    });

    it("正常系: 存在しないメール → false", async () => {
      mockPrisma.customer.count.mockResolvedValue(0);

      const result = await existsByEmail("nonexistent@example.com");

      expect(result).toBe(false);
    });

    it("正常系: idToExclude 指定 → 自分自身を除外して検索", async () => {
      mockPrisma.customer.count.mockResolvedValue(0);

      await existsByEmail("tanaka@example.com", 1);

      expect(mockPrisma.customer.count).toHaveBeenCalledWith({
        where: {
          email: "tanaka@example.com",
          deletedAt: null,
          id: { not: 1 },
        },
      });
    });
  });
});
