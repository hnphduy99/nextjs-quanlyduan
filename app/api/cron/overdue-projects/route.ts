import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  return handleRequest(request);
}

export async function GET(request: Request) {
  return handleRequest(request);
}

async function handleRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET is not configured in environment variables.");
    return new NextResponse(JSON.stringify({ error: "CRON_SECRET is not configured on the server" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Lấy token từ header Authorization
  const authHeader = request.headers.get("authorization");
  const token = authHeader ? authHeader.replace("Bearer ", "") : null;

  if (token !== cronSecret) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const now = new Date();

    // 1. Tìm các dự án chưa hoàn thành (percentage < 100)
    const activeProjects = await prisma.project.findMany({
      where: {
        percentage: {
          lt: 100
        }
      },
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

    const results = [];

    for (const project of activeProjects) {
      // Tìm bước hiện tại của dự án
      const currentStep = project.steps.find((s) => s.stepOrder === project.currentStepOrder);

      // Dự án trễ hạn khi bước hiện tại có endDate và endDate < now
      if (currentStep?.endDate && new Date(currentStep.endDate) < now) {
        const endDate = new Date(currentStep.endDate);
        const diffTime = now.getTime() - endDate.getTime();
        const overdueDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

        // 2. Kiểm tra chống spam: Không gửi mail tự động cho dự án này trong 24 giờ qua
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const recentNotification = await prisma.notification.findFirst({
          where: {
            projectId: project.id,
            type: "AUTO_OVERDUE",
            sentAt: {
              gte: dayAgo
            }
          }
        });

        if (recentNotification) {
          results.push({
            projectId: project.id,
            projectName: project.name,
            status: "SKIPPED",
            reason: "Already notified within the last 24 hours"
          });
          continue;
        }

        // 3. Gửi email cảnh báo
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const projectUrl = `${baseUrl}/projects/${project.id}`;

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #d9534f; margin-top: 0;">⚠️ Cảnh Báo Trễ Hạn Dự Án</h2>
            <p>Xin chào <strong>${project.createdBy.name}</strong>,</p>
            <p>Hệ thống ghi nhận dự án do bạn tạo đang bị trễ hạn xử lý:</p>
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
                <td style="padding: 8px 0; color: #d9534f;">${new Date(currentStep.endDate).toLocaleDateString("vi-VN")}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Số ngày trễ hạn:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #d9534f;">${overdueDays} ngày</td>
              </tr>
            </table>
            <p style="margin-top: 20px;">Vui lòng truy cập hệ thống để cập nhật tiến độ xử lý của dự án.</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${projectUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Xem Chi Tiết Dự Án</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #777777; text-align: center;">Đây là email tự động từ hệ thống Quản lý Dự án CRM. Vui lòng không trả lời email này.</p>
          </div>
        `;

        const emailResult = await sendEmail({
          to: project.createdBy.email,
          subject: `[Cảnh báo trễ hạn] Dự án: ${project.name}`,
          html: htmlContent
        });

        // 4. Lưu lại lịch sử thông báo
        await prisma.notification.create({
          data: {
            projectId: project.id,
            recipientId: project.createdBy.id,
            type: "AUTO_OVERDUE",
            status: emailResult.success ? "SUCCESS" : "FAILED",
            errorMessage: emailResult.error || null,
            overdueDays: overdueDays,
            stepName: currentStep.stepName
          }
        });

        results.push({
          projectId: project.id,
          projectName: project.name,
          recipient: project.createdBy.email,
          status: emailResult.success ? "SENT" : "FAILED",
          error: emailResult.error || null
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedAt: now.toISOString(),
      results
    });
  } catch (error: any) {
    console.error("Lỗi khi chạy cron job overdue checking:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error", details: error?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
