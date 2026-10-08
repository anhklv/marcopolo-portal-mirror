import { transporter } from "./client";
import { Resend } from "resend";
import { z } from "zod";
import { buildRsvpUrl, replacePlaceholders } from "@/lib/helpers/invite";
import { logServerError } from "@/lib/utils/log-error";

interface SendMailParams {
  from: string;
  to: string | string[];
  subject: string;
  text: string;
  tags?: Array<{ name: string; value: string }>;
  idempotencyKey?: string;
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  providerEmailId?: string;
  errorCode?: string;
  error?: string;
}

const recipientEmailSchema = z.string().email();

function readMailErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const value = error as { responseCode?: unknown; code?: unknown };
  if (typeof value.responseCode === "number") return String(value.responseCode);
  if (typeof value.code === "string") return value.code;
  return undefined;
}

function readResendErrorCode(error: {
  name?: string;
  statusCode?: number | null;
}): string | undefined {
  if (error.name) return error.name;
  if (typeof error.statusCode === "number") return String(error.statusCode);
  return undefined;
}

async function sendMailWithResend(
  params: SendMailParams
): Promise<SendMailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      errorCode: "RESEND_NOT_CONFIGURED",
      error: "Resend API key is not configured",
    };
  }

  const resend = new Resend(apiKey);
  const payload = {
    from: params.from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    ...(params.tags ? { tags: params.tags } : {}),
  };
  const { data, error } = params.idempotencyKey
    ? await resend.emails.send(payload, {
        idempotencyKey: params.idempotencyKey,
      })
    : await resend.emails.send(payload);

  if (error) {
    logServerError(`sendMailWithResend to=${params.to}`, error);
    return {
      success: false,
      errorCode: readResendErrorCode(error),
      error: error.message,
    };
  }

  if (!data?.id) {
    return {
      success: false,
      errorCode: "RESEND_MISSING_EMAIL_ID",
      error: "Resend did not return an email ID",
    };
  }

  return { success: true, providerEmailId: data.id };
}

/** SMTP から同期的に返された結果を画面表示可能な形で返す。 */
export async function sendMail(params: SendMailParams): Promise<SendMailResult> {
  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  if (
    recipients.length === 0 ||
    recipients.some(
      (recipient) => !recipientEmailSchema.safeParse(recipient).success
    )
  ) {
    return {
      success: false,
      errorCode: "INVALID_EMAIL",
      error: "Invalid email address",
    };
  }

  try {
    if (process.env.MAIL_PROVIDER === "resend") {
      return await sendMailWithResend(params);
    }

    const info = await transporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "メール送信に失敗しました";
    logServerError(`sendMail to=${params.to}`, error);
    return {
      success: false,
      errorCode: readMailErrorCode(error),
      error: message,
    };
  }
}

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

export interface RecipientAddress {
  email: string;
  emailType: "main" | "sub";
  subEmailOrder: number | null;
}

export interface MailDeliveryResult extends RecipientAddress {
  customerId: number;
  lastName: string;
  firstName: string;
  success: boolean;
  messageId?: string;
  providerEmailId?: string;
  errorCode?: string;
  errorMessage?: string;
}

interface CustomerMailResult {
  customerId: number;
  success: boolean;
  deliveries: MailDeliveryResult[];
}

export interface BatchMailResult {
  sentCount: number;
  failedCount: number;
  failedNames: string[];
  successCustomerIds: number[];
  addressSuccessCount: number;
  addressFailedCount: number;
  deliveries: MailDeliveryResult[];
}

const BATCH_SIZE = 10;

export function buildRecipientAddresses(
  customer: Pick<BatchMailCustomer, "email" | "subEmails">
): RecipientAddress[] {
  const addresses: RecipientAddress[] = [];
  if (customer.email) {
    addresses.push({
      email: customer.email,
      emailType: "main",
      subEmailOrder: null,
    });
  }
  (customer.subEmails ?? []).forEach((email, index) => {
    if (email) {
      addresses.push({ email, emailType: "sub", subEmailOrder: index + 1 });
    }
  });
  return addresses;
}

async function sendMailToCustomer(
  customer: BatchMailCustomer,
  params: Pick<
    BatchMailParams,
    "tokenMap" | "eventId" | "baseUrl" | "from" | "emailTitle" | "emailBody"
  >
): Promise<CustomerMailResult> {
  const token = params.tokenMap.get(customer.id) ?? "";
  const rsvpUrl = buildRsvpUrl(params.baseUrl, params.eventId, token);
  const customerName = `${customer.lastName} ${customer.firstName}`;
  const text = replacePlaceholders(params.emailBody, { rsvpUrl, customerName });

  const deliveries = await Promise.all(
    buildRecipientAddresses(customer).map(
      async (recipient): Promise<MailDeliveryResult> => {
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
          providerEmailId: result.providerEmailId,
          errorCode: result.errorCode,
          errorMessage: result.error,
        };
      }
    )
  );

  return {
    customerId: customer.id,
    success: deliveries.some((delivery) => delivery.success),
    deliveries,
  };
}

/** メイン・全サブアドレスへ送信し、アドレス単位の結果を返す。 */
export async function sendMailBatch(
  params: BatchMailParams
): Promise<BatchMailResult> {
  const customerResults: CustomerMailResult[] = [];

  for (let i = 0; i < params.customers.length; i += BATCH_SIZE) {
    const batch = params.customers.slice(i, i + BATCH_SIZE);
    customerResults.push(
      ...(await Promise.all(
        batch.map((customer) => sendMailToCustomer(customer, params))
      ))
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
