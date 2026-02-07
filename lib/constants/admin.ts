import type { AdminRole } from "@/lib/generated/prisma";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super: "特権管理者",
  community_admin: "コミュニティ管理者",
};

// コミュニティスコープのラベル（community code → 表示名）
export const COMMUNITY_SCOPE_LABELS: Record<string, string> = {
  venture_auditor: "ベンチャー監査役の会",
  naikan_meetup: "ないかんMeetup",
  ai_club: "AI部会",
  other: "その他",
};
