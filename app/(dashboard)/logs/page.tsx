import { getActivityActions, getActivityLogs } from "@/actions/log";
import { getUsers } from "@/actions/user";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogsPageClient } from "./logs-client";

export const metadata = {
  title: "Nhật ký hoạt động — CRM Dynamic",
  description: "Theo dõi nhật ký hoạt động của người dùng trong hệ thống"
};

export default async function LogsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.role !== "ADMIN") redirect("/dashboard");

  const [users, initialLogs, actions] = await Promise.all([getUsers(), getActivityLogs(), getActivityActions()]);

  // Map users to clean list of user info (id, name, email)
  const userList = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email
  }));

  return <LogsPageClient initialLogs={initialLogs} users={userList} actions={actions} currentUserId={currentUser.id} />;
}
