import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            <SidebarTrigger className="-ml-1 block lg:hidden" />
            <div className="lg:ml-0">{children}</div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
