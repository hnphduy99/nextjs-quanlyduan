import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { PAGINATION_CONFIG } from "@/constants/pagination";
import { formatDate } from "@/lib/utils";
import { AlertTriangle, Bell, Calendar, Folder, Mail, User } from "lucide-react";
import Link from "next/link";
import { ResendButton } from "./resend-button";
import { NotificationItem } from "./types";

interface NotificationsTableProps {
  notifications: NotificationItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  isPending: boolean;
  onPageChange: (page: number) => void;
}

export function NotificationsTable({
  notifications,
  totalCount,
  currentPage,
  totalPages,
  isPending,
  onPageChange
}: NotificationsTableProps) {
  return (
    <Card className="border-border border bg-(--color-surface) shadow-sm">
      <CardHeader className="border-border border-b p-4">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <Bell className="text-primary h-4.5 w-4.5" />
          Lịch sử thông báo hệ thống ({totalCount})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-200 border-collapse text-left text-sm">
            <thead>
              <tr className="bg-muted/40 text-muted-foreground border-border border-b font-semibold">
                <th className="px-5 py-3.5 text-xs tracking-wider uppercase">Thời gian</th>
                <th className="px-5 py-3.5 text-xs tracking-wider uppercase">Dự án</th>
                <th className="px-5 py-3.5 text-xs tracking-wider uppercase">Người nhận</th>
                <th className="px-5 py-3.5 text-xs tracking-wider uppercase">Bước trễ hạn</th>
                <th className="px-5 py-3.5 text-xs tracking-wider uppercase">Loại & Trạng thái</th>
                <th className="px-5 py-3.5 text-right text-xs tracking-wider uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)">
              {isPending ? (
                Array.from({ length: Math.min(notifications.length || 5, PAGINATION_CONFIG.DEFAULT_LIMIT) }).map(
                  (_, idx) => (
                    <tr key={`skeleton-${idx}`} className="border-border border-b">
                      <td className="px-5 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <Skeleton className="h-3.5 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          <Skeleton className="h-5 w-24 rounded-md" />
                          <Skeleton className="h-5 w-16 rounded-md" />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Skeleton className="ml-auto h-8 w-20 rounded-md" />
                      </td>
                    </tr>
                  )
                )
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted-foreground py-16 text-center text-sm">
                    Không tìm thấy lịch sử thông báo nhắc nhở nào khớp với bộ lọc
                  </td>
                </tr>
              ) : (
                notifications.map((notif) => {
                  const isAuto = notif.type === "AUTO_OVERDUE";
                  const isSuccess = notif.status === "SUCCESS";
                  const isProjectCompleted = notif.project?.percentage === 100;

                  return (
                    <tr
                      key={notif.id}
                      className="group animate-in transition-colors hover:bg-(--color-surface-elevated)"
                    >
                      {/* Time */}
                      <td className="text-muted-foreground px-5 py-4 text-xs whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {formatDate(notif.sentAt)}
                        </span>
                      </td>

                      {/* Project */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <Link
                            href={`/projects/${notif.projectId}`}
                            className="hover:text-primary flex items-center gap-1 text-xs font-semibold text-(--color-text) transition-colors"
                          >
                            <Folder className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                            <span className="line-clamp-1">{notif.project?.name || "Dự án đã xóa"}</span>
                          </Link>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-[10px]">Tiến độ:</span>
                            <Badge
                              variant={isProjectCompleted ? "success" : "default"}
                              className="px-1 py-0 text-[9px] font-medium"
                            >
                              {notif.project?.percentage ?? 0}%
                            </Badge>
                          </div>
                        </div>
                      </td>

                      {/* Recipient */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-xs font-medium">
                            <User className="text-muted-foreground h-3 w-3 shrink-0" />
                            <span>{notif.recipient?.name || "Người dùng đã xóa"}</span>
                          </div>
                          <div className="text-muted-foreground flex items-center gap-1 text-[10px]">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span>{notif.recipient?.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Step & Overdue Days */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <span className="line-clamp-1 block text-xs font-semibold text-(--color-text)">
                            {notif.stepName}
                          </span>
                          <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                            <AlertTriangle className="text-destructive h-3 w-3 shrink-0" />
                            <span>
                              Trễ hạn <strong>{notif.overdueDays} ngày</strong>
                            </span>
                          </span>
                        </div>
                      </td>

                      {/* Type & Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div>
                            <Badge variant={isAuto ? "secondary" : "warning"} className="px-1.5 py-0 text-[10px]">
                              {isAuto ? "Hệ thống tự động" : "PM/ADMIN nhắc"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant={isSuccess ? "success" : "destructive"} className="px-1.5 py-0 text-[10px]">
                              {isSuccess ? "Thành công" : "Thất bại"}
                            </Badge>
                            {notif.errorMessage && (
                              <span
                                className="text-destructive max-w-30 truncate text-[9px]"
                                title={notif.errorMessage}
                              >
                                ({notif.errorMessage})
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <ResendButton notificationId={notif.id} isProjectCompleted={isProjectCompleted} />
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
              trong tổng số <span className="font-semibold">{totalCount}</span> thông báo
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
