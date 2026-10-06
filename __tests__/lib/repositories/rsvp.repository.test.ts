import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPrisma } from "@/__tests__/helpers/mock-prisma";
import { updatePublicRsvpResponseIfCurrent } from "@/lib/repositories/rsvp.repository";

const response = {
  status: "attending" as const,
  afterPartyStatus: null,
  comment: "参加します",
  participationOptionId: null,
  respondedAt: new Date("2026-09-01T03:34:00.000Z"),
};

const expected = {
  status: "pending" as const,
  afterPartyStatus: null,
  comment: null,
  participationOptionId: null,
};

describe("updatePublicRsvpResponseIfCurrent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("読み取り時点の回答と一致する場合だけ更新する", async () => {
    mockPrisma.rsvp.updateMany.mockResolvedValue({ count: 1 });

    const result = await updatePublicRsvpResponseIfCurrent(1, expected, response);

    expect(result).toBe(true);
    expect(mockPrisma.rsvp.updateMany).toHaveBeenCalledWith({
      where: { id: 1, ...expected },
      data: response,
    });
  });

  it("同時更新で旧状態が変わっていた場合はfalseを返す", async () => {
    mockPrisma.rsvp.updateMany.mockResolvedValue({ count: 0 });

    const result = await updatePublicRsvpResponseIfCurrent(1, expected, response);

    expect(result).toBe(false);
  });
});
