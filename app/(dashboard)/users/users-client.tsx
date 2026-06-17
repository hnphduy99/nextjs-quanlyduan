"use client";

import { getUsers } from "@/actions/user";
import { PAGINATION_CONFIG } from "@/constants/pagination";
import { ROLE_META } from "@/constants/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateUserDialog } from "@/components/user-management/create-user-dialog";
import { DeleteUserButton } from "@/components/user-management/delete-user-button";
import { EditUserDialog } from "@/components/user-management/edit-user-dialog";
import { formatDate } from "@/lib/utils";
import { Crown, Pencil, Plus, Shield, ShieldCheck, Users } from "lucide-react";
import { useState, useTransition } from "react";

type UsersData = Awaited<ReturnType<typeof getUsers>>;
type UserItem = UsersData["users"][number];

export function UsersPageClient({ initialData, currentUserId }: { initialData: UsersData; currentUserId: string }) {
  const [data, setData] = useState<UsersData>(initialData);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);

  const [prevInitialData, setPrevInitialData] = useState(initialData);
  if (initialData !== prevInitialData) {
    setData(initialData);
    setPage(1);
    setPrevInitialData(initialData);
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    startTransition(async () => {
      try {
        const result = await getUsers({ page: newPage, limit: PAGINATION_CONFIG.DEFAULT_LIMIT });
        setData(result);
      } catch (error) {
        console.error("Lỗi khi tải trang người dùng:", error);
      }
    });
  };

  const totalPages = Math.ceil(data.totalCount / PAGINATION_CONFIG.DEFAULT_LIMIT);

  return (
    <div className="animate-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Phân quyền</h1>
          <p className="text-muted-foreground mt-1 text-sm">Quản lý tài khoản và vai trò người dùng trong hệ thống</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="w-full gap-2 self-start sm:w-auto sm:self-auto">
          <Plus className="h-4 w-4" />
          Thêm người dùng
        </Button>
      </div>

      {/* Stats */}
      <div className="stagger-children grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
              <Crown className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.adminCount}</p>
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
              <p className="text-2xl font-bold">{data.pmCount}</p>
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
              <p className="text-2xl font-bold">{data.memberCount}</p>
              <p className="text-muted-foreground text-xs">Member</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Table */}
      <Card>
        <CardHeader className="border-border border-b p-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Shield className="text-primary h-4 w-4" />
            Danh sách người dùng ({data.totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-border divide-y">
            {isPending ? (
              // Skeleton Loader Rows
              Array.from({ length: Math.min(data.users.length || 5, PAGINATION_CONFIG.DEFAULT_LIMIT) }).map(
                (_, idx) => (
                  <div
                    key={`skeleton-${idx}`}
                    className="flex flex-col justify-between gap-4 px-5 py-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex w-full min-w-0 items-center gap-4 sm:w-auto">
                      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
                      <Skeleton className="h-5 w-20 rounded-md" />
                      <Skeleton className="h-4 w-24" />
                      <div className="flex gap-1">
                        <Skeleton className="h-8 w-16 rounded-md" />
                        <Skeleton className="h-8.5 w-8.5 rounded-full" />
                      </div>
                    </div>
                  </div>
                )
              )
            ) : data.users.length === 0 ? (
              <div className="text-muted-foreground py-16 text-center text-sm">Chưa có người dùng nào</div>
            ) : (
              data.users.map((u) => {
                const meta = ROLE_META[u.role];
                const RoleIcon = meta.icon;
                const isSelf = u.id === currentUserId;
                return (
                  <div
                    key={u.id}
                    className="group animate-in flex flex-col justify-between gap-4 px-5 py-4 transition-colors hover:bg-(--color-surface-elevated) sm:flex-row sm:items-center"
                  >
                    {/* Left part: Avatar + Info */}
                    <div className="flex w-full min-w-0 items-center gap-4 sm:w-auto">
                      {/* Avatar */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-border) text-sm font-bold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold">{u.name}</p>
                          {isSelf && (
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              (bạn)
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground truncate text-xs">{u.email}</p>
                      </div>
                    </div>

                    {/* Right part: Role, Date, Actions */}
                    <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
                      {/* Role */}
                      <div className="flex shrink-0 items-center gap-1.5">
                        <RoleIcon className={`h-3.5 w-3.5 ${meta.color}`} />
                        <Badge variant={meta.variant} className="text-xs">
                          {meta.label}
                        </Badge>
                      </div>

                      {/* Date */}
                      <p className="text-muted-foreground text-xs sm:block">{formatDate(u.createdAt)}</p>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 max-md:opacity-100">
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
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination component */}
      {!isPending && totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
      )}

      {/* Dialogs */}
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editUser && (
        <EditUserDialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)} user={editUser} />
      )}
    </div>
  );
}
