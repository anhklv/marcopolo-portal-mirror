import type { AdminRole, CommunityScope } from "@/lib/types";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super: "特権管理者",
  community_admin: "コミュニティ管理者",
};

export const COMMUNITY_SCOPE_LABELS: Record<CommunityScope, string> = {
  "ベンチャー監査役の会": "ベンチャー監査役の会",
  "ないかんMeetup": "ないかんMeetup",
};
