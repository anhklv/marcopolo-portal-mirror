// Server Component → Client Component 間で受け渡すシリアライズ済みデータの型定義
// Date → string 変換後の型を一元管理し、ページとコンポーネントで共有する

// ============================================================
// 共通
// ============================================================

export interface MasterData {
  id: number;
  name: string;
}

export interface CommunityOption {
  id: number;
  code: string;
  name: string;
}

// ============================================================
// 顧客一覧用（customer-list.tsx）
// ============================================================

export interface SerializedCommunity {
  id: number;
  code: string;
  name: string;
  hasSurvey: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedCustomerCommunity {
  id: number;
  customerId: number;
  communityId: number;
  joinedAt: string | null;
  resignedAt: string | null;
  auditMemberType: string | null;
  auditMemberPremium: boolean | null;
  affiliation: string | null;
  createdAt: string;
  updatedAt: string;
  community: SerializedCommunity;
}

export interface SerializedCustomer {
  id: number;
  firstName: string;
  lastName: string;
  firstNameKana: string | null;
  lastNameKana: string | null;
  email: string;
  subEmails: string[];
  company: string | null;
  phone: string | null;
  postalCode: string | null;
  prefecture: string | null;
  city: string | null;
  gender: string | null;
  listingCategory: string | null;
  originIndustry: string | null;
  membershipQualification: string | null;
  memberCategory: string | null;
  contractType: string | null;
  note: string | null;
  registeredAt: string;
  deletedAt: string | null;
  customerCommunities: SerializedCustomerCommunity[];
}

// ============================================================
// 顧客詳細用（customer-detail.tsx）
// ============================================================

export interface SerializedCustomerDetail {
  id: number;
  firstName: string;
  lastName: string;
  firstNameKana: string | null;
  lastNameKana: string | null;
  email: string;
  subEmails: string[];
  company: string | null;
  phone: string | null;
  postalCode: string | null;
  prefecture: MasterData | null;
  city: string | null;
  gender: string | null;
  listingCategory: MasterData | null;
  memberCategory: string | null;
  contractType: string | null;
  jobChangeIntent: string | null;
  note: string | null;
  registeredAt: string;
  deletedAt: string | null;
  customerCommunities: {
    id: number;
    communityId: number;
    joinedAt: string | null;
    resignedAt: string | null;
    auditMemberType: string | null;
    auditMemberPremium: boolean | null;
    affiliation: MasterData | null;
    originIndustry: MasterData | null;
    membershipQualification: MasterData | null;
    community: CommunityOption;
  }[];
  rsvps: {
    id: number;
    status: string;
    respondedAt: string | null;
    event: {
      id: number;
      title: string;
      date: string;
      communityId: number;
    };
  }[];
}

// ============================================================
// イベント一覧用（event-list.tsx）
// ============================================================

export interface SerializedEvent {
  id: number;
  title: string;
  date: string;
  location: string | null;
  description: string | null;
  note: string | null;
  isPaused: boolean;
  responseDeadline: string | null;
  community: CommunityOption;
  rsvps: { id: number; status: string }[];
}
