import nodemailer from "nodemailer";

/**
 * nodemailer トランスポート生成
 * 開発環境: MailPit (SMTP_HOST=localhost, SMTP_PORT=1025)
 * 本番環境: Resend SMTP (SMTP_USER/SMTP_PASS)
 */
function createTransport() {
  const host = process.env.SMTP_HOST ?? "localhost";
  const port = Number(process.env.SMTP_PORT ?? "1025");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    ...(user && pass ? { auth: { user, pass } } : {}),
  });
}

export const transporter = createTransport();
