"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { setSessionCookie, clearSession, getSession } from "@/lib/auth";

export async function loginAction(
  _prevState: { error?: string } | null,
  formData: FormData,
) {
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
    role: user.role,
  });

  redirect("/projects");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function getSessionInfo() {
  return getSession();
}
