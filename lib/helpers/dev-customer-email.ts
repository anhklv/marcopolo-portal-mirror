/** 開発・テスト用の calme.dev プラスアドレス生成 */

export function devCustomerEmail(id: number): string {
  return `takashi.aoki+${id}@calme.dev`;
}

export function devCustomerSubEmails(id: number, count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    `takashi.aoki+${id}_${i + 1}@calme.dev`
  );
}
