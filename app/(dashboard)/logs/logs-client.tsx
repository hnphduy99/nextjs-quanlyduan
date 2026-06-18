"use client";

import { getActivityLogs } from "@/actions/log";
import { LogsFilter } from "@/components/logs/logs-filter";
import { LogsTable } from "@/components/logs/logs-table";
import { LogsPageClientProps } from "@/components/logs/types";
import { PAGINATION_CONFIG } from "@/constants/pagination";
import { useState, useTransition } from "react";

export function LogsPageClient({ initialLogs, users, actions, currentUserId }: LogsPageClientProps) {
  const [logsData, setLogsData] = useState(initialLogs);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = async (targetPage: number) => {
    try {
      const result = await getActivityLogs({
        userId: selectedUser === "all" ? undefined : selectedUser,
        action: selectedAction === "all" ? undefined : selectedAction,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: search.trim() || undefined,
        page: targetPage,
        limit: PAGINATION_CONFIG.DEFAULT_LIMIT
      });
      setLogsData(result);
    } catch (error) {
      console.error("Lỗi khi tải nhật ký hoạt động:", error);
    }
  };

  const handleApplyFilters = () => {
    setPage(1);
    startTransition(async () => {
      await fetchLogs(1);
    });
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedUser("all");
    setSelectedAction("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);

    startTransition(async () => {
      try {
        const result = await getActivityLogs({ page: 1, limit: PAGINATION_CONFIG.DEFAULT_LIMIT });
        setLogsData(result);
      } catch (error) {
        console.error("Lỗi khi reset nhật ký hoạt động:", error);
      }
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    startTransition(async () => {
      await fetchLogs(newPage);
    });
  };

  const totalPages = Math.ceil(logsData.totalCount / PAGINATION_CONFIG.DEFAULT_LIMIT);

  return (
    <div className="animate-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Nhật ký hoạt động</h1>
        <p className="text-muted-foreground mt-1 text-sm">Lịch sử hoạt động của người dùng trên hệ thống CRM</p>
      </div>

      {/* Filters Card */}
      <LogsFilter
        search={search}
        onSearchChange={setSearch}
        selectedUser={selectedUser}
        onSelectedUserChange={setSelectedUser}
        selectedAction={selectedAction}
        onSelectedActionChange={setSelectedAction}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        users={users}
        actions={actions}
        isPending={isPending}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* Logs Table Card */}
      <LogsTable
        logs={logsData.logs}
        totalCount={logsData.totalCount}
        currentPage={page}
        totalPages={totalPages}
        isPending={isPending}
        currentUserId={currentUserId}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
