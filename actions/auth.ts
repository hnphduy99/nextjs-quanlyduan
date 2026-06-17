"use server";

import { logActivity } from "@/lib/audit-logger";
import { clearSession, getSession, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function loginAction(_prevState: { error?: string } | null, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Vui lòng nhập email và mật khẩu" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Email hoặc mật khẩu không đúng" };
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return { error: "Email hoặc mật khẩu không đúng" };
  }

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });

  await logActivity(user.id, "LOGIN", "Đăng nhập thành công");

  redirect("/dashboard");
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await logActivity(session.userId, "LOGOUT", "Đăng xuất tài khoản");
  }
  await clearSession();
  redirect("/login");
}

export async function getSessionInfo() {
  return getSession();
}
