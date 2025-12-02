"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  LogOut,
  Settings,
  Map,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const pathname = usePathname();

  const routes = [
    {
      label: "ダッシュボード",
      icon: LayoutDashboard,
      href: "/admin",
      active: pathname === "/admin",
    },
    {
      label: "顧客管理",
      icon: Users,
      href: "/admin/customers",
      active: pathname.startsWith("/admin/customers"),
    },
    {
      label: "イベント管理",
      icon: Calendar,
      href: "/admin/events",
      active: pathname.startsWith("/admin/events"),
    },
    {
      label: "サイトマップ",
      icon: Map,
      href: "/admin/sitemap",
      active: pathname === "/admin/sitemap",
    },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-14 items-center border-b px-6 bg-white">
        <Link className="flex items-center gap-2 font-semibold" href="/admin">
          <span className="text-lg font-bold">Marcopolo Admin</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2 bg-white">
        <nav className="grid items-start px-4 text-sm font-medium">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                route.active
                  ? "bg-gray-100 text-primary"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <route.icon className="h-4 w-4" />
              {route.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t p-4 bg-white">
        <Button variant="ghost" className="w-full justify-start gap-2" disabled>
          <Settings className="h-4 w-4" />
          設定 (未実装)
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50">
          <LogOut className="h-4 w-4" />
          ログアウト
        </Button>
      </div>
    </div>
  );
}
