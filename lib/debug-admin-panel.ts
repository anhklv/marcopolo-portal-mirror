/** DEBUG_ADMIN_PANEL 環境変数が有効か（NODE_ENV では判定しない） */
export function isDebugAdminPanelEnabled(): boolean {
  return process.env.DEBUG_ADMIN_PANEL === "true";
}
