"use server";

import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcPercentageByStep, DEFAULT_STEPS } from "@/lib/project-constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// === ZOD SCHEMAS ===

const StepDateSchema = z.object({
  stepOrder: z.number().int().positive(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

const CreateProjectSchema = z.object({
  name: z.string().min(1, "Tên dự án không được trống").max(200),
  description: z.string().optional(),
  category: z.enum(["GPS_AN_NINH", "KHCP_DN", "GIAO_TIEP_CAN"]).default("GPS_AN_NINH"),
  investor: z.string().optional(),
  expectedRevenue: z.number().optional(),
  decisionMaker: z.string().optional(),
  contactPerson: z.string().optional(),
  deploymentType: z.enum(["MUA", "THUE"]).default("MUA"),
  feasibilityScore: z.number().int().min(0).max(100).optional(),
  expectedCompletionDate: z.string().optional(),
  stepDates: z.array(StepDateSchema).optional()
});

const UpdateProgressSchema = z.object({
  projectId: z.string().min(1),
  newStepOrder: z.number().int().positive(),
  note: z.string().optional(),
  nextPlan: z.string().optional()
});

// === SERVER ACTIONS ===

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

/**
 * Tạo dự án mới với 4 bước cố định
 */
export async function createProject(data: CreateProjectInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Chưa đăng nhập" };

  try {
    const validated = CreateProjectSchema.parse(data);

    await prisma.project.create({
      data: {
        name: validated.name,
        description: validated.description,
        category: validated.category,
        investor: validated.investor,
        expectedRevenue: validated.expectedRevenue,
        decisionMaker: validated.decisionMaker,
        contactPerson: validated.contactPerson,
        deploymentType: validated.deploymentType,
        feasibilityScore: validated.feasibilityScore,
        expectedCompletionDate: validated.expectedCompletionDate
          ? new Date(validated.expectedCompletionDate)
          : undefined,
        currentStepOrder: 1,
        percentage: 0,
        createdById: user.id,
        steps: {
          create: DEFAULT_STEPS.map((step) => {
            const dates = validated.stepDates?.find((d) => d.stepOrder === step.stepOrder);
            return {
              stepName: step.stepName,
              stepOrder: step.stepOrder,
              startDate: dates?.startDate ? new Date(dates.startDate) : undefined,
              endDate: dates?.endDate ? new Date(dates.endDate) : undefined
            };
          })
        }
      }
    });

    revalidatePath("/projects");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0].message };
    console.error("createProject error:", error);
    return { error: "Có lỗi xảy ra khi tạo dự án" };
  }
}

/**
 * Cập nhật tiến độ dự án — % tự tính theo bước
 */
export async function updateProjectProgress(data: {
  projectId: string;
  newStepOrder: number;
  note?: string;
  nextPlan?: string;
}): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Chưa đăng nhập" };

  try {
    const validated = UpdateProgressSchema.parse(data);

    const project = await prisma.project.findUnique({
      where: { id: validated.projectId },
      include: { steps: { orderBy: { stepOrder: "asc" } } }
    });

    if (!project) return { error: "Không tìm thấy dự án" };

    const isOwner = project.createdById === user.id;
    if (!hasPermission(user.role, "update", isOwner)) {
      return { error: "Bạn không có quyền cập nhật dự án này" };
    }

    const stepExists = project.steps.some((s) => s.stepOrder === validated.newStepOrder);
    if (!stepExists) return { error: "Bước không hợp lệ" };

    // Không được lùi bước
    if (validated.newStepOrder < project.currentStepOrder) {
      return {
        error: `Không được nhập lùi bước! Bước hiện tại: ${project.currentStepOrder}`
      };
    }

    // % tự tính theo bước
    const totalSteps = project.steps.length;
    const newPercentage = calcPercentageByStep(validated.newStepOrder, totalSteps);

    await prisma.$transaction([
      prisma.project.update({
        where: { id: validated.projectId },
        data: {
          currentStepOrder: validated.newStepOrder,
          percentage: newPercentage
        }
      }),
      prisma.projectLog.create({
        data: {
          projectId: validated.projectId,
          updatedById: user.id,
          oldStep: project.currentStepOrder,
          newStep: validated.newStepOrder,
          oldPercentage: project.percentage,
          newPercentage,
          note: validated.note,
          nextPlan: validated.nextPlan
        }
      })
    ]);

    revalidatePath(`/projects/${validated.projectId}`);
    revalidatePath("/projects");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0].message };
    console.error("updateProjectProgress error:", error);
    return { error: "Có lỗi xảy ra khi cập nhật tiến độ" };
  }
}

/**
 * Xóa dự án — Chỉ ADMIN và PM được xóa
 */
export async function deleteProject(projectId: string): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Chưa đăng nhập" };

  if (!hasPermission(user.role, "delete")) {
    return { error: "Bạn không có quyền xóa dự án" };
  }

  try {
    await prisma.project.delete({ where: { id: projectId } });
    revalidatePath("/projects");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Có lỗi xảy ra khi xóa dự án" };
  }
}

/**
 * Lấy danh sách dự án theo quyền
 */
