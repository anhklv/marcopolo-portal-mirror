import { sendMail } from "./send";
import {
  buildSurveyUrl,
  replaceSurveyPlaceholders,
} from "@/lib/helpers/survey";
import type { BatchMailResult } from "./send";

export interface SurveyMailCustomer {
  id: number;
  lastName: string;
  firstName: string;
  email: string;
  subEmails: string[] | null;
}

interface SurveyBatchMailParams {
  customers: SurveyMailCustomer[];
  tokenMap: Map<number, string>;
  eventId: number;
  baseUrl: string;
  from: string;
  emailTitle: string;
  emailBody: string;
}

const BATCH_SIZE = 10;

function buildRecipientEmails(customer: SurveyMailCustomer): string[] {
  return [customer.email, ...(customer.subEmails ?? [])].filter(Boolean);
}

async function sendSurveyMailToCustomer(
  customer: SurveyMailCustomer,
  params: Pick<SurveyBatchMailParams, "tokenMap" | "eventId" | "baseUrl" | "from" | "emailTitle" | "emailBody">
): Promise<{ success: boolean; error?: string }> {
  const token = params.tokenMap.get(customer.id) ?? "";
  const surveyUrl = buildSurveyUrl(params.baseUrl, params.eventId, token);
  const customerName = `${customer.lastName} ${customer.firstName}`;
  const text = replaceSurveyPlaceholders(params.emailBody, {
    surveyUrl,
    customerName,
  });
  const recipients = buildRecipientEmails(customer);

  const results = await Promise.allSettled(
    recipients.map((recipient) =>
      sendMail({
        from: params.from,
        to: recipient,
        subject: params.emailTitle,
        text,
      })
    )
  );

  const failed = results.find(
    (result) => result.status === "rejected" || !result.value.success
  );
  if (failed) {
    const error =
      failed.status === "rejected"
        ? failed.reason instanceof Error
          ? failed.reason.message
          : "メール送信に失敗しました"
        : failed.value.error;
    return { success: false, error };
  }

  return { success: true };
}

/**
 * アンケート依頼メールのバッチ送信
 */
export async function sendSurveyMailBatch(
  params: SurveyBatchMailParams
): Promise<BatchMailResult> {
  const { customers, tokenMap, eventId, baseUrl, from, emailTitle, emailBody } =
    params;
  const sendResults: PromiseSettledResult<{ success: boolean }>[] = [];

  for (let i = 0; i < customers.length; i += BATCH_SIZE) {
    const batch = customers.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((customer) =>
        sendSurveyMailToCustomer(customer, {
          tokenMap,
          eventId,
          baseUrl,
          from,
          emailTitle,
          emailBody,
        })
      )
    );
    sendResults.push(...batchResults);
  }

  const failedNames: string[] = [];
  const successCustomerIds: number[] = [];
  let sentCount = 0;
  let failedCount = 0;

  sendResults.forEach((result, index) => {
    const customer = customers[index];
    if (result.status === "fulfilled" && result.value.success) {
      sentCount++;
      successCustomerIds.push(customer.id);
    } else {
      failedCount++;
      failedNames.push(`${customer.lastName} ${customer.firstName}`);
    }
  });

  return { sentCount, failedCount, failedNames, successCustomerIds };
}
