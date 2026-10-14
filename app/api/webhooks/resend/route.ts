import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { processResendWebhook } from "@/lib/mail/resend-webhook";
import { logServerError } from "@/lib/utils/log-error";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  if (!webhookSecret || !apiKey) {
    return NextResponse.json(
      { error: "Webhook is not configured" },
      { status: 503 }
    );
  }

  const providerEventId = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!providerEventId || !timestamp || !signature) {
    return NextResponse.json(
      { error: "Missing webhook signature headers" },
      { status: 400 }
    );
  }

  const payload = await request.text();
  let event;
  try {
    const resend = new Resend(apiKey);
    event = resend.webhooks.verify({
      payload,
      headers: { id: providerEventId, timestamp, signature },
      webhookSecret,
    });
  } catch (error) {
    logServerError("POST /api/webhooks/resend:verify", error);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    const result = await processResendWebhook(providerEventId, event);

    if (result.eventId !== undefined) {
      revalidatePath(`/admin/events/${result.eventId}`);
    }

    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    logServerError("POST /api/webhooks/resend:process", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
