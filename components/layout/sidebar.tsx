"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Calendar,
  LogOut,
  Settings,
  MoreVertical,
  ChevronRight,
  FileText,
  ShieldCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { logoutAction } from "@/lib/actions/auth";
import {
  AdminSwitcherMenu,
  AdminSwitcherPasswordDialog,
} from "@/components/debug/admin-switcher";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  admin: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "super" | "community_admin";
  };
  debugMode: boolean;
}

export function AppSidebar({ admin, debugMode }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [passwordDialogAdmin, setPasswordDialogAdmin] = useState<{
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    communities: { code: string; name: string }[];
  } | null>(null);

  const handleLogout = async () => {
    await logoutAction();
    toast.success("ログアウトしました");
    router.push("/admin/login");
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
      label: "ドキュメント",
      href: "/docs",
    },
    {
      label: "スタイルガイド",
      href: "/admin/styleguide",
    },
  ];

  const adminInitial = admin.lastName.charAt(0);

  return (
    <>
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/admin/customers">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="text-lg font-bold">M</span>
                </div>
                <div className="grid flex-1 text-left text-base leading-tight">
                  <span className="truncate font-semibold">Marcopolo Admin</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {routes.map((route) => (
                <SidebarMenuItem key={route.href}>
                  <SidebarMenuButton asChild isActive={route.active}>
                    <Link href={route.href}>
                      <route.icon />
                      <span>{route.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {debugMode && (
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton isActive={devMenuItems.some((item) => pathname === item.href || (item.href === "/docs" && pathname.startsWith("/docs")))}>
                        <FileText />
                        <span>開発メニュー</span>
                        <ChevronRight className="ml-auto" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56" side="right">
                      <AdminSwitcherMenu
                        currentEmail={admin.email}
                        onPasswordRequired={setPasswordDialogAdmin}
                      />
                      {devMenuItems.map((item) => (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "cursor-pointer w-full",
                              (pathname === item.href || (item.href === "/docs" && pathname.startsWith("/docs"))) && "bg-accent"
                            )}
                          >
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      {adminInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate">
                      {admin.lastName} {admin.firstName}
                    </span>
                    <span className="truncate text-xs">
                      {admin.email}
                    </span>
                  </div>
                  <MoreVertical className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                {admin.role === "super" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/admins">
                      <ShieldCheck />
                      管理者管理
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings/password">
                    <Settings />
                    設定
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
    {debugMode && (
      <AdminSwitcherPasswordDialog
        admin={passwordDialogAdmin}
        open={passwordDialogAdmin !== null}
        onOpenChange={(open) => {
          if (!open) setPasswordDialogAdmin(null);
        }}
      />
    )}
    </>
  );
}
