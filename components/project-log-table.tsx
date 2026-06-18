import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ArrowRight, FileImage, FileSpreadsheet, FileText, Presentation } from "lucide-react";

interface LogEntry {
  id: string;
  oldStep: number;
  newStep: number;
  oldPercentage: number;
  newPercentage: number;
  note: string | null;
  nextPlan?: string | null;
  changedAt: Date;
  updatedBy: { id: string; name: string; email: string; role: string };
}

interface ProjectFile {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  stepOrder: number;
  createdAt: Date;
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return <FileImage className="h-4 w-4 text-sky-400" />;
  if (fileType === "application/pdf") return <FileText className="h-4 w-4 text-rose-400" />;
  if (fileType.includes("spreadsheet") || fileType.includes("excel"))
    return <FileSpreadsheet className="h-4 w-4 text-emerald-400" />;
  if (fileType.includes("presentation") || fileType.includes("powerpoint"))
    return <Presentation className="h-4 w-4 text-amber-400" />;
  return <FileText className="text-muted-foreground h-4 w-4" />;
}

export function ProjectLogTable({ logs, files = [] }: { logs: LogEntry[]; files?: ProjectFile[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12">
        <p className="text-sm">Chưa có lịch sử cập nhật</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        // Lấy tất cả file thuộc bước mới của log này
        const stepFiles = files.filter((f) => f.stepOrder === log.newStep);

        return (
          <div
            key={log.id}
            className="border-border rounded-xl border bg-(--color-surface) p-4 transition-colors hover:bg-(--color-surface-elevated)"
          >
            <div className="flex flex-wrap items-center gap-4">
              {/* User */}
              <div className="flex shrink-0 items-center gap-2">
                <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-full">
                  <span className="text-primary text-xs font-medium">{log.updatedBy.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{log.updatedBy.name}</p>
                </div>
              </div>

              {/* Step + % */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-xs">
                    B{log.oldStep}
                  </Badge>
                  <ArrowRight className="text-muted-foreground h-3 w-3" />
                  <Badge variant={log.newStep > log.oldStep ? "default" : "secondary"} className="text-xs">
                    B{log.newStep}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-muted-foreground">{log.oldPercentage}%</span>
                  <ArrowRight className="text-muted-foreground h-3 w-3" />
                  <span
                    className={`font-bold ${
                      log.newPercentage === 100
                        ? "text-emerald-400"
                        : log.newPercentage > log.oldPercentage
                          ? "text-(--color-primary)"
                          : ""
                    }`}
                  >
                    {log.newPercentage}%
                  </span>
                </div>
              </div>

              {/* Date */}
              <div className="text-muted-foreground ml-auto shrink-0 text-xs">{formatDate(log.changedAt)}</div>
            </div>

            {/* Note */}
            {log.note && (
              <div className="border-border mt-3 border-t pt-3">
                <p className="mb-1 text-xs font-medium tracking-wider uppercase">Kết quả triển khai</p>
                <p className="text-sm">{log.note}</p>
              </div>
            )}

            {/* Next Plan */}
            {log.nextPlan && (
              <div className="mt-2 flex gap-2">
                <div>
                  <p className="text-xs font-medium uppercase">Kế hoạch tiếp theo</p>
                  <p className="text-sm">{log.nextPlan}</p>
                </div>
              </div>
            )}

            {/* Files associated with this step */}
            {stepFiles.length > 0 && (
              <div className="border-border mt-3 border-t pt-3">
                <p className="mb-2 text-xs font-medium tracking-wider uppercase">Tài liệu đính kèm</p>
                <div className="flex flex-wrap gap-2">
                  {stepFiles.map((file) => (
                    <a
                      key={file.id}
                      href={file.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:border-primary/45 border-border flex items-center gap-2 rounded-lg border bg-(--color-surface-elevated) px-3 py-1.5 text-xs font-medium transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      {getFileIcon(file.fileType)}
                      <span className="max-w-50 truncate">{file.fileName}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
