"use server";

import { PAGINATION_CONFIG } from "@/constants/pagination";
import { logActivity } from "@/lib/audit-logger";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  headerMapping,
  normalizeKey,
  parseCategory,
  parseDateString,
  parseDeploymentType,
  parseFeasibilityScore,
  parseNumber
} from "@/lib/excel";
import { calcPercentageByStep, DEFAULT_STEPS } from "@/lib/project-constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as xlsx from "xlsx";
import { z } from "zod";

// === ZOD SCHEMAS ===

const StepDateSchema = z.object({
  stepOrder: z.number().int().positive(),
  startDate: z.string().min(1, "Ngày bắt đầu không được để trống"),
  endDate: z.string().min(1, "Ngày kết thúc không được để trống")
});

const CreateProjectSchema = z.object({
  name: z.string().min(1, "Tên dự án không được trống").max(200),
  description: z.string().optional(),
  category: z.enum(["GPS_AN_NINH", "KHCP_DN", "GIAO_TIEP_CAN"]),
  investor: z.string().min(1, "Chủ đầu tư không được trống"),
  expectedRevenue: z.number().min(1, "Dự kiến doanh thu không được trống"),
  decisionMaker: z.string().min(1, "Người ra quyết định không được trống"),
  contactPerson: z.string().min(1, "Người liên hệ không được trống"),
  deploymentType: z.enum(["MUA", "THUE"]),
  feasibilityScore: z.number().int().min(0).max(100).min(1, "Khả năng khả thi không được trống"),
  expectedCompletionDate: z.string().min(1, "Ngày dự kiến hoàn thành không được trống"),
  stepDates: z.array(StepDateSchema).min(1, "Phải có ít nhất một bước")
});

const UpdateProjectSchema = z.object({
  id: z.string().min(1, "ID dự án không được trống"),
  name: z.string().min(1, "Tên dự án không được trống").max(200),
  description: z.string().optional(),
  category: z.enum(["GPS_AN_NINH", "KHCP_DN", "GIAO_TIEP_CAN"]),
  investor: z.string().min(1, "Chủ đầu tư không được trống"),
  expectedRevenue: z.number().min(1, "Dự kiến doanh thu không được trống"),
  decisionMaker: z.string().min(1, "Người ra quyết định không được trống"),
  contactPerson: z.string().min(1, "Người liên hệ không được trống"),
  deploymentType: z.enum(["MUA", "THUE"]),
  feasibilityScore: z.number().int().min(0).max(100).min(1, "Khả năng khả thi không được trống"),
  expectedCompletionDate: z.string().min(1, "Ngày dự kiến hoàn thành không được trống"),
  stepDates: z.array(StepDateSchema).min(1, "Phải có ít nhất một bước")
});

