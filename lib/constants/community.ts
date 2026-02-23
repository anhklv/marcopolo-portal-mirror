// コミュニティコード定数
// DBのcommunity.codeに対応する定数。ハードコードを防ぐため一元管理する

import type { BadgeVariant } from "@/components/ui/badge";

export const COMMUNITY_CODE = {
  VENTURE_AUDITOR: "venture_auditor",
  NAIKAN_MEETUP: "naikan_meetup",
  AI_CLUB: "ai_club",
  OTHER: "other",
} as const;

type CommunityCode = (typeof COMMUNITY_CODE)[keyof typeof COMMUNITY_CODE];

// 主要3コミュニティのコード（OTHER を除く）
type MainCommunityCode = Exclude<CommunityCode, typeof COMMUNITY_CODE.OTHER>;

// コミュニティ名（表示用）— OTHER は DB 側に名前があるため含めない
// satisfies で MainCommunityCode の網羅漏れをコンパイル時に検出
export const COMMUNITY_NAME = {
  [COMMUNITY_CODE.VENTURE_AUDITOR]: "ベンチャー監査役の会",
  [COMMUNITY_CODE.NAIKAN_MEETUP]: "ないかんMeetup",
  [COMMUNITY_CODE.AI_CLUB]: "AI部会",
} as const satisfies Record<MainCommunityCode, string>;

// コミュニティコード → バッジvariant
const COMMUNITY_BADGE_VARIANT = {
  [COMMUNITY_CODE.VENTURE_AUDITOR]: "audit",
  [COMMUNITY_CODE.NAIKAN_MEETUP]: "naikan",
  [COMMUNITY_CODE.AI_CLUB]: "ai",
} as const satisfies Record<MainCommunityCode, BadgeVariant>;

/** コミュニティコードからバッジvariantを取得。未定義コードにはfallbackを返す */
export function getCommunityBadgeVariant(code: string, fallback: BadgeVariant = "default"): BadgeVariant {
  return (COMMUNITY_BADGE_VARIANT as Record<string, BadgeVariant | undefined>)[code] ?? fallback;
}
