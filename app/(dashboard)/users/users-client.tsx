"use client";

import { CreateUserDialog } from "@/components/user-management/create-user-dialog";
import { DeleteUserButton } from "@/components/user-management/delete-user-button";
import { EditUserDialog } from "@/components/user-management/edit-user-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Crown, Pencil, Plus, Shield, ShieldCheck, User, Users } from "lucide-react";
import { useState } from "react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "PM" | "MEMBER";
  createdAt: Date;
}

const ROLE_META: Record<string, { label: string; variant: "default" | "secondary" | "outline"; icon: React.ElementType; color: string }> = {
  ADMIN: { label: "Admin", variant: "default", icon: Crown, color: "text-amber-400" },
  PM: { label: "PM", variant: "secondary", icon: ShieldCheck, color: "text-(--color-primary)" },
  MEMBER: { label: "Member", variant: "outline", icon: User, color: "text-(--color-text-muted)" }
};

export function UsersPageClient({ users, currentUserId }: { users: UserItem[]; currentUserId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const pmCount = users.filter((u) => u.role === "PM").length;
  const memberCount = users.filter((u) => u.role === "MEMBER").length;

  return (
    <div className="animate-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-(--color-text)">Phân quyền</h1>
          <p className="mt-1 text-sm text-(--color-text-muted)">Quản lý tài khoản và vai trò người dùng trong hệ thống</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm người dùng
        </Button>
      </div>

      {/* Stats */}
      <div className="stagger-children grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
              <Crown className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{adminCount}</p>
              <p className="text-muted-foreground text-xs">Admin</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="bg-primary/15 flex h-10 w-10 items-center justify-center rounded-xl">
              <ShieldCheck className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pmCount}</p>
              <p className="text-muted-foreground text-xs">Project Manager</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/15">
              <Users className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{memberCount}</p>
              <p className="text-muted-foreground text-xs">Member</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Table */}
      <Card>
        <CardHeader className="border-b border-(--color-border) p-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Shield className="h-4 w-4 text-(--color-primary)" />
            Danh sách người dùng ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-(--color-border)">
            {users.map((u) => {
              const meta = ROLE_META[u.role];
              const RoleIcon = meta.icon;
              const isSelf = u.id === currentUserId;
              return (
                <div
                  key={u.id}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-(--color-surface-elevated)"
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-border) text-sm font-bold text-(--color-text)">
                    {u.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-(--color-text)">{u.name}</p>
                      {isSelf && (
                        <Badge variant="outline" className="text-[10px]">
                          (bạn)
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-(--color-text-muted)">{u.email}</p>
                  </div>

                  {/* Role */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    <RoleIcon className={`h-3.5 w-3.5 ${meta.color}`} />
                    <Badge variant={meta.variant} className="text-xs">
                      {meta.label}
                    </Badge>
                  </div>

                  {/* Date */}
                  <p className="hidden text-xs text-(--color-text-muted) sm:block">{formatDate(u.createdAt)}</p>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditUser(u)}
                      className="h-8 gap-1.5 text-xs hover:bg-(--color-surface-elevated)"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Sửa
                    </Button>
                    {!isSelf && <DeleteUserButton userId={u.id} userName={u.name} />}
                  </div>
                </div>
              );
            })}
            {users.length === 0 && (
              <div className="py-16 text-center text-sm text-(--color-text-muted)">Chưa có người dùng nào</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editUser && (
        <EditUserDialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)} user={editUser} />
      )}
    </div>
  );
}
