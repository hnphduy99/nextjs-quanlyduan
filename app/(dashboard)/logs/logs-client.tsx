"use client";

import { getActivityLogs } from "@/actions/log";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { Activity, Calendar, Filter, Globe, Monitor, RefreshCw, Search } from "lucide-react";
import { useState, useTransition } from "react";

interface LogItem {
  id: string;
  userId: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface UserDropdownItem {
  id: string;
  name: string;
  email: string;
}

interface LogsPageClientProps {
  initialLogs: LogItem[];
  users: UserDropdownItem[];
  actions: string[];
  currentUserId: string;
}

const ACTION_META: Record<string, { label: string; color: string }> = {
  CREATE_PROJECT: { label: "Tạo dự án", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  UPDATE_PROGRESS: { label: "Tiến độ dự án", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  DELETE_PROJECT: { label: "Xóa dự án", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  LOGIN: { label: "Đăng nhập", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  LOGOUT: { label: "Đăng xuất", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
  UPLOAD_FILE: { label: "Tải file lên", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  DELETE_FILE: { label: "Xóa file", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  CREATE_USER: { label: "Tạo người dùng", color: "bg-teal-500/10 text-teal-500 border-teal-500/20" },
  UPDATE_USER: { label: "Sửa người dùng", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
  DELETE_USER: { label: "Xóa người dùng", color: "bg-red-500/10 text-red-500 border-red-500/20" }
};

export function LogsPageClient({ initialLogs, users, actions, currentUserId }: LogsPageClientProps) {
  const [logs, setLogs] = useState<LogItem[]>(initialLogs);
  const [isPending, startTransition] = useTransition();

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleApplyFilters = () => {
    startTransition(async () => {
      try {
        const result = await getActivityLogs({
          userId: selectedUser === "all" ? undefined : selectedUser,
          action: selectedAction === "all" ? undefined : selectedAction,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          search: search.trim() || undefined
        });
        setLogs(result as LogItem[]);
      } catch (error) {
        console.error("Lỗi khi tải nhật ký hoạt động:", error);
      }
    });
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedUser("all");
    setSelectedAction("all");
    setDateFrom("");
    setDateTo("");

    startTransition(async () => {
      try {
        const result = await getActivityLogs();
        setLogs(result as LogItem[]);
      } catch (error) {
        console.error("Lỗi khi reset nhật ký hoạt động:", error);
      }
    });
  };

  const formatLogDetails = (action: string, detailsStr: string | null) => {
    if (!detailsStr) return <span className="text-muted-foreground text-xs">—</span>;

    try {
      const details = JSON.parse(detailsStr);

      if (typeof details === "string") {
        return <span className="text-xs">{details}</span>;
      }

      if (action === "CREATE_PROJECT" || action === "DELETE_PROJECT") {
        return (
          <span className="text-xs">
            Dự án: <strong className="font-semibold">{details.projectName || details.projectId}</strong>
          </span>
        );
      }

      if (action === "UPDATE_PROGRESS") {
        return (
          <div className="space-y-1 text-xs">
            <div>
              Dự án: <strong className="font-semibold">{details.projectName}</strong>
            </div>
            <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
              <span>Bước {details.oldStep}</span>
              <span>→</span>
              <span className="text-primary font-semibold">Bước {details.newStep}</span>
              {details.percentage !== undefined && (
                <span className="bg-primary/15 text-primary rounded px-1.5 py-0.5 text-[10px] font-bold">
                  {details.percentage}%
                </span>
              )}
            </div>
            {details.note && (
              <div className="text-muted-foreground max-w-md truncate text-[11px] italic">
                &quot;{details.note}&quot;
              </div>
            )}
          </div>
        );
      }

      if (action === "UPLOAD_FILE" || action === "DELETE_FILE") {
        return (
          <div className="space-y-1 text-xs">
            <div>
              Dự án: <strong className="font-semibold">{details.projectName || "Không rõ"}</strong>
            </div>
            <div className="text-muted-foreground text-[11px]">
              File:{" "}
              <span className="inline-block max-w-50 truncate align-bottom font-medium underline">
                {details.fileName}
              </span>
              {details.stepOrder && ` (Bước ${details.stepOrder})`}
            </div>
          </div>
        );
      }

      if (action === "CREATE_USER" || action === "UPDATE_USER" || action === "DELETE_USER") {
        return (
          <span className="text-xs">
            Tài khoản: <strong className="font-semibold">{details.targetName}</strong> (
            {details.targetEmail || details.targetRole})
          </span>
        );
      }

      return (
        <pre className="bg-muted/40 text-muted-foreground max-h-20 max-w-xs overflow-auto rounded p-1 font-mono text-[10px]">
          {JSON.stringify(details, null, 2)}
        </pre>
      );
    } catch {
      return <span className="text-xs">{detailsStr}</span>;
    }
  };

  return (
    <div className="animate-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Nhật ký hoạt động</h1>
        <p className="text-muted-foreground mt-1 text-sm">Lịch sử hoạt động của người dùng trên hệ thống CRM</p>
      </div>

      {/* Filters Card */}
      <Card className="border-border border bg-(--color-surface) shadow-sm">
        <CardHeader className="px-4 pt-4 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Filter className="text-primary h-4 w-4" />
            Bộ lọc tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
            {/* Search Input */}
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs font-semibold">Từ khóa</label>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Chi tiết/IP/Email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* User Select */}
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs font-semibold">Người thực hiện</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả người dùng</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Select */}
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs font-semibold">Hành động</label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả hành động</SelectItem>
                  {actions.map((act) => (
                    <SelectItem key={act} value={act}>
                      {ACTION_META[act]?.label || act}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs font-semibold">Từ ngày</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>

            {/* Date To */}
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs font-semibold">Đến ngày</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              disabled={isPending}
              className="h-9 cursor-pointer gap-2 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
            <Button onClick={handleApplyFilters} disabled={isPending} className="h-9 cursor-pointer gap-2 text-xs">
              <Filter className="h-3.5 w-3.5" />
              Lọc dữ liệu
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table Card */}
      <Card className="border-border border bg-(--color-surface) shadow-sm">
        <CardHeader className="border-border border-b p-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Activity className="text-primary h-4.5 w-4.5" />
            Danh sách nhật ký hoạt động ({logs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground border-border border-b font-semibold">
                  <th className="px-5 py-3.5 text-xs tracking-wider uppercase">Thời gian</th>
                  <th className="px-5 py-3.5 text-xs tracking-wider uppercase">Người thực hiện</th>
                  <th className="px-5 py-3.5 text-xs tracking-wider uppercase">Hành động</th>
                  <th className="px-5 py-3.5 text-xs tracking-wider uppercase">Chi tiết nội dung</th>
                  <th className="px-5 py-3.5 text-xs tracking-wider uppercase">Thiết bị & IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border)">
                {logs.map((log) => {
                  const meta = ACTION_META[log.action] || {
                    label: log.action,
                    color: "bg-slate-500/10 text-slate-500 border-slate-500/20"
                  };
                  const isSelf = log.userId === currentUserId;
                  return (
                    <tr key={log.id} className="group transition-colors hover:bg-(--color-surface-elevated)">
                      {/* Time */}
                      <td className="text-muted-foreground px-5 py-4 text-xs whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(log.createdAt)}
                        </span>
                      </td>

                      {/* User */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-border) text-xs font-bold">
                            {log.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-semibold">{log.user.name}</span>
                              {isSelf && (
                                <Badge variant="outline" className="h-4 px-1 py-0 text-[9px]">
                                  bạn
                                </Badge>
                              )}
                            </div>
                            <span className="text-muted-foreground block text-[10px]">{log.user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge variant="outline" className={`border px-2 py-0.5 text-xs ${meta.color}`}>
                          {meta.label}
                        </Badge>
                      </td>

                      {/* Details */}
                      <td className="min-w-70 px-5 py-4">{formatLogDetails(log.action, log.details)}</td>

                      {/* IP and Device */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-muted-foreground space-y-1 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5 shrink-0" />
                            {log.ipAddress || "Không rõ IP"}
                          </span>
                          <span
                            className="flex max-w-37.5 items-center gap-1 truncate"
                            title={log.userAgent || undefined}
                          >
                            <Monitor className="h-3.5 w-3.5 shrink-0" />
                            {log.userAgent
                              ? log.userAgent.includes("Windows")
                                ? "Windows"
                                : log.userAgent.includes("Macintosh")
                                  ? "macOS"
                                  : log.userAgent.includes("Linux")
                                    ? "Linux"
                                    : "Thiết bị di động"
                              : "Không rõ"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-muted-foreground py-16 text-center text-sm">
                      Không tìm thấy lịch sử hoạt động nào khớp với bộ lọc
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
