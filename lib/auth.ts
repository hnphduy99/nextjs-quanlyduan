import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import type { Role } from "@/app/generated/prisma/client";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-secret-key",
);
const COOKIE_NAME = "crm-session";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 ngày
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return user;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function hasPermission(
  userRole: Role,
  action: "create" | "read" | "update" | "delete",
  isOwner: boolean = false,
): boolean {
  switch (action) {
    case "create":
      // Tất cả role đều có thể tạo dự án
      return true;
    case "read":
      // ADMIN/PM xem tất cả, MEMBER chỉ xem dự án của mình
      if (userRole === "ADMIN" || userRole === "PM") return true;
      return isOwner;
    case "update":
      // Tất cả role đều có thể cập nhật (nếu có quyền xem)
      if (userRole === "ADMIN" || userRole === "PM") return true;
      return isOwner;
    case "delete":
      // Chỉ ADMIN và PM được xóa
      return userRole === "ADMIN" || userRole === "PM";
    default:
      return false;
  }
}
