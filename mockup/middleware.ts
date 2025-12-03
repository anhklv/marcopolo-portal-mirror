import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Basic認証の有効化チェック
  const basicAuthEnabled = process.env.BASIC_AUTH_ENABLED === "true";
  const basicAuthUser = process.env.BASIC_AUTH_USER || "marcopolo";
  const basicAuthPassword = process.env.BASIC_AUTH_PASSWORD || "marcopolo_2025";

  // 本番環境でBasic認証が有効な場合のみチェック
  if (basicAuthEnabled || process.env.NODE_ENV === "production") {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Secure Area"',
        },
      });
    }

    // Basic認証のデコード
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
    const [username, password] = credentials.split(":");

    // 認証チェック
    if (username !== basicAuthUser || password !== basicAuthPassword) {
      return new NextResponse("Invalid credentials", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Secure Area"',
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

