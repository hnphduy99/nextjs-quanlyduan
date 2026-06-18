"use server";

import { logActivity } from "@/lib/audit-logger";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

/**
 * Server Action gửi mail nhắc nhở thủ công tới người tạo dự án
 * Chỉ cho phép vai trò PM và ADMIN thực hiện.
 */
export async function sendManualReminder(projectId: string): Promise<{ success?: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Bạn chưa đăng nhập" };
  }

  // Phân quyền: Chỉ PM và ADMIN mới được gửi nhắc nhở
  if (currentUser.role !== "ADMIN" && currentUser.role !== "PM") {
    return {
      error:
        "Bạn không có quyền thực hiện hành động này. Chỉ Quản lý (PM) hoặc Quản trị viên (ADMIN) mới có quyền gửi nhắc nhở."
    };
  }

  try {
    // Lấy thông tin dự án và người tạo
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        steps: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!project) {
      return { error: "Không tìm thấy dự án" };
    }

    const currentStep = project.steps.find((s) => s.stepOrder === project.currentStepOrder);
    if (!currentStep) {
      return { error: "Không xác định được bước hiện tại của dự án" };
    }

    const now = new Date();
    const endDate = currentStep.endDate ? new Date(currentStep.endDate) : null;
    const isOverdue = endDate && endDate < now && project.percentage < 100;

    if (!isOverdue) {
      return { error: "Dự án hiện tại không trong trạng thái trễ hạn" };
    }

    const diffTime = now.getTime() - endDate.getTime();
    const overdueDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const projectUrl = `${baseUrl}/projects/${project.id}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #f0ad4e; margin-top: 0;">🔔 Nhắc Nhở Xử Lý Dự Án Trễ Hạn</h2>
        <p>Xin chào <strong>${project.createdBy.name}</strong>,</p>
        <p>Bạn nhận được yêu cầu nhắc nhở từ <strong>${currentUser.name}</strong> (${currentUser.role}) yêu cầu đẩy nhanh tiến độ dự án đang bị trễ hạn:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 150px;">Tên dự án:</td>
            <td style="padding: 8px 0;">${project.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Bước hiện tại:</td>
            <td style="padding: 8px 0;">${currentStep.stepName} (Bước ${project.currentStepOrder}/4)</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Hạn hoàn thành bước:</td>
            <td style="padding: 8px 0; color: #d9534f;">${endDate.toLocaleDateString("vi-VN")}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Số ngày trễ hạn:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #d9534f;">${overdueDays} ngày</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Người nhắc nhở:</td>
            <td style="padding: 8px 0;">${currentUser.name} (${currentUser.role === "ADMIN" ? "Quản trị viên" : "Quản lý"})</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">Vui lòng truy cập hệ thống sớm nhất có thể để xử lý và cập nhật kết quả tiến độ.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${projectUrl}" style="background-color: #f0ad4e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Truy Cập Chi Tiết Dự Án</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777777; text-align: center;">Email được gửi thủ công từ trang Quản lý Dự án CRM bởi người quản lý.</p>
      </div>
    `;

    // Thực hiện gửi email
    const emailResult = await sendEmail({
      to: project.createdBy.email,
      subject: `[Nhắc nhở xử lý] Dự án: ${project.name} - Trễ hạn ${overdueDays} ngày`,
      html: htmlContent
    });

    // Lưu lịch sử thông báo
    await prisma.notification.create({
      data: {
        projectId: project.id,
        recipientId: project.createdBy.id,
        type: "MANUAL_REMINDER",
        status: emailResult.success ? "SUCCESS" : "FAILED",
        errorMessage: emailResult.error || null,
        overdueDays: overdueDays,
        stepName: currentStep.stepName
      }
    });

    // Ghi nhận nhật ký hoạt động hệ thống
    await logActivity(currentUser.id, "SEND_EMAIL_REMINDER", {
      projectId: project.id,
      projectName: project.name,
      recipientEmail: project.createdBy.email,
      recipientName: project.createdBy.name,
      overdueDays: overdueDays,
      status: emailResult.success ? "SUCCESS" : "FAILED"
    });

    if (!emailResult.success) {
      return { error: `Gửi mail thất bại: ${emailResult.error}` };
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi trong server action sendManualReminder:", error);
    return { error: error?.message || "Có lỗi xảy ra khi gửi email nhắc nhở" };
  }
}

/**
 * Lấy lịch sử thông báo nhắc nhở/cảnh báo của một dự án cụ thể
 */
export async function getProjectNotifications(projectId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Chưa đăng nhập");
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { projectId },
      orderBy: { sentAt: "desc" }
    });
    return notifications;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách thông báo của dự án:", error);
    throw new Error("Không thể lấy lịch sử thông báo");
  }
}

interface GetNotificationsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
}

/**
 * Lấy danh sách toàn bộ thông báo hệ thống với phân trang và tìm kiếm (chỉ Admin)
 */
export async function getNotifications(params: GetNotificationsParams = {}) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "PM")) {
    throw new Error("Không có quyền truy cập");
  }

  const page = params.page || 1;
  const limit = params.limit || 10;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.search) {
    where.OR = [
      {
        project: {
          name: {
            contains: params.search
          }
        }
      },
      {
        recipient: {
          name: {
            contains: params.search
          }
        }
      },
      {
        recipient: {
          email: {
            contains: params.search
          }
        }
      }
    ];
  }

  if (params.type && params.type !== "all") {
    where.type = params.type;
  }

  if (params.status && params.status !== "all") {
    where.status = params.status;
  }

  try {
    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              percentage: true,
              currentStepOrder: true
            }
          },
          recipient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { sentAt: "desc" },
        skip,
        take: limit
      }),
      prisma.notification.count({ where })
    ]);

    return {
      notifications,
      totalCount
    };
  } catch (error) {
    console.error("Lỗi khi lấy danh sách thông báo:", error);
    throw new Error("Không thể lấy danh sách thông báo");
  }
}

