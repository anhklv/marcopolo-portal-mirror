export type AdminRole = "super" | "community_admin";
export type CommunityScope = "ベンチャー監査役の会" | "ないかんMeetup" | "AI部会";

export type Admin = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string; // モックではプレーンテキスト
  role: AdminRole;
  communityScopes?: CommunityScope[]; // community_adminの場合に設定
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};
