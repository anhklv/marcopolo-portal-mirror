// Prisma生成型の再エクスポート
export type {
  Admin,
  AdminCommunity,
  AdminRole,
  Community,
  Customer,
  CustomerCommunity,
  Event,
  Rsvp,
  Survey,
  SurveyQuestion,
  SurveyResponse,
  FixedSurveyResponse,
  SurveyToken,
  Gender,
  MemberCategory,
  ContractType,
  AuditMemberType,
  RsvpStatus,
  AfterPartyStatus,
  SurveyRating,
  FutureParticipation,
  MembershipInterest,
} from "@/lib/generated/prisma";

// イベントの表示用ステータス（算出値）
export type { EventDisplayStatus } from "@/lib/constants/event";

// セッション内の管理者情報
export interface SessionAdmin {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "super" | "community_admin";
}
