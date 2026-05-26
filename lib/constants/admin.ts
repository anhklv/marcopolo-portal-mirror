import type { AdminRole } from "@/lib/generated/prisma";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super: "特権管理者",
  community_admin: "コミュニティ管理者",
};
