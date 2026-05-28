import { headers } from "next/headers";

const LOCAL_BASE_URL = "http://localhost:3000";

export async function getBaseUrl(): Promise<string> {
  const appBaseUrl = process.env.APP_BASE_URL;
  if (appBaseUrl) {
    return appBaseUrl;
  }

  try {
    const headerList = await headers();
    const host = headerList.get("host");
    if (host) {
      const proto = headerList.get("x-forwarded-proto") ?? "http";
      return `${proto}://${host}`;
    }
  } catch {
    // リクエスト外（cron・テスト等）では headers() を使えない
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return LOCAL_BASE_URL;
}
