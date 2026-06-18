import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { ACTION_META } from "@/constants/logs";
import { PAGINATION_CONFIG } from "@/constants/pagination";
import { formatDate } from "@/lib/utils";
import { Activity, Calendar, Globe, Monitor } from "lucide-react";
import { LogDetails } from "./log-details";
import { LogItem } from "./types";

interface LogsTableProps {
  logs: LogItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  isPending: boolean;
  currentUserId: string;
  onPageChange: (page: number) => void;
}

export function LogsTable({
  logs,
  totalCount,
  currentPage,
  totalPages,
  isPending,
  currentUserId,
  onPageChange
}: LogsTableProps) {
  return (
    <Card className="border-border border bg-(--color-surface) shadow-sm">
      <CardHeader className="border-border border-b p-4">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <Activity className="text-primary h-4.5 w-4.5" />
          Danh sách nhật ký hoạt động ({totalCount})
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
                Array.from({ length: Math.min(logs.length || 5, PAGINATION_CONFIG.DEFAULT_LIMIT) }).map((_, idx) => (
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
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted-foreground py-16 text-center text-sm">
                    Không tìm thấy lịch sử hoạt động nào khớp với bộ lọc
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const meta = ACTION_META[log.action] || {
                    label: log.action,
                    color: "bg-slate-500/10 text-slate-500 border-slate-500/20"
                  };
                  const isSelf = log.userId === currentUserId;
                  return (
                    <tr key={log.id} className="group animate-in transition-colors hover:bg-(--color-surface-elevated)">
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
                      <td className="min-w-70 px-5 py-4">
                        <LogDetails action={log.action} detailsStr={log.details} />
                      </td>

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
                {Math.min((currentPage - 1) * PAGINATION_CONFIG.DEFAULT_LIMIT + 1, totalCount)}
              </span>{" "}
              -{" "}
              <span className="font-semibold">
                {Math.min(currentPage * PAGINATION_CONFIG.DEFAULT_LIMIT, totalCount)}
              </span>{" "}
              trong tổng số <span className="font-semibold">{totalCount}</span> hoạt động
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              className="py-0"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
