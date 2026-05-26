import type { AdminWithCommunities } from "@/lib/repositories/admin.repository";
import type { SerializedAdmin } from "@/lib/types/serialized";

export function serializeAdminForList(
  admin: AdminWithCommunities
): SerializedAdmin {
  return {
    id: admin.id,
    lastName: admin.lastName,
    firstName: admin.firstName,
    email: admin.email,
    role: admin.role,
    lastLoginAt: admin.lastLoginAt?.toISOString() ?? null,
    createdAt: admin.createdAt.toISOString(),
    updatedAt: admin.updatedAt.toISOString(),
    adminCommunities: admin.adminCommunities.map((ac) => ({
      communityId: ac.communityId,
      community: {
        id: ac.community.id,
        code: ac.community.code,
        name: ac.community.name,
      },
    })),
  };
}
