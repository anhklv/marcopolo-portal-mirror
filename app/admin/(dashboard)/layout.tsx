import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  const debugMode = process.env.DEBUG_ADMIN_PANEL === "true";

  return (
    <SidebarProvider>
      <AppSidebar
        admin={{
          id: session.user.id,
          email: session.user.email ?? "",
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          role: session.user.role,
        }}
        debugMode={debugMode}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
