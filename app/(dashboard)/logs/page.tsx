import { getActivityActions, getActivityLogs } from "@/actions/log";
import { getUsers } from "@/actions/user";
import { PAGINATION_CONFIG } from "@/constants/pagination";
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

  const [usersData, initialLogsData, actions] = await Promise.all([
    getUsers({ limit: 1000 }),
    getActivityLogs({ page: 1, limit: PAGINATION_CONFIG.DEFAULT_LIMIT }),
    getActivityActions()
  ]);

  const userList = usersData.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email
  }));

  return (
    <LogsPageClient initialLogs={initialLogsData} users={userList} actions={actions} currentUserId={currentUser.id} />
  );
}
