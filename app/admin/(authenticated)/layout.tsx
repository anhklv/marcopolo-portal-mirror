import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
      <div className="flex w-full">
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
        <main className="flex-1 min-h-svh bg-card">
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
