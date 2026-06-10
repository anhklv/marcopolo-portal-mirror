import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { isDebugAdminPanelEnabled } from "@/lib/debug-admin-panel";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  // /admin: 常に /admin/login へリダイレクト（ページは置かない）
  if (pathname === "/admin") {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  // /admin/login: 認証済みなら /admin/customers にリダイレクト
  if (pathname === "/admin/login") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/admin/customers", req.url));
    }
    return NextResponse.next();
  }

  // /docs/*: DEBUG_ADMIN_PANEL=true かつ管理者ログイン時のみ閲覧可
  if (pathname === "/docs" || pathname.startsWith("/docs/")) {
    if (!isDebugAdminPanelEnabled()) {
      return new NextResponse("Not Found", { status: 404 });
    }
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  // 開発用ページ: DEBUG_ADMIN_PANEL !== 'true' なら認証状態に関わらず 404
  const debugPages = ["/admin/styleguide"];
  if (debugPages.some((p) => pathname.startsWith(p)) && !isDebugAdminPanelEnabled()) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // /admin/* (login以外): 未認証なら /admin/login にリダイレクト
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    // /admin/admins: community_admin は 403
    if (pathname.startsWith("/admin/admins") && role === "community_admin") {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/docs", "/docs/:path*"],
};
