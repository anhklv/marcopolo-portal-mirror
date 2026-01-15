export type Community = "ベンチャー監査役の会" | "ないかんMeetup";
export type CommunityFilterValue = Community | "非会員"; // フィルター用（非会員を含む）
export type MemberCategory = "member" | "sponsor" | "observer"; // 会員区分（会員の場合のみ）
export type ContractType = "corporate" | "individual"; // 契約主体（法人・個人）

export type Customer = {
  id: string;
  name: string; // 氏名(姓名)
  nameKana?: string; // 氏名(セイメイ) - 任意
  company?: string; // 会社名・所属 - 任意
  email: string;
  subEmails?: string[]; // サブメールアドレス（最大3つ）
  phone?: string; // 電話番号 - 任意
  postalCode?: string; // 郵便番号
  prefecture?: string; // 都道府県
  city?: string; // 市区町村以下
  gender?: "male" | "female"; // 性別
  listingCategory?: string; // 上場区分
  originIndustry?: string; // 出身業種
  membershipQualification?: string; // 入会資格
  communities: Community[]; // 所属コミュニティ（配列で複数所属可能、空配列=非会員）
  memberCategory?: MemberCategory; // 会員区分（会員の場合のみ、非会員の場合はundefined）
  contractType?: ContractType; // 契約主体（法人・個人）- 会員の場合のみ
  auditMemberType?: "regular" | "online"; // ベンチャー監査役の会の会員種別
  auditMemberPremium?: boolean; // プレミアム会員フラグ
  auditJoinedAt?: string; // ベンチャー監査役の会 入会日
  auditResignedAt?: string; // ベンチャー監査役の会 脱退日
  naikanJoinedAt?: string; // ないかんMeetup 入会日
  naikanResignedAt?: string; // ないかんMeetup 脱退日
  note?: string; // 備考 - 任意
  status: "active" | "inactive";
  registeredAt: string;
};

