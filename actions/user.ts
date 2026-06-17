"use server";

import { PAGINATION_CONFIG } from "@/constants/pagination";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/audit-logger";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const CreateUserSchema = z.object({
  name: z.string().min(1, "Tên không được trống").max(100),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  role: z.enum(["ADMIN", "PM", "MEMBER"])
});

const UpdateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Tên không được trống").max(100),
  email: z.string().email("Email không hợp lệ"),
  role: z.enum(["ADMIN", "PM", "MEMBER"]),
  password: z.string().optional()
});

export async function getUsers(options?: { page?: number; limit?: number }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") {
    return {
      users: [],
      totalCount: 0,
      adminCount: 0,
      pmCount: 0,
      memberCount: 0,
      hasMore: false
    };
  }

  const page = options?.page ?? 1;
  const limit = options?.limit ?? PAGINATION_CONFIG.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const [users, totalCount, adminCount, pmCount, memberCount] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "PM" } }),
    prisma.user.count({ where: { role: "MEMBER" } })
  ]);

  return {
    users,
    totalCount,
    adminCount,
    pmCount,
    memberCount,
    hasMore: skip + users.length < totalCount
  };
}

export async function createUser(_prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Bạn không có quyền thực hiện thao tác này" };
  }

  try {
    const raw = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role: formData.get("role") as string
    };

    const validated = CreateUserSchema.parse(raw);

    const existing = await prisma.user.findUnique({ where: { email: validated.email } });
    if (existing) return { error: "Email này đã được sử dụng" };

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        role: validated.role as "ADMIN" | "PM" | "MEMBER"
      }
    });

    await logActivity(currentUser.id, "CREATE_USER", {
      targetUserId: newUser.id,
      targetName: newUser.name,
      targetEmail: newUser.email,
      targetRole: newUser.role
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0].message };
    return { error: "Có lỗi xảy ra khi tạo người dùng" };
  }
}

export async function updateUser(_prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Bạn không có quyền thực hiện thao tác này" };
  }

  try {
    const raw = {
      id: formData.get("id") as string,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as string,
      password: (formData.get("password") as string) || undefined
    };

    const validated = UpdateUserSchema.parse(raw);

    const updateData: Record<string, unknown> = {
      name: validated.name,
      email: validated.email,
      role: validated.role
    };

    if (validated.password && validated.password.trim().length >= 6) {
      const bcrypt = await import("bcryptjs");
      updateData.password = await bcrypt.hash(validated.password, 10);
    }

    const updatedUser = await prisma.user.update({ where: { id: validated.id }, data: updateData });

    await logActivity(currentUser.id, "UPDATE_USER", {
      targetUserId: updatedUser.id,
      targetName: updatedUser.name,
      targetEmail: updatedUser.email,
      targetRole: updatedUser.role
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0].message };
    return { error: "Có lỗi xảy ra khi cập nhật người dùng" };
  }
}

export async function deleteUser(userId: string): Promise<{ error?: string; success?: boolean }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Bạn không có quyền thực hiện thao tác này" };
  }
  if (currentUser.id === userId) {
    return { error: "Không thể xóa chính mình" };
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return { error: "Không tìm thấy người dùng" };

    await prisma.user.delete({ where: { id: userId } });

    await logActivity(currentUser.id, "DELETE_USER", {
      targetUserId: targetUser.id,
      targetName: targetUser.name,
      targetEmail: targetUser.email,
      targetRole: targetUser.role
    });

    revalidatePath("/users");
    return { success: true };
  } catch {
    return { error: "Có lỗi xảy ra khi xóa người dùng" };
  }
}
