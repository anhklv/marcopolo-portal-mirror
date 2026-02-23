import { Badge } from "@/components/ui/badge";
import { getCustomerBadges } from "@/lib/helpers/customer-detail";
import type { CustomerCommunityForBadge } from "@/lib/helpers/customer-detail";

interface CustomerBadgesProps {
  customerCommunities: CustomerCommunityForBadge[];
  memberCategory: string | null;
}

export function CustomerBadges({ customerCommunities, memberCategory }: CustomerBadgesProps) {
  const badges = getCustomerBadges(customerCommunities, memberCategory);
  return badges.map((badge, i) => (
    <Badge key={i} variant={badge.variant}>
      {badge.label}
    </Badge>
  ));
}
