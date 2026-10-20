import { buildRsvpUrl, replacePlaceholders } from "@/lib/helpers/invite";
import { buildSurveyUrl, replaceSurveyPlaceholders } from "@/lib/helpers/survey";
import { getBaseUrl } from "@/lib/helpers/base-url";
import { sendMail } from "@/lib/mail/send";
import type { AdminForTestSend } from "@/lib/types/test-send";

type TestMailKind = "rsvp" | "survey";

type SendTestMailInput = {
  eventId: number;
  subject: string;
  body: string;
  kind: TestMailKind;
  admins: AdminForTestSend[];
};

export async function sendTestMailToAdmins(input: SendTestMailInput) {
  const baseUrl = await getBaseUrl();
  const from = process.env.SMTP_FROM ?? "noreply@example.com";
  const text =
    input.kind === "survey"
      ? replaceSurveyPlaceholders(input.body, {
          surveyUrl: buildSurveyUrl(
            baseUrl,
            input.eventId,
            "test-dummy-token"
          ),
          customerName: "テスト 太郎",
        })
      : replacePlaceholders(input.body, {
          rsvpUrl: buildRsvpUrl(
            baseUrl,
            input.eventId,
            "test-dummy-token"
          ),
          customerName: "テスト 太郎",
        });

  const results = await Promise.all(
    input.admins.map((admin) =>
      sendMail({
        from,
        to: admin.email,
        subject: `[テスト] ${input.subject}`,
        text,
      })
    )
  );
  const failedResult = results.find((result) => !result.success);

  return failedResult
    ? {
        success: false as const,
        error: failedResult.error ?? "テストメールの送信に失敗しました。",
      }
    : { success: true as const };
}
