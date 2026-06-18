"use client";

import { getNotifications } from "@/actions/email";
import { NotificationsFilter } from "@/components/notifications/notifications-filter";
import { NotificationsTable } from "@/components/notifications/notifications-table";
import { NotificationsPageClientProps } from "@/components/notifications/types";
import { PAGINATION_CONFIG } from "@/constants/pagination";
import { useState, useTransition } from "react";

export function NotificationsPageClient({ initialData }: NotificationsPageClientProps) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const fetchNotifications = async (targetPage: number) => {
    try {
      const result = await getNotifications({
        search: search.trim() || undefined,
        type: selectedType === "all" ? undefined : selectedType,
        status: selectedStatus === "all" ? undefined : selectedStatus,
        page: targetPage,
        limit: PAGINATION_CONFIG.DEFAULT_LIMIT
      });
      setData(result);
    } catch (error) {
      console.error("Lỗi khi tải danh sách thông báo:", error);
    }
  };

  const handleApplyFilters = () => {
    setPage(1);
    startTransition(async () => {
      await fetchNotifications(1);
    });
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedType("all");
    setSelectedStatus("all");
    setPage(1);

    startTransition(async () => {
      try {
        const result = await getNotifications({ page: 1, limit: PAGINATION_CONFIG.DEFAULT_LIMIT });
        setData(result);
      } catch (error) {
        console.error("Lỗi khi reset bộ lọc thông báo:", error);
      }
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    startTransition(async () => {
      await fetchNotifications(newPage);
    });
  };

  const totalPages = Math.ceil(data.totalCount / PAGINATION_CONFIG.DEFAULT_LIMIT);

  return (
    <div className="animate-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Quản lý thông báo</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Theo dõi, kiểm tra lịch sử và gửi lại các nhắc nhở, cảnh báo trễ hạn dự án
        </p>
      </div>

      {/* Filters Card */}
      <NotificationsFilter
        search={search}
        onSearchChange={setSearch}
        selectedType={selectedType}
        onSelectedTypeChange={setSelectedType}
        selectedStatus={selectedStatus}
        onSelectedStatusChange={setSelectedStatus}
        isPending={isPending}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* Table Card */}
      <NotificationsTable
        notifications={data.notifications}
        totalCount={data.totalCount}
        currentPage={page}
        totalPages={totalPages}
        isPending={isPending}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
