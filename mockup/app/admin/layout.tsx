"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
    <SidebarProvider>
      <div className="flex w-full">
        <AppSidebar />
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain bg-white h-svh">
          <div className="flex h-14 items-center border-b px-4">
            <SidebarTrigger />
          </div>
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