export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

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

    const newProject = await prisma.project.create({
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

    await logActivity(user.id, "CREATE_PROJECT", {
      projectId: newProject.id,
      projectName: newProject.name
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

    await logActivity(user.id, "UPDATE_PROGRESS", {
      projectId: project.id,
      projectName: project.name,
      oldStep: project.currentStepOrder,
      newStep: validated.newStepOrder,
      percentage: newPercentage,
      note: validated.note
    });

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
 * Cập nhật thông tin dự án (Chỉ ADMIN, PM)
 */
export async function updateProject(data: UpdateProjectInput): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Chưa đăng nhập" };

  if (user.role !== "ADMIN" && user.role !== "PM") {
    return { error: "Bạn không có quyền cập nhật dự án này" };
  }

  try {
    const validated = UpdateProjectSchema.parse(data);

    // Kiểm tra dự án tồn tại
    const project = await prisma.project.findUnique({
      where: { id: validated.id },
      include: { steps: true }
    });

    if (!project) {
      return { error: "Không tìm thấy dự án" };
    }

    // Cập nhật thông tin dự án và các bước bằng transaction
    await prisma.$transaction(async (tx) => {
      // 1. Cập nhật thông tin cơ bản
      await tx.project.update({
        where: { id: validated.id },
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
          expectedCompletionDate: validated.expectedCompletionDate ? new Date(validated.expectedCompletionDate) : null
        }
      });

      // 2. Cập nhật ngày của các bước nếu có
      if (validated.stepDates && validated.stepDates.length > 0) {
        for (const sd of validated.stepDates) {
          const existingStep = project.steps.find((s) => s.stepOrder === sd.stepOrder);
          if (existingStep) {
            await tx.projectStepConfig.update({
              where: { id: existingStep.id },
              data: {
                startDate: sd.startDate ? new Date(sd.startDate) : null,
                endDate: sd.endDate ? new Date(sd.endDate) : null
              }
            });
          }
        }
      }

      // Ghi log hoạt động
      await logActivity(user.id, "UPDATE_PROJECT", {
        projectId: validated.id,
        projectName: validated.name
      });
    });

    revalidatePath(`/projects/${validated.id}`);
    revalidatePath("/projects");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0].message };
    console.error("updateProject error:", error);
    return { error: "Có lỗi xảy ra khi cập nhật dự án" };
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
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    if (!project) return { error: "Không tìm thấy dự án" };

    await prisma.project.delete({ where: { id: projectId } });

    await logActivity(user.id, "DELETE_PROJECT", {
      projectId: project.id,
      projectName: project.name
    });

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
export async function getProjects(options?: { page?: number; limit?: number }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const page = options?.page ?? 1;
  const limit = options?.limit ?? PAGINATION_CONFIG.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const where = user.role === "ADMIN" || user.role === "PM" ? {} : { createdById: user.id };

  const [projects, totalCount, completedCount, inProgressCount] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        steps: { orderBy: { stepOrder: "asc" } },
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { logs: true, files: true } }
      },
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: limit
    }),
    prisma.project.count({ where }),
    prisma.project.count({ where: { ...where, percentage: 100 } }),
    prisma.project.count({ where: { ...where, percentage: { gt: 0, lt: 100 } } })
  ]);

  return {
    projects,
    totalCount,
    completedCount,
    inProgressCount,
    hasMore: skip + projects.length < totalCount
  };
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

/**
 * Import nhiều dự án từ file excel
 */
