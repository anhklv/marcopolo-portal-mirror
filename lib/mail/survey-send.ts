import { buildRecipientAddresses, sendMail } from "./send";
import {
  buildSurveyUrl,
  replaceSurveyPlaceholders,
} from "@/lib/helpers/survey";
import type { BatchMailResult, MailDeliveryResult } from "./send";

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

interface CustomerSurveyMailResult {
  customerId: number;
  success: boolean;
  deliveries: MailDeliveryResult[];
}

const BATCH_SIZE = 10;

async function sendSurveyMailToCustomer(
  customer: SurveyMailCustomer,
  params: Pick<
    SurveyBatchMailParams,
    "tokenMap" | "eventId" | "baseUrl" | "from" | "emailTitle" | "emailBody"
  >
): Promise<CustomerSurveyMailResult> {
  const token = params.tokenMap.get(customer.id) ?? "";
  const surveyUrl = buildSurveyUrl(params.baseUrl, params.eventId, token);
  const customerName = `${customer.lastName} ${customer.firstName}`;
  const text = replaceSurveyPlaceholders(params.emailBody, { surveyUrl, customerName });

  const deliveries = await Promise.all(
    buildRecipientAddresses(customer).map(async (recipient): Promise<MailDeliveryResult> => {
      const result = await sendMail({
        from: params.from,
        to: recipient.email,
        subject: params.emailTitle,
        text,
      });
      return {
        customerId: customer.id,
        lastName: customer.lastName,
        firstName: customer.firstName,
        ...recipient,
        success: result.success,
        messageId: result.messageId,
        errorCode: result.errorCode,
        errorMessage: result.error,
      };
    })
  );

  return {
    customerId: customer.id,
    success: deliveries.some((delivery) => delivery.success),
    deliveries,
  };
}

export async function sendSurveyMailBatch(
  params: SurveyBatchMailParams
): Promise<BatchMailResult> {
  const customerResults: CustomerSurveyMailResult[] = [];

  for (let i = 0; i < params.customers.length; i += BATCH_SIZE) {
    const batch = params.customers.slice(i, i + BATCH_SIZE);
    customerResults.push(
      ...(await Promise.all(batch.map((customer) => sendSurveyMailToCustomer(customer, params))))
    );
  }

  const customerMap = new Map(params.customers.map((customer) => [customer.id, customer]));
  const successCustomerIds = customerResults
    .filter((result) => result.success)
    .map((result) => result.customerId);
  const failedCustomerIds = customerResults
    .filter((result) => !result.success)
    .map((result) => result.customerId);
  const deliveries = customerResults.flatMap((result) => result.deliveries);

  return {
    sentCount: successCustomerIds.length,
    failedCount: failedCustomerIds.length,
    failedNames: failedCustomerIds.map((id) => {
      const customer = customerMap.get(id);
      return customer ? `${customer.lastName} ${customer.firstName}` : String(id);
    }),
    successCustomerIds,
    addressSuccessCount: deliveries.filter((result) => result.success).length,
    addressFailedCount: deliveries.filter((result) => !result.success).length,
    deliveries,
  };
}
