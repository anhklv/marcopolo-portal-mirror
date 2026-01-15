"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Calendar,
  LogOut,
  Settings,
  ChevronDown,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Sidebar() {
  const pathname = usePathname();

  const routes = [
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
  ];

  const devMenuItems = [
    {
      label: "要件定義書",
      href: "/docs/要件定義書",
    },
    {
      label: "画面設計書",
      href: "/docs/画面設計書",
    },
    {
      label: "画面一覧",
      href: "/admin/sitemap",
    },
  ];

  const isDevMenuActive = devMenuItems.some((item) => pathname === item.href);

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-14 items-center border-b px-6 bg-white">
        <Link className="flex items-center gap-2 font-semibold" href="/admin/customers">
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
      <div className="mt-auto bg-white">
        <div className="px-4 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary w-full text-left text-sm font-medium",
                  isDevMenuActive
                    ? "bg-gray-100 text-primary"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <FileText className="h-4 w-4" />
                <span className="flex-1">開発メニュー</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-white">
              {devMenuItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild className="bg-white hover:bg-gray-100">
                  <Link
                    href={item.href}
                    className={cn(
                      "cursor-pointer w-full",
                      pathname === item.href && "bg-gray-100"
                    )}
                  >
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary w-full text-left text-sm font-medium",
                  pathname.startsWith("/admin/settings")
                    ? "bg-gray-100 text-primary"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <Settings className="h-4 w-4" />
                <span className="flex-1">設定</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-white">
              <DropdownMenuItem asChild className="bg-white hover:bg-gray-100">
                <Link
                  href="/admin/settings/email"
                  className={cn(
                    "cursor-pointer w-full",
                    pathname === "/admin/settings/email" && "bg-gray-100"
                  )}
                >
                  ログインID変更
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="bg-white hover:bg-gray-100">
                <Link
                  href="/admin/settings/password"
                  className={cn(
                    "cursor-pointer w-full",
                    pathname === "/admin/settings/password" && "bg-gray-100"
                  )}
                >
                  パスワード変更
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            ログアウト
          </Button>
        </div>
      </div>
    </div>
  );
}
