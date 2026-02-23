import { randomUUID } from "crypto";

/**
 * RSVP回答用トークン生成
 */
export function generateRsvpToken(): string {
  return randomUUID();
}

/**
 * RSVP回答URL生成
 */
export function buildRsvpUrl(baseUrl: string, eventId: number, token: string): string {
  return `${baseUrl}/events/${eventId}/rsvp?token=${token}`;
}

/**
 * メール本文のプレースホルダ置換
 * - {RSVP_URL} → RSVP回答URL
 * - {CUSTOMER_NAME} → 顧客名（任意）
 */
export function replacePlaceholders(
  body: string,
  params: { rsvpUrl: string; customerName?: string }
): string {
  let result = body.replace(/{RSVP_URL}/g, params.rsvpUrl);
  if (params.customerName !== undefined) {
    result = result.replace(/{CUSTOMER_NAME}/g, params.customerName);
  }
  return result;
}
