import { randomUUID } from "crypto";

export function generateSurveyToken(): string {
  return randomUUID();
}

export function buildSurveyUrl(
  baseUrl: string,
  eventId: number,
  token: string
): string {
  return `${baseUrl}/events/${eventId}/survey/${token}`;
}

export function replaceSurveyPlaceholders(
  body: string,
  params: { surveyUrl: string; customerName?: string }
): string {
  let result = body.replace(/{SURVEY_URL}/g, params.surveyUrl);
  if (params.customerName !== undefined) {
    result = result.replace(/{CUSTOMER_NAME}/g, params.customerName);
  }
  return result;
}
