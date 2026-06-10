"use server";

import { prisma } from "@/lib/prisma";
import { loginAction } from "@/lib/actions/auth";

const DEBUG_PASSWORD = "rara6y";

function isDebugAdminPanelEnabled() {
  return (
    process.env.DEBUG_ADMIN_PANEL === "true" &&
    process.env.NODE_ENV !== "production"
  );
}

interface DebugAdmin {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  communities: { code: string; name: string }[];
}

export async function getDebugAdminList(): Promise<DebugAdmin[]> {
  if (!isDebugAdminPanelEnabled()) {
    return [];
  }

  const admins = await prisma.admin.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      adminCommunities: {
        select: {
          community: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return admins.map((admin) => ({
    id: admin.id,
    email: admin.email,
    firstName: admin.firstName,
    lastName: admin.lastName,
    role: admin.role,
    communities: admin.adminCommunities.map((ac) => ({
      code: ac.community.code,
      name: ac.community.name,
    })),
  }));
}

export async function switchDebugAdmin(
  email: string,
  password?: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isDebugAdminPanelEnabled()) {
    return { success: false, error: "DEBUGモードが無効です" };
  }

  return loginAction(email, password ?? DEBUG_PASSWORD);
}
