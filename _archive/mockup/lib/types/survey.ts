// アンケート設問
export type SurveyQuestion = {
  id: string;
  title: string;
  order: number;
};

// アンケート
export type Survey = {
  id: string;
  eventId: string;
  questions: SurveyQuestion[];
  createdAt: string;
};

// アンケート回答
export type SurveyResponse = {
  surveyId: string;
  questionId: string;
  customerId: string;
  token: string; // URL用の一意な文字列
  rating: "よかった" | "まぁよかった" | "あまりよくなかった" | "よくなかった";
  reason: string; // 理由
  respondedAt: string; // 回答日時
};

// 固定設問の回答
export type FixedSurveyResponse = {
  surveyId: string;
  customerId: string;
  token: string;
  afterParty?: {
    rating: "よかった" | "まぁよかった" | "あまりよくなかった" | "よくなかった";
    reason: string;
  };
  futureParticipation?: {
    rating: "ぜひ参加したい" | "参加を検討したい" | "参加しない";
    reason: string;
  };
  membership?: {
    rating: "入会をしたい" | "入会を検討したい" | "関心がない";
    reason: string;
  };
  comments?: string; // ご意見・ご提案・感想等
  respondedAt: string;
};

// アンケート送信トークン（各顧客ごとに一意なトークンを生成）
export type SurveyToken = {
  surveyId: string;
  customerId: string;
  token: string; // URL用の一意な文字列
  sentAt: string; // 送信日時
};