export async function importProjects(formData: FormData): Promise<{
  error?: string;
  success?: boolean;
  successCount?: number;
  errorCount?: number;
  errorReportBase64?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { error: "Chưa đăng nhập" };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "Không tìm thấy file tải lên" };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = xlsx.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return { error: "File Excel không có dữ liệu" };

    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet) as Record<string, any>[];

    let successCount = 0;
    const errors: Array<{ rowNumber: number; projectName: string; reason: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Dòng 1 là tiêu đề, dữ liệu bắt đầu từ dòng 2

      // Map tiêu đề cột sang trường của schema
      const mappedRow: Record<string, any> = {};
      for (const [key, value] of Object.entries(row)) {
        const normKey = normalizeKey(key);
        const schemaKey = headerMapping[normKey];
        if (schemaKey) {
          mappedRow[schemaKey] = value;
        }
      }

      // Bỏ qua dòng trống hoàn toàn
      if (Object.keys(mappedRow).length === 0) {
        continue;
      }

      const projectName = mappedRow.name ? String(mappedRow.name).trim() : "";

      try {
        // Phân tích ngày cho từng bước
        const stepDatesParsed = [1, 2, 3, 4].map((order) => {
          const startRaw = mappedRow[`step${order}_startDate`];
          const endRaw = mappedRow[`step${order}_endDate`];
          return {
            stepOrder: order,
            startDate: startRaw ? parseDateString(startRaw) : undefined,
            endDate: endRaw ? parseDateString(endRaw) : undefined
          };
        });

        const parsedData = {
          name: projectName,
          description: mappedRow.description ? String(mappedRow.description).trim() : undefined,
          category: parseCategory(mappedRow.category),
          investor: mappedRow.investor ? String(mappedRow.investor).trim() : undefined,
          expectedRevenue: parseNumber(mappedRow.expectedRevenue),
          decisionMaker: mappedRow.decisionMaker ? String(mappedRow.decisionMaker).trim() : undefined,
          contactPerson: mappedRow.contactPerson ? String(mappedRow.contactPerson).trim() : undefined,
          deploymentType: parseDeploymentType(mappedRow.deploymentType),
          feasibilityScore: parseFeasibilityScore(mappedRow.feasibilityScore),
          expectedCompletionDate: parseDateString(mappedRow.expectedCompletionDate),
          stepDates: stepDatesParsed
        };

        // Kiểm tra tính hợp lệ của ngày trong từng bước
        for (const step of stepDatesParsed) {
          if (step.startDate && step.endDate && new Date(step.startDate) > new Date(step.endDate)) {
            throw new Error(`Bước ${step.stepOrder}: Ngày bắt đầu không được sau ngày kết thúc.`);
          }
        }

        // Kiểm tra tính tuần tự giữa các bước
        const filledSteps = stepDatesParsed
          .filter((sd) => sd.startDate || sd.endDate)
          .sort((a, b) => a.stepOrder - b.stepOrder);

        for (let i = 1; i < filledSteps.length; i++) {
          const current = filledSteps[i];
          const prev = filledSteps[i - 1];
          const currentCompare = current.startDate
            ? new Date(current.startDate)
            : current.endDate
              ? new Date(current.endDate)
              : null;
          const prevCompare = prev.endDate ? new Date(prev.endDate) : prev.startDate ? new Date(prev.startDate) : null;

          if (currentCompare && prevCompare && currentCompare < prevCompare) {
            throw new Error(`Ngày của Bước ${current.stepOrder} không được trước ngày của Bước ${prev.stepOrder}.`);
          }
        }

        const validated = CreateProjectSchema.parse(parsedData);

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
                const dates = stepDatesParsed.find((sd) => sd.stepOrder === step.stepOrder);
                return {
                  stepName: step.stepName,
                  stepOrder: step.stepOrder,
                  startDate: dates?.startDate ? new Date(dates.startDate) : null,
                  endDate: dates?.endDate ? new Date(dates.endDate) : null
                };
              })
            }
          }
        });

        successCount++;
      } catch (error: any) {
        let reason = "Lỗi không xác định";
        if (error instanceof z.ZodError) {
          reason = error.issues.map((e: z.ZodIssue) => `${e.path.join(".")}: ${e.message}`).join("; ");
        } else if (error instanceof Error) {
          reason = error.message;
        }
        errors.push({
          rowNumber: rowNum,
          projectName: projectName || "(Không có tên)",
          reason
        });
      }
    }

    let errorReportBase64: string | undefined = undefined;
    if (errors.length > 0) {
      const errorWb = xlsx.utils.book_new();
      const errorWs = xlsx.utils.json_to_sheet(
        errors.map((e) => ({
          Dòng: e.rowNumber,
          "Tên dự án": e.projectName,
          "Lý do lỗi": e.reason
        }))
      );
      xlsx.utils.book_append_sheet(errorWb, errorWs, "Danh sách lỗi");
      const errorBuffer = xlsx.write(errorWb, { type: "buffer", bookType: "xlsx" });
      errorReportBase64 = errorBuffer.toString("base64");
    }

    await logActivity(user.id, "IMPORT_PROJECTS", {
      totalCount: rows.length,
      successCount,
      errorCount: errors.length
    });

    revalidatePath("/projects");
    revalidatePath("/dashboard");

    return {
      success: true,
      successCount,
      errorCount: errors.length,
      errorReportBase64
    };
  } catch (err: any) {
    return { error: err?.message || "Lỗi khi xử lý file Excel" };
  }
}
