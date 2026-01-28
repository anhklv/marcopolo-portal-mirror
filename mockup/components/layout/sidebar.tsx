"use client";

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
  Check,
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
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/contexts/auth.context";
import { toast } from "sonner";
import { admins } from "@/lib/data/mock";
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

export function AppSidebar() {
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
    {
      label: "スタイルガイド",
      href: "/admin/styleguide",
    },
  ];

  const adminInitial = currentAdmin
    ? currentAdmin.lastName.charAt(0)
    : "?";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/admin/customers">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="text-lg font-bold">M</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
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
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton isActive={devMenuItems.some((item) => pathname === item.href)}>
                      <FileText />
                      <span>開発メニュー</span>
                      <ChevronRight className="ml-auto" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56" side="right">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <span>管理者切り替え</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-64" sideOffset={8}>
                        {admins.map((admin) => {
                          const isCurrentAdmin = currentAdmin?.id === admin.id;
                          return (
                            <DropdownMenuItem
                              key={admin.id}
                              className={cn(
                                isCurrentAdmin && "bg-accent"
                              )}
                              onClick={() => {
                                switchAdmin(admin.id);
                                toast.success(`${admin.lastName} ${admin.firstName}に切り替えました`);
                              }}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {admin.lastName} {admin.firstName}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {admin.email}
                                  </span>
                                </div>
                                {isCurrentAdmin && <Check className="h-4 w-4 shrink-0" />}
                              </div>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    {devMenuItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "cursor-pointer w-full",
                            pathname === item.href && "bg-accent"
                          )}
                        >
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
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
                    {currentAdmin ? (
                      <>
                        <span className="truncate">
                          {currentAdmin.lastName} {currentAdmin.firstName}
                        </span>
                        <span className="truncate text-xs">
                          {currentAdmin.email}
                        </span>
                      </>
                    ) : (
                      <span className="truncate text-xs">未ログイン</span>
                    )}
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
                {currentAdmin?.role === "super" && (
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
  );
}
