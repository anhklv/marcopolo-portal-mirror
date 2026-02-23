/**
 * Server Actionの基本エラー結果型
 * redirect するアクション向け（成功時は void を返す）
 */
export type ActionResult = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};
