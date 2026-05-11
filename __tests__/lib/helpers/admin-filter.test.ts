import { describe, it, expect } from "vitest";
import { filterAdmins } from "@/lib/helpers/admin-filter";
import type { SerializedAdmin } from "@/lib/types/serialized";

const mockAdmins: SerializedAdmin[] = [
  {
    id: 1,
    lastName: "管理",
    firstName: "太郎",
    email: "admin@example.com",
    role: "super",
    lastLoginAt: "2026-01-15T10:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    adminCommunities: [],
  },
  {
    id: 2,
    lastName: "監査",
    firstName: "花子",
    email: "venture@example.com",
    role: "community_admin",
    lastLoginAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    adminCommunities: [
      {
        communityId: 1,
        community: { id: 1, code: "venture_auditor", name: "ベンチャー監査役の会" },
      },
    ],
  },
  {
    id: 3,
    lastName: "内監",
    firstName: "次郎",
    email: "naikan@example.com",
    role: "community_admin",
    lastLoginAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    adminCommunities: [
      {
        communityId: 2,
        community: { id: 2, code: "naikan_meetup", name: "ないかんMeetup" },
      },
    ],
  },
];

describe("filterAdmins", () => {
  it("正常系: キーワード空文字の場合、全件返却される", () => {
    const result = filterAdmins(mockAdmins, "");
    expect(result).toHaveLength(3);
  });

  it("正常系: 氏名でフィルタできる（姓の部分一致）", () => {
    const result = filterAdmins(mockAdmins, "管理");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("正常系: 氏名でフィルタできる（名の部分一致）", () => {
    const result = filterAdmins(mockAdmins, "花子");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it("正常系: メールアドレスでフィルタできる", () => {
    const result = filterAdmins(mockAdmins, "naikan");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });

  it("正常系: 大文字小文字を区別しない", () => {
    const result = filterAdmins(mockAdmins, "ADMIN@EXAMPLE");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("正常系: 該当なしの場合、空配列が返る", () => {
    const result = filterAdmins(mockAdmins, "存在しない");
    expect(result).toHaveLength(0);
  });

  it("正常系: 姓名を結合した文字列でフィルタできる", () => {
    const result = filterAdmins(mockAdmins, "管理太郎");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});
