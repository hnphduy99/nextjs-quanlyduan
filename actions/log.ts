"use server";

import { PAGINATION_CONFIG } from "@/constants/pagination";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export interface LogFilterInput {
  userId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getActivityLogs(filters?: LogFilterInput) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const where: Record<string, any> = {};

  if (filters?.userId && filters.userId !== "all") {
    where.userId = filters.userId;
  }

  if (filters?.action && filters.action !== "all") {
    where.action = filters.action;
  }

  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo + "T23:59:59.999Z") } : {})
    };
  }

  if (filters?.search) {
    where.OR = [
      { details: { contains: filters.search } },
      { ipAddress: { contains: filters.search } },
      { userAgent: { contains: filters.search } },
      {
        user: {
          OR: [{ name: { contains: filters.search } }, { email: { contains: filters.search } }]
        }
      }
    ];
  }

  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? PAGINATION_CONFIG.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const [logs, totalCount] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit
    }),
    prisma.activityLog.count({ where })
  ]);

  return {
    logs,
    totalCount,
    hasMore: skip + logs.length < totalCount
  };
}

export async function getActivityActions() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const logs = await prisma.activityLog.groupBy({
    by: ["action"],
    _count: {
      action: true
    }
  });

  return logs.map((l) => l.action);
}
