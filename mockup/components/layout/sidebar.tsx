"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Calendar,
  LogOut,
  Settings,
  ChevronDown,
  FileText,
  Check,
  ChevronsUpDown,
  ShieldCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/contexts/auth.context";
import { toast } from "sonner";
import { admins } from "@/lib/data/mock";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentAdmin, logout, switchAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
    toast.success("ログアウトしました");
  };

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

  const adminInitial = currentAdmin
    ? (currentAdmin.lastName.charAt(0))
    : "?";

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white flex-shrink-0 overflow-hidden">
      <div className="flex h-14 items-center border-b px-6 bg-white flex-shrink-0">
        <Link className="flex items-center gap-2 font-semibold" href="/admin/customers">
          <span className="text-lg font-bold">Marcopolo Admin</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2 bg-white min-h-0">
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

          {/* 開発メニュー（イベント管理の下） */}
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
              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  className="bg-white hover:bg-gray-100 cursor-pointer admin-switch-trigger"
                >
                  <span>管理者切り替え</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  className="bg-white w-64 admin-switch-content"
                  sideOffset={8}
                >
                  {admins.map((admin) => {
                    const isCurrentAdmin = currentAdmin?.id === admin.id;
                    return (
                      <DropdownMenuItem
                        key={admin.id}
                        className={cn(
                          "bg-white hover:bg-gray-100 cursor-pointer",
                          isCurrentAdmin && "bg-gray-100"
                        )}
                        onClick={() => {
                          switchAdmin(admin.id);
                          toast.success(`${admin.lastName} ${admin.firstName}に切り替えました`);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex flex-col">
                            <span className="font-medium">{admin.lastName} {admin.firstName}</span>
                            <span className="text-xs text-gray-500">{admin.email}</span>
                          </div>
                          {isCurrentAdmin && <Check className="h-4 w-4 shrink-0" />}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
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
        </nav>
      </div>

      {/* ユーザープロフィール（左下） */}
      <div className="mt-auto border-t bg-white flex-shrink-0">
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full rounded-lg px-2 py-2 hover:bg-gray-100 transition-all text-left focus:outline-none">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-medium">
                    {adminInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  {currentAdmin ? (
                    <>
                      <p className="text-sm font-medium truncate">
                        {currentAdmin.lastName} {currentAdmin.firstName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {currentAdmin.email}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">未ログイン</p>
                  )}
                </div>
                <ChevronsUpDown className="h-4 w-4 text-gray-400 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="w-56 bg-white"
            >
              {currentAdmin?.role === "super" && (
                <>
                  <DropdownMenuItem asChild className="bg-white hover:bg-gray-100">
                    <Link
                      href="/admin/admins"
                      className={cn(
                        "cursor-pointer w-full",
                        pathname.startsWith("/admin/admins") && "bg-gray-100"
                      )}
                    >
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      管理者管理
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild className="bg-white hover:bg-gray-100">
                <Link
                  href="/admin/settings/password"
                  className={cn(
                    "cursor-pointer w-full",
                    pathname === "/admin/settings/password" && "bg-gray-100"
                  )}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  設定
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="bg-white hover:bg-red-50 text-red-500 hover:text-red-600 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
