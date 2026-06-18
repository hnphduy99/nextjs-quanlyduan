import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { AlertTriangle, BellRing, Calendar, CheckCircle2, Clock, XCircle } from "lucide-react";

interface NotificationEntry {
  id: string;
  projectId: string;
  recipientId: string;
  type: "AUTO_OVERDUE" | "MANUAL_REMINDER";
  sentAt: Date;
  status: string;
  errorMessage: string | null;
  overdueDays: number;
  stepName: string;
}

export function NotificationHistory({ notifications }: { notifications: NotificationEntry[] }) {
  if (notifications.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center py-10">
        <BellRing className="mb-2 h-8 w-8 text-(--color-text-muted) opacity-50" />
        <p className="text-sm">Chưa có lịch sử thông báo nhắc nhở</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notif) => {
        const isAuto = notif.type === "AUTO_OVERDUE";
        const isSuccess = notif.status === "SUCCESS";

        return (
          <div
            key={notif.id}
            className="border-border flex flex-col justify-between gap-4 rounded-xl border bg-(--color-surface) p-4 transition-colors hover:bg-(--color-surface-elevated) sm:flex-row sm:items-center"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className={`mt-0.5 shrink-0 rounded-lg p-2 ${
                  isAuto ? "bg-sky-500/10 text-sky-500" : "bg-amber-500/10 text-amber-500"
                }`}
              >
                {isAuto ? <Clock className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
              </div>

              {/* Details */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={isAuto ? "secondary" : "warning"} className="text-xs font-medium">
                    {isAuto ? "Hệ thống tự động" : "PM/ADMIN nhắc nhở"}
                  </Badge>
                  <span className="text-sm font-semibold text-(--color-text)">Cảnh báo trễ hạn: {notif.stepName}</span>
                </div>

                <p className="flex items-center gap-1.5 text-xs text-(--color-text-muted)">
                  <AlertTriangle className="text-destructive h-3 w-3 shrink-0" />
                  <span>
                    Trễ hạn <strong>{notif.overdueDays} ngày</strong> tại thời điểm gửi
                  </span>
                </p>

                <p className="flex items-center gap-1.5 text-xs text-(--color-text-muted)">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>Thời gian gửi: {formatDate(notif.sentAt)}</span>
                </p>

                {notif.errorMessage && (
                  <p className="text-destructive bg-destructive/10 border-destructive/20 mt-1 rounded border p-1.5 text-xs">
                    <strong>Lỗi:</strong> {notif.errorMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
              <span className="text-xs font-medium text-(--color-text-muted)">Trạng thái:</span>
              <Badge variant={isSuccess ? "success" : "destructive"} className="flex items-center gap-1 text-xs">
                {isSuccess ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Thành công</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    <span>Lỗi gửi</span>
                  </>
                )}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
