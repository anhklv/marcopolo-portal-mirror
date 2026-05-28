import nodemailer from "nodemailer";

/**
 * nodemailer トランスポート生成
 * MAIL_PROVIDER=resend  → Resend SMTP (smtp.resend.com:465)
 * MAIL_PROVIDER=mailpit → MailPit (localhost:1025) ※デフォルト
 */
function createTransport() {
  const provider = process.env.MAIL_PROVIDER ?? "mailpit";

  if (provider === "resend") {
    return nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: {
        user: "resend",
        pass: process.env.RESEND_API_KEY,
      },
    });
  }

  // MailPit（デフォルト）
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? "1025"),
    secure: false,
  });
}

export const transporter = createTransport();
