import { transporter } from "./client";

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
    return { success: false, error: message };
  }
}
