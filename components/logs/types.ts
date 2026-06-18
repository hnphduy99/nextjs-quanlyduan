export interface LogItem {
  id: string;
  userId: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface UserDropdownItem {
  id: string;
  name: string;
  email: string;
}

export interface LogsPageClientProps {
  initialLogs: {
    logs: LogItem[];
    totalCount: number;
    hasMore: boolean;
  };
  users: UserDropdownItem[];
  actions: string[];
  currentUserId: string;
}