export async function getProjects() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const where = user.role === "ADMIN" || user.role === "PM" ? {} : { createdById: user.id };

  return prisma.project.findMany({
    where,
    include: {
      steps: { orderBy: { stepOrder: "asc" } },
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      _count: { select: { logs: true, files: true } }
    },
    orderBy: [{ createdAt: "desc" }]
  });
}

/**
 * Lấy chi tiết dự án với steps, logs và files
 */
export async function getProjectById(projectId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      steps: { orderBy: { stepOrder: "asc" } },
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      logs: {
        include: {
          updatedBy: { select: { id: true, name: true, email: true, role: true } }
        },
        orderBy: { changedAt: "desc" }
      },
      files: {
        orderBy: [{ stepOrder: "asc" }, { createdAt: "desc" }]
      }
    }
  });

  if (!project) return null;

  const isOwner = project.createdById === user.id;
  if (!hasPermission(user.role, "read", isOwner)) return null;

  return project;
}

/**
 * Lấy dữ liệu Dashboard nâng cao
 * - Thống kê theo ngày / theo nhân sự
 * - Danh sách dự án quá hạn
 * - Phân bố dự án theo từng bước
 */
export async function getDashboardStats(filters?: { userId?: string; dateFrom?: string; dateTo?: string }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isManager = user.role === "ADMIN" || user.role === "PM";

  // Xây dựng where clause
  let projectWhere: Record<string, unknown> = isManager ? {} : { createdById: user.id };

  // Lọc theo nhân sự (chỉ manager mới lọc được)
  if (isManager && filters?.userId) {
    projectWhere = { ...projectWhere, createdById: filters.userId };
  }

  // Lọc theo ngày tạo
  if (filters?.dateFrom || filters?.dateTo) {
    projectWhere.createdAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo + "T23:59:59") } : {})
    };
  }

  const now = new Date();

  const [
    totalProjects,
    completedProjects,
    inProgressProjects,
    notStartedProjects,
    totalLogs,
    recentLogs,
    projectsByProgress,
    recentProjects,
    overdueProjects,
    stepDistribution,
    allUsers
  ] = await Promise.all([
    prisma.project.count({ where: projectWhere }),
    prisma.project.count({ where: { ...projectWhere, percentage: 100 } }),
    prisma.project.count({ where: { ...projectWhere, percentage: { gt: 0, lt: 100 } } }),
    prisma.project.count({ where: { ...projectWhere, percentage: 0 } }),
    prisma.projectLog.count({
      where: isManager
        ? filters?.userId
          ? { project: { createdById: filters.userId } }
          : {}
        : { project: { createdById: user.id } }
    }),

    // 8 hoạt động gần nhất
    prisma.projectLog.findMany({
      where: isManager
        ? filters?.userId
          ? { project: { createdById: filters.userId } }
          : {}
        : { project: { createdById: user.id } },
      include: {
        project: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } }
      },
      orderBy: { changedAt: "desc" },
      take: 8
    }),

    // Tất cả dự án sắp xếp theo bước cao → thấp
    prisma.project.findMany({
      where: projectWhere,
      select: { id: true, name: true, percentage: true, currentStepOrder: true },
      orderBy: [{ currentStepOrder: "desc" }, { percentage: "desc" }]
    }),

    // 5 dự án mới nhất
    prisma.project.findMany({
      where: projectWhere,
      include: {
        createdBy: { select: { name: true } },
        steps: { orderBy: { stepOrder: "asc" } }
      },
      orderBy: [{ currentStepOrder: "desc" }, { createdAt: "desc" }],
      take: 5
    }),

    // Dự án quá hạn: lấy tất cả đang thực hiện, filter ở app level
    prisma.project.findMany({
      where: { ...projectWhere, percentage: { lt: 100 } },
      include: {
        createdBy: { select: { name: true } },
        steps: { orderBy: { stepOrder: "asc" } }
      },
      orderBy: { currentStepOrder: "desc" }
    }),

    // Đếm số dự án theo từng bước
    prisma.project.groupBy({
      by: ["currentStepOrder"],
      where: { ...projectWhere, percentage: { lt: 100 } },
      _count: { id: true },
      orderBy: { currentStepOrder: "asc" }
    }),

    // Danh sách user để lọc (chỉ manager)
    isManager
      ? prisma.user.findMany({
          where: {
            role: {
              not: "ADMIN"
            }
          },
          select: { id: true, name: true },
          orderBy: { name: "asc" }
        })
      : Promise.resolve([])
  ]);

  const avgCompletion =
    totalProjects === 0 ? 0 : Math.round(projectsByProgress.reduce((sum, p) => sum + p.percentage, 0) / totalProjects);

  // Filter overdue ở app level (tránh Prisma relation filter với field mới)
  const overdueFiltered = overdueProjects.filter((p) => {
    const currentStep = p.steps.find((s) => s.stepOrder === p.currentStepOrder);
    return currentStep?.endDate && currentStep.endDate < now;
  });

  return {
    user,
    kpis: { totalProjects, completedProjects, inProgressProjects, notStartedProjects, totalLogs, avgCompletion },
    recentLogs,
    projectsByProgress,
    recentProjects,
    overdueProjects: overdueFiltered,
    stepDistribution,
    allUsers
  };
}
