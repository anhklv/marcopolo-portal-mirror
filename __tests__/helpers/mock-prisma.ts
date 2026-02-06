import { vi } from "vitest";

// Prisma クライアントのモック
export const mockPrisma = {
  community: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  customerCommunity: {
    findFirst: vi.fn(),
  },
  event: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  admin: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  adminCommunity: {
    findMany: vi.fn(),
  },
};

// lib/prisma のモック
vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));
