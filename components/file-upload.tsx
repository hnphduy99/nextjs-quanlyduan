"use client";

import { deleteProjectFile, uploadProjectFile } from "@/actions/upload";
import { cn } from "@/lib/utils";
import { Eye, FileImage, FileSpreadsheet, FileText, Loader2, Presentation, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface ProjectFile {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  createdAt: Date;
}

interface FileUploadProps {
  projectId: string;
  stepOrder: number;
  existingFiles?: ProjectFile[];
}

const ALLOWED_EXTENSIONS = ".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
const MAX_SIZE_MB = 10;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return <FileImage className="h-4 w-4 text-sky-400" />;
  if (fileType === "application/pdf") return <FileText className="h-4 w-4 text-rose-400" />;
  if (fileType.includes("spreadsheet") || fileType.includes("excel"))
    return <FileSpreadsheet className="h-4 w-4 text-emerald-400" />;
  if (fileType.includes("presentation") || fileType.includes("powerpoint"))
    return <Presentation className="h-4 w-4 text-amber-400" />;
  return <FileText className="h-4 w-4 text-(--color-text-muted)" />;
}

export function FileUpload({ projectId, stepOrder, existingFiles = [] }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>(existingFiles);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File quá lớn! Tối đa ${MAX_SIZE_MB}MB`);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("projectId", projectId);
      formData.set("stepOrder", String(stepOrder));

      const result = await uploadProjectFile(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Upload file thành công!");
        // Optimistic update — reload sẽ fetch lại từ server
        setFiles((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            fileName: file.name,
            filePath: result.filePath!,
            fileType: file.type,
            fileSize: file.size,
            createdAt: new Date()
          }
        ]);
      }
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (fileId: string) => {
    setDeletingId(fileId);
    try {
      const result = await deleteProjectFile(fileId, projectId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã xóa file");
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 transition-all duration-200",
          isDragging
            ? "bg-primary/5 border-(--color-primary)"
            : "hover:border-primary/50 border-(--color-border) hover:bg-(--color-surface)"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleUpload(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-(--color-primary)" />
            <p className="text-sm text-(--color-text-muted)">Đang upload...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-center">
            <Upload className="h-6 w-6 text-(--color-text-muted)" />
            <p className="text-sm font-medium text-(--color-text)">Kéo thả hoặc click để upload</p>
            <p className="text-xs text-(--color-text-muted)">
              Hỗ trợ: ảnh, PDF, Word, Excel, PowerPoint (tối đa {MAX_SIZE_MB}MB)
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS}
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="group hover:border-primary/30 border-border flex items-center gap-3 rounded-lg border bg-(--color-surface) px-3 py-2.5 transition-all"
            >
              <div className="shrink-0">{getFileIcon(file.fileType)}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.fileName}</p>
                <p className="text-muted-foreground text-xs">{formatFileSize(file.fileSize)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <a
                  href={file.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-(--color-surface-elevated)"
                >
                  <Eye className="text-muted-foreground h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(file.id)}
                  disabled={deletingId === file.id}
                  className="hover:bg-destructive/10 hover:text-destructive flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:opacity-50"
                >
                  {deletingId === file.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
