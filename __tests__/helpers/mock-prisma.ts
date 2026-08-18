import { vi } from "vitest";

// Prisma クライアントのモック
export const mockPrisma = {
  community: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  customer: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  customerCommunity: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    createMany: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
  },
  department: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  customerDepartment: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  event: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  rsvp: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
  },
  admin: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  adminCommunity: {
    findMany: vi.fn(),
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  survey: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  surveyQuestion: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  surveyToken: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
  },
  surveyResponse: {
    createMany: vi.fn(),
  },
  fixedSurveyResponse: {
    create: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
  $executeRaw: vi.fn(),
};

// lib/prisma のモック
vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));