/**
 * Gửi lại một thông báo nhắc nhở/cảnh báo (chỉ Admin)
 */
export async function resendNotification(notificationId: string): Promise<{ success?: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "PM")) {
    return {
      error:
        "Bạn không có quyền thực hiện hành động này. Chỉ Quản lý (PM) hoặc Quản trị viên (ADMIN) mới có quyền gửi lại nhắc nhở."
    };
  }

  try {
    const originalNotification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        project: {
          include: {
            steps: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!originalNotification) {
      return { error: "Không tìm thấy thông tin thông báo gốc" };
    }

    const project = originalNotification.project;
    if (!project) {
      return { error: "Dự án liên quan không tồn tại hoặc đã bị xóa" };
    }

    if (project.percentage === 100) {
      return { error: "Dự án này đã hoàn thành, không thể gửi lại nhắc nhở" };
    }

    const currentStep = project.steps.find((s) => s.stepOrder === project.currentStepOrder);
    if (!currentStep) {
      return { error: "Không xác định được bước hiện tại của dự án" };
    }

    const now = new Date();
    const endDate = currentStep.endDate ? new Date(currentStep.endDate) : null;
    const isOverdue = endDate && endDate < now && project.percentage < 100;

    if (!isOverdue) {
      return { error: "Dự án hiện tại không trong trạng thái trễ hạn" };
    }

    const diffTime = now.getTime() - endDate.getTime();
    const overdueDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const projectUrl = `${baseUrl}/projects/${project.id}`;

    let htmlContent = "";
    let subject = "";

    if (originalNotification.type === "AUTO_OVERDUE") {
      subject = `[Cảnh báo trễ hạn] Dự án: ${project.name} (Gửi lại bởi Admin)`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #d9534f; margin-top: 0;">⚠️ Cảnh Báo Trễ Hạn Dự Án (Gửi lại)</h2>
          <p>Xin chào <strong>${project.createdBy.name}</strong>,</p>
          <p>Đây là email gửi lại cảnh báo từ Quản trị viên hệ thống về việc dự án của bạn đang bị trễ hạn xử lý:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 150px;">Tên dự án:</td>
              <td style="padding: 8px 0;">${project.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Bước hiện tại:</td>
              <td style="padding: 8px 0;">${currentStep.stepName} (Bước ${project.currentStepOrder}/${project.steps.length})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Hạn hoàn thành bước:</td>
              <td style="padding: 8px 0; color: #d9534f;">${endDate.toLocaleDateString("vi-VN")}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Số ngày trễ hạn:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #d9534f;">${overdueDays} ngày</td>
            </tr>
          </table>
          <p style="margin-top: 20px;">Vui lòng truy cập hệ thống sớm nhất có thể để xử lý và cập nhật kết quả tiến độ.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${projectUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Xem Chi Tiết Dự Án</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #777777; text-align: center;">Đây là email gửi lại tự động từ hệ thống Quản lý Dự án CRM theo yêu cầu của Quản trị viên.</p>
        </div>
      `;
    } else {
      subject = `[Nhắc nhở xử lý] Dự án: ${project.name} - Trễ hạn ${overdueDays} ngày (Gửi lại bởi Admin)`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #f0ad4e; margin-top: 0;">🔔 Nhắc Nhở Xử Lý Dự Án Trễ Hạn (Gửi lại)</h2>
          <p>Xin chào <strong>${project.createdBy.name}</strong>,</p>
          <p>Quản trị viên <strong>${currentUser.name}</strong> đã gửi lại nhắc nhở yêu cầu bạn đẩy nhanh tiến độ dự án đang bị trễ hạn:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 150px;">Tên dự án:</td>
              <td style="padding: 8px 0;">${project.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Bước hiện tại:</td>
              <td style="padding: 8px 0;">${currentStep.stepName} (Bước ${project.currentStepOrder}/${project.steps.length})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Hạn hoàn thành bước:</td>
              <td style="padding: 8px 0; color: #d9534f;">${endDate.toLocaleDateString("vi-VN")}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Số ngày trễ hạn:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #d9534f;">${overdueDays} ngày</td>
            </tr>
          </table>
          <p style="margin-top: 20px;">Vui lòng truy cập hệ thống sớm nhất có thể để xử lý và cập nhật kết quả tiến độ.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${projectUrl}" style="background-color: #f0ad4e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Truy Cập Chi Tiết Dự Án</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #777777; text-align: center;">Email được gửi thủ công từ trang Quản lý Thông báo CRM bởi Quản trị viên.</p>
        </div>
      `;
    }

    const emailResult = await sendEmail({
      to: project.createdBy.email,
      subject,
      html: htmlContent
    });

    await prisma.notification.create({
      data: {
        projectId: project.id,
        recipientId: project.createdBy.id,
        type: originalNotification.type,
        status: emailResult.success ? "SUCCESS" : "FAILED",
        errorMessage: emailResult.error || null,
        overdueDays: overdueDays,
        stepName: currentStep.stepName
      }
    });

    await logActivity(currentUser.id, "RESEND_EMAIL_REMINDER", {
      originalNotificationId: notificationId,
      projectId: project.id,
      projectName: project.name,
      recipientEmail: project.createdBy.email,
      status: emailResult.success ? "SUCCESS" : "FAILED"
    });

    if (!emailResult.success) {
      return { error: `Gửi lại mail thất bại: ${emailResult.error}` };
    }

    revalidatePath("/notifications");
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi trong server action resendNotification:", error);
    return { error: error?.message || "Có lỗi xảy ra khi gửi lại email nhắc nhở" };
  }
}
