import { prisma } from "@/lib/db";
import { headers } from "next/headers";

/**
 * Ghi nhận hoạt động của người dùng vào cơ sở dữ liệu
 * @param userId ID của người dùng thực hiện hành động
 * @param action Tên hành động (e.g. LOGIN, CREATE_PROJECT, etc.)
 * @param details Thông tin chi tiết (chuỗi text hoặc object)
 */
export async function logActivity(userId: string, action: string, details?: string | Record<string, any>) {
  try {
    let detailsStr: string | null = null;
    if (details) {
      detailsStr = typeof details === "string" ? details : JSON.stringify(details);
    }

    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    try {
      const headerList = await headers();
      const forwardedFor = headerList.get("x-forwarded-for");
      if (forwardedFor) {
        ipAddress = forwardedFor.split(",")[0].trim();
      } else {
        ipAddress = headerList.get("x-real-ip");
      }
      userAgent = headerList.get("user-agent");
    } catch {
      // Bỏ qua lỗi nếu hàm được gọi ngoài request context (ví dụ lúc build hoặc background jobs)
    }

    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details: detailsStr,
        ipAddress,
        userAgent
      }
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
