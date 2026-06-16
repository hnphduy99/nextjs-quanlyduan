"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/audit-logger";
import { mkdir, writeFile } from "fs/promises";
import { revalidatePath } from "next/cache";
import path from "path";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadProjectFile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Chưa đăng nhập" };

  const file = formData.get("file") as File;
  const projectId = formData.get("projectId") as string;
  const stepOrder = parseInt(formData.get("stepOrder") as string, 10);

  if (!file || !projectId || isNaN(stepOrder)) {
    return { error: "Thiếu thông tin upload" };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Định dạng file không được hỗ trợ" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "File quá lớn (tối đa 10MB)" };
  }

  try {
    // Tạo thư mục lưu file
    const uploadDir = path.join(process.cwd(), "public", "uploads", projectId);
    await mkdir(uploadDir, { recursive: true });

    // Tạo tên file unique
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `step${stepOrder}_${timestamp}_${safeName}`;
    const filePath = path.join(uploadDir, uniqueName);

    // Ghi file
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Lưu DB
    const publicPath = `/uploads/${projectId}/${uniqueName}`;
    await prisma.projectFile.create({
      data: {
        projectId,
        stepOrder,
        fileName: file.name,
        filePath: publicPath,
        fileType: file.type,
        fileSize: file.size,
        uploadedById: user.id
      }
    });

    revalidatePath(`/projects/${projectId}`);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true }
    });

    await logActivity(user.id, "UPLOAD_FILE", {
      projectId,
      projectName: project?.name,
      fileName: file.name,
      stepOrder
    });

    return { success: true, filePath: publicPath };
  } catch (error) {
    console.error("Upload error:", error);
    return { error: "Có lỗi xảy ra khi upload file" };
  }
}

export async function deleteProjectFile(fileId: string, projectId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Chưa đăng nhập" };

  try {
    const file = await prisma.projectFile.findUnique({ where: { id: fileId } });
    if (!file) return { error: "File không tồn tại" };

    // Xóa file vật lý
    const { unlink } = await import("fs/promises");
    const physicalPath = path.join(process.cwd(), "public", file.filePath);
    try {
      await unlink(physicalPath);
    } catch {
      // File có thể đã bị xóa
    }

    await prisma.projectFile.delete({ where: { id: fileId } });
    revalidatePath(`/projects/${projectId}`);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true }
    });

    await logActivity(user.id, "DELETE_FILE", {
      projectId,
      projectName: project?.name,
      fileName: file.fileName,
      fileId
    });

    return { success: true };
  } catch {
    return { error: "Có lỗi xảy ra khi xóa file" };
  }
}

export async function getProjectFiles(projectId: string) {
  return prisma.projectFile.findMany({
    where: { projectId },
    orderBy: [{ stepOrder: "asc" }, { createdAt: "desc" }]
  });
}
