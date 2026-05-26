import type { SerializedAdmin } from "@/lib/types/serialized";

export function filterAdmins(
  admins: SerializedAdmin[],
  keyword: string
): SerializedAdmin[] {
  if (!keyword) return admins;

  const lowerKeyword = keyword.toLowerCase();
  return admins.filter((admin) => {
    const fullName = `${admin.lastName}${admin.firstName}`;
    return (
      fullName.toLowerCase().includes(lowerKeyword) ||
      admin.email.toLowerCase().includes(lowerKeyword)
    );
  });
}
