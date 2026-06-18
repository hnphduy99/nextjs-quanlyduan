"use client";

import { Role } from "@/app/generated/prisma/client";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { BarChart3, BellRing, FolderKanban, ScrollText, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    roles: ["ADMIN", "PM", "MEMBER"]
  },
  {
    label: "Dự án",
    href: "/projects",
    icon: FolderKanban,
    roles: ["ADMIN", "PM", "MEMBER"]
  },
  {
    label: "Người dùng",
    href: "/users",
    icon: Users,
    roles: ["ADMIN"]
  },
  {
    label: "Nhật ký hoạt động",
    href: "/logs",
    icon: ScrollText,
    roles: ["ADMIN"]
  },
  {
    label: "Quản lý thông báo",
    href: "/notifications",
    icon: BellRing,
    roles: ["ADMIN"]
  }
];

interface AppSidebarProps {
  user: { name: string; id: string; email: string; role: Role };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const filteredNav = navItems.filter((item) => item.roles.includes(user.role));
  const pathname = usePathname();
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-(--color-primary) to-emerald-400">
                <FolderKanban className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-(--color-text)">CRM</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {filteredNav.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-(--color-surface-elevated)"
                      )}
                    >
                      {<item.icon />}
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
