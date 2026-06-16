import { getUsers } from "@/actions/user";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UsersPageClient } from "./users-client";

export const metadata = {
  title: "Phân quyền — CRM Dynamic",
  description: "Quản lý tài khoản và phân quyền người dùng"
};

export default async function UsersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.role !== "ADMIN") redirect("/dashboard");

  const users = await getUsers();

  return <UsersPageClient users={users} currentUserId={currentUser.id} />;
}
