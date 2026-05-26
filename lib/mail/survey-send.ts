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
      batch.map((customer) => {
        const token = tokenMap.get(customer.id) ?? "";
        const surveyUrl = buildSurveyUrl(baseUrl, eventId, token);
        const customerName = `${customer.lastName} ${customer.firstName}`;
        const text = replaceSurveyPlaceholders(emailBody, {
          surveyUrl,
          customerName,
        });
        const recipients = [customer.email, ...(customer.subEmails ?? [])]
          .filter(Boolean)
          .join(", ");

        return sendMail({
          from,
          to: recipients,
          subject: emailTitle,
          text,
        });
      })
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
