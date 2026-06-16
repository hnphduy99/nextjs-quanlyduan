"use client";

import { logoutAction } from "@/actions/auth";
import type { Role } from "@/app/generated/prisma/client";
import { cn } from "@/lib/utils";
import { BarChart3, ChevronLeft, ChevronRight, FolderKanban, LogOut, Users, ScrollText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ModeToggle } from "./theme-toggle";
import { Button } from "./ui/button";

interface SidebarProps {
  userName: string;
  userRole: Role;
}

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
  }
];

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNav = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-(--color-border) bg-(--color-surface) transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-(--color-border) px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-(--color-primary) to-emerald-400">
          <FolderKanban className="h-4 w-4 text-white" />
        </div>
        {!collapsed && <span className="text-lg font-bold tracking-tight text-(--color-text)">CRM</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {filteredNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-(--color-surface-elevated)",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User & Collapse */}
      <div className="border-border space-y-2 border-t p-3">
        {!collapsed && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-full">
                <span className="text-primary text-xs font-medium">{userName.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="truncate text-sm font-medium text-(--color-text)">{userName}</p>
                <p className="text-muted-foreground text-xs">{userRole}</p>
              </div>
            </div>
            <ModeToggle />
          </div>
        )}
        <form action={logoutAction}>
          <Button
            variant="destructive"
            type="submit"
            className={cn(
              "hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Đăng xuất</span>}
          </Button>
        </form>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground flex w-full cursor-pointer items-center justify-center rounded-lg p-2 transition-colors hover:bg-(--color-surface-elevated)"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
