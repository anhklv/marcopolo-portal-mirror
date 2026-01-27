"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/lib/contexts/auth.context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // ログインページ以外で未認証の場合はログイン画面にリダイレクト
    if (!isAuthenticated && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [isAuthenticated, pathname, router]);

  useEffect(() => {
    const { style } = document.body;
    const prevBodyOverflow = style.overflow;
    const prevBodyHeight = style.height;
    const prevHtmlHeight = document.documentElement.style.height;

    style.overflow = "hidden";
    style.height = "100%";
    document.documentElement.style.height = "100%";

    return () => {
      style.overflow = prevBodyOverflow;
      style.height = prevBodyHeight;
      document.documentElement.style.height = prevHtmlHeight;
    };
  }, []);

  // 未認証の場合は何も表示しない
  if (!isAuthenticated && pathname !== "/admin/login") {
    return null;
  }

  // ログインページの場合はサイドバーなしで表示
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain bg-white p-8">
        {children}
      </main>
    </div>
  );
}
