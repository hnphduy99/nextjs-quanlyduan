"use client";

import { logoutAction } from "@/actions/auth";
import { Role } from "@/app/generated/prisma/client";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { ModeToggle } from "../theme-toggle";
import { Button } from "../ui/button";

export function NavUser({ user }: { user: { name: string; id: string; email: string; role: Role } }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center">
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs">{user.email}</span>
          </div>
        </SidebarMenuButton>
        <ModeToggle />
      </SidebarMenuItem>
      <SidebarMenuItem>
        <form action={logoutAction}>
          <Button
            variant="destructive"
            type="submit"
            className={cn(
              "hover:bg-destructive/20 flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Đăng xuất</span>
          </Button>
        </form>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
