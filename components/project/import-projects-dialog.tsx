"use client";

import { importProjects } from "@/actions/project";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface ImportProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportResult {
  success?: boolean;
  successCount?: number;
  errorCount?: number;
  errorReportBase64?: string;
  error?: string;
}

export function ImportProjectsDialog({ open, onOpenChange }: ImportProjectsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setIsDragging(false);
    setLoading(false);
    setResult(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validExtensions = [".xlsx", ".xls"];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      toast.error("Vui lòng chọn file Excel đúng định dạng (.xlsx, .xls)");
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await importProjects(formData);
      setResult(response);

      if (response.success) {
        const errCount = response.errorCount || 0;
        const succCount = response.successCount || 0;
        if (errCount > 0) {
          toast.warning(`Import hoàn thành với một số lỗi: ${succCount} thành công, ${errCount} thất bại`);
        } else {
          toast.success(`Import thành công ${succCount} dự án!`);
        }
      } else {
        toast.error(response.error || "Có lỗi xảy ra trong quá trình import");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadErrors = () => {
    if (!result?.errorReportBase64) return;
    try {
      const link = document.createElement("a");
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.errorReportBase64}`;
      link.download = "bao_cao_loi_import.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Đã tải xuống báo cáo lỗi");
    } catch {
      toast.error("Không thể tải file báo cáo lỗi");
    }
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          handleClose();
        } else {
          onOpenChange(val);
        }
      }}
    >
      <DialogContent>
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold tracking-tight">Import dự án từ Excel</DialogTitle>
          <DialogDescription className="text-muted-foreground flex flex-wrap items-center justify-between gap-1 text-xs">
            <span>Tải lên tệp Excel chứa danh sách các dự án cần khởi tạo</span>
            <a
              href="/import_projects_template.xlsx"
              download="import_projects_template.xlsx"
              className="text-primary cursor-pointer font-medium hover:underline"
            >
              Tải file mẫu Excel
            </a>
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={file ? undefined : handleUploadClick}
              className={cn(
                "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 transition-all duration-200",
                isDragging
                  ? "bg-primary/5 border-primary"
                  : "hover:border-primary/50 border-border hover:bg-(--color-surface)"
              )}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls"
                className="hidden"
                aria-label="Chọn file excel để import"
              />

              {file ? (
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="h-10 w-10 text-emerald-600" />
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-foreground truncate text-sm font-semibold">{file.name}</p>
                      <p className="text-muted-foreground text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-destructive hover:bg-destructive/10 h-8 w-8 cursor-pointer rounded-none"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="text-muted-foreground mb-3 h-8 w-8" />
                  <p className="text-foreground text-sm font-semibold">Kéo thả file vào đây hoặc click để chọn</p>
                  <p className="text-muted-foreground mt-1 text-xs">Định dạng hỗ trợ: .xlsx, .xls</p>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Hủy
              </Button>
              <Button onClick={handleImport} disabled={!file || loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Bắt đầu Import"
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Results View */
          <div className="space-y-4">
            <div className="bg-muted/10 space-y-3 rounded-xl border-2 p-4">
              <h4 className="text-foreground flex items-center gap-1.5 text-sm font-bold">
                {(result.successCount ?? 0) > 0 && (result.errorCount ?? 0) === 0 ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
                )}
                Kết quả xử lý file:
              </h4>

              <div className="grid grid-cols-2 gap-4 py-2 text-center">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <p className="text-2xl font-black text-emerald-500">{result.successCount ?? 0}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs font-semibold">Thành công</p>
                </div>
                <div
                  className={`rounded-lg border p-3 ${(result.errorCount ?? 0) > 0 ? "border-destructive/30 bg-destructive/5" : "border-muted bg-muted/10"}`}
                >
                  <p
                    className={`text-2xl font-black ${(result.errorCount ?? 0) > 0 ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {result.errorCount ?? 0}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs font-semibold">Thất bại</p>
                </div>
              </div>

              {result.error && (
                <div className="text-destructive bg-destructive/10 border-destructive/20 border p-2.5 text-xs">
                  Lỗi hệ thống: {result.error}
                </div>
              )}
            </div>

            {result.errorReportBase64 && (
              <div className="bg-destructive/5 border-destructive/20 flex flex-col items-center justify-between gap-3 border p-3 sm:flex-row">
                <div className="text-muted-foreground text-center text-xs sm:text-left">
                  <p className="text-foreground font-semibold">Phát hiện bản ghi không hợp lệ!</p>
                  <p className="mt-0.5">Tải báo cáo để xem nguyên nhân cụ thể từng dòng.</p>
                </div>
                <Button variant="destructive" onClick={handleDownloadErrors}>
                  <Download className="h-3.5 w-3.5" />
                  Tải file lỗi
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end pt-2">
              <Button onClick={handleClose}>Đóng</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
