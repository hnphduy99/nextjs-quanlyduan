"use client";

import { getActivityLogs } from "@/actions/log";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ACTION_META } from "@/constants/logs";
import { PAGINATION_CONFIG } from "@/constants/pagination";
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
  initialLogs: {
    logs: LogItem[];
    totalCount: number;
    hasMore: boolean;
  };
  users: UserDropdownItem[];
  actions: string[];
  currentUserId: string;
}

export function LogsPageClient({ initialLogs, users, actions, currentUserId }: LogsPageClientProps) {
  const [logsData, setLogsData] = useState(initialLogs);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = async (targetPage: number) => {
    try {
      const result = await getActivityLogs({
        userId: selectedUser === "all" ? undefined : selectedUser,
        action: selectedAction === "all" ? undefined : selectedAction,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: search.trim() || undefined,
        page: targetPage,
        limit: PAGINATION_CONFIG.DEFAULT_LIMIT
      });
      setLogsData(result);
    } catch (error) {
      console.error("Lỗi khi tải nhật ký hoạt động:", error);
    }
  };

  const handleApplyFilters = () => {
    setPage(1);
    startTransition(async () => {
      await fetchLogs(1);
    });
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedUser("all");
    setSelectedAction("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);

    startTransition(async () => {
      try {
        const result = await getActivityLogs({ page: 1, limit: PAGINATION_CONFIG.DEFAULT_LIMIT });
        setLogsData(result);
      } catch (error) {
        console.error("Lỗi khi reset nhật ký hoạt động:", error);
      }
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    startTransition(async () => {
      await fetchLogs(newPage);
    });
  };

  const totalPages = Math.ceil(logsData.totalCount / PAGINATION_CONFIG.DEFAULT_LIMIT);

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
          <div className="mt-4 flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              disabled={isPending}
              className="h-9 w-full cursor-pointer gap-2 text-xs sm:w-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
            <Button
              onClick={handleApplyFilters}
              disabled={isPending}
              className="h-9 w-full cursor-pointer gap-2 text-xs sm:w-auto"
            >
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
            Danh sách nhật ký hoạt động ({logsData.totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 border-collapse text-left text-sm">
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
                {isPending ? (
                  // Skeleton rows when transitioning pages/filters
                  Array.from({ length: Math.min(logsData.logs.length || 5, PAGINATION_CONFIG.DEFAULT_LIMIT) }).map(
                    (_, idx) => (
                      <tr key={`skeleton-${idx}`} className="border-border border-b">
                        <td className="px-5 py-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1">
                              <Skeleton className="h-3 w-20" />
                              <Skeleton className="h-2.5 w-28" />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Skeleton className="h-5 w-20 rounded-md" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-2">
                            <Skeleton className="h-3 w-48" />
                            <Skeleton className="h-2.5 w-32" />
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <Skeleton className="h-3.5 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </td>
                      </tr>
                    )
                  )
                ) : logsData.logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-muted-foreground py-16 text-center text-sm">
                      Không tìm thấy lịch sử hoạt động nào khớp với bộ lọc
                    </td>
                  </tr>
                ) : (
                  logsData.logs.map((log) => {
                    const meta = ACTION_META[log.action] || {
                      label: log.action,
                      color: "bg-slate-500/10 text-slate-500 border-slate-500/20"
                    };
                    const isSelf = log.userId === currentUserId;
                    return (
                      <tr
                        key={log.id}
                        className="group animate-in transition-colors hover:bg-(--color-surface-elevated)"
                      >
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
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination info and buttons */}
          {totalPages > 1 && (
            <div className="border-border flex flex-col items-center justify-between gap-4 border-t px-5 py-4 sm:flex-row">
              <p className="text-muted-foreground text-xs">
                Hiển thị{" "}
                <span className="font-semibold">
                  {Math.min((page - 1) * PAGINATION_CONFIG.DEFAULT_LIMIT + 1, logsData.totalCount)}
                </span>{" "}
                -{" "}
                <span className="font-semibold">
                  {Math.min(page * PAGINATION_CONFIG.DEFAULT_LIMIT, logsData.totalCount)}
                </span>{" "}
                trong tổng số <span className="font-semibold">{logsData.totalCount}</span> hoạt động
              </p>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} className="py-0" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
