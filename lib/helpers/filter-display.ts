import type { CommunityOption } from "@/lib/types/serialized";

/**
 * コミュニティフィルタの選択状態を表示テキストに変換する
 */
export function getFilterDisplayText(
  communities: CommunityOption[],
  selectedCommunityIds: number[],
  includeNonMember: boolean
): string {
  if (selectedCommunityIds.length === 0 && !includeNonMember) return "コミュニティ";

  const names = communities
    .filter((c) => selectedCommunityIds.includes(c.id))
    .map((c) => c.name);

  if (includeNonMember) {
    names.push("非会員");
  }

  if (names.length === 1) return names[0];
  return `${names.length}件選択`;
}
