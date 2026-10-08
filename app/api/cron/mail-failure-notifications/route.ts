import { NextResponse, type NextRequest } from "next/server";
import { processDueFailureNotifications } from "@/lib/mail/failure-notification";
import { logServerError } from "@/lib/utils/log-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDueFailureNotifications();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logServerError("GET /api/cron/mail-failure-notifications", error);
    return NextResponse.json(
      { error: "Failed to process mail failure notifications" },
      { status: 500 }
    );
  }
}

