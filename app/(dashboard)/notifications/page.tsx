import { getNotifications } from "@/actions/email";
import { PAGINATION_CONFIG } from "@/constants/pagination";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NotificationsPageClient } from "./notifications-client";

export const metadata = {
  title: "Quản lý thông báo — CRM Dynamic",
  description: "Theo dõi và quản lý lịch sử gửi thông báo nhắc nhở trễ hạn dự án"
};

export default async function NotificationsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.role !== "ADMIN" && currentUser.role !== "PM") redirect("/dashboard");

  const initialData = await getNotifications({
    page: 1,
    limit: PAGINATION_CONFIG.DEFAULT_LIMIT
  });

  return <NotificationsPageClient initialData={initialData} />;
}
