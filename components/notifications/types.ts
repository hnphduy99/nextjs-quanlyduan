import { NotificationType } from "@/app/generated/prisma/client";

export interface NotificationItem {
  id: string;
  projectId: string;
  recipientId: string;
  type: NotificationType;
  sentAt: Date;
  status: string;
  errorMessage: string | null;
  overdueDays: number;
  stepName: string;
  project: {
    id: string;
    name: string;
    percentage: number;
    currentStepOrder: number;
  };
  recipient: {
    id: string;
    name: string;
    email: string;
  };
}

export interface NotificationsPageClientProps {
  initialData: {
    notifications: NotificationItem[];
    totalCount: number;
  };
}
