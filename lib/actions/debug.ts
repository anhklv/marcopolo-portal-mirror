"use server";

import { prisma } from "@/lib/prisma";
import { loginAction } from "@/lib/actions/auth";

const DEBUG_PASSWORD = "rara6y";

interface DebugAdmin {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  communities: { code: string; name: string }[];
}

export async function getDebugAdminList(): Promise<DebugAdmin[]> {
  if (process.env.DEBUG_ADMIN_PANEL !== "true") {
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
  email: string
): Promise<{ success: boolean; error: string | null }> {
  if (process.env.DEBUG_ADMIN_PANEL !== "true") {
    return { success: false, error: "DEBUGモードが無効です" };
  }

  return loginAction(email, DEBUG_PASSWORD);
}
