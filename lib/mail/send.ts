import { transporter } from "./client";
import { buildRsvpUrl, replacePlaceholders } from "@/lib/helpers/invite";
import { logServerError } from "@/lib/utils/log-error";

interface SendMailParams {
  from: string;
  to: string;
  subject: string;
  text: string;
}

interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * メール送信
 */
export async function sendMail(params: SendMailParams): Promise<SendMailResult> {
  try {
    const info = await transporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "メール送信に失敗しました";
    logServerError(`sendMail to=${params.to}`, err);
    return { success: false, error: message };
  }
}

// ============================================================
// バッチメール送信
// ============================================================

export interface BatchMailCustomer {
  id: number;
  lastName: string;
  firstName: string;
  email: string;
  subEmails: string[] | null;
}

interface BatchMailParams {
  customers: BatchMailCustomer[];
  tokenMap: Map<number, string>;
  eventId: number;
  baseUrl: string;
  from: string;
  emailTitle: string;
  emailBody: string;
}

export interface BatchMailResult {
  sentCount: number;
  failedCount: number;
  failedNames: string[];
  successCustomerIds: number[];
}

const BATCH_SIZE = 10;

function buildRecipientEmails(customer: BatchMailCustomer): string[] {
  return [customer.email, ...(customer.subEmails ?? [])].filter(Boolean);
}

async function sendMailToCustomer(
  customer: BatchMailCustomer,
  params: Pick<BatchMailParams, "tokenMap" | "eventId" | "baseUrl" | "from" | "emailTitle" | "emailBody">
): Promise<SendMailResult> {
  const token = params.tokenMap.get(customer.id) ?? "";
  const rsvpUrl = buildRsvpUrl(params.baseUrl, params.eventId, token);
  const customerName = `${customer.lastName} ${customer.firstName}`;
  const text = replacePlaceholders(params.emailBody, { rsvpUrl, customerName });
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
 * RSVP案内/リマインドメールのバッチ送信
 * 顧客リストに対してバッチ分割でメールを送信し、結果を集計する
 */
export async function sendMailBatch(params: BatchMailParams): Promise<BatchMailResult> {
  const { customers, tokenMap, eventId, baseUrl, from, emailTitle, emailBody } = params;
  const sendResults: PromiseSettledResult<SendMailResult>[] = [];

  for (let i = 0; i < customers.length; i += BATCH_SIZE) {
    const batch = customers.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((customer) =>
        sendMailToCustomer(customer, {
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
