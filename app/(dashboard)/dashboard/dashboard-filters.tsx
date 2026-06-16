"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface User {
  id: string;
  name: string;
}

interface DashboardFiltersProps {
  allUsers: User[];
  currentFilters: {
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export function DashboardFilters({ allUsers, currentFilters }: DashboardFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userId, setUserId] = useState(currentFilters.userId ?? "");
  const [dateFrom, setDateFrom] = useState(currentFilters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(currentFilters.dateTo ?? "");

  const hasFilters = userId || dateFrom || dateTo;

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (userId) params.set("userId", userId);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    router.push(`${pathname}?${params.toString()}`);
  };

  const resetFilters = () => {
    setUserId("");
    setDateFrom("");
    setDateTo("");
    router.push(pathname);
  };

  return (
    <div className="border-border flex flex-wrap items-end gap-3 rounded-xl border bg-(--color-surface) p-3">
      {/* Lọc theo nhân sự */}
      <div className="flex flex-col gap-1">
        <label className="text-muted-foreground text-xs">Nhân sự</label>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="border-input bg-background focus:ring-primary h-8 rounded-md border px-2 text-xs focus:ring-1 focus:outline-none"
        >
          <option value="">Tất cả</option>
          {allUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {/* Lọc theo ngày */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-(--color-text-muted)">Từ ngày</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border-input bg-background focus:ring-primary h-8 rounded-md border px-2 text-xs focus:ring-1 focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-(--color-text-muted)">Đến ngày</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border-input bg-background focus:ring-primary h-8 rounded-md border px-2 text-xs focus:ring-1 focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={applyFilters} className="h-8 text-xs">
          Áp dụng
        </Button>
        {hasFilters && (
          <Button size="sm" variant="outline" onClick={resetFilters} className="h-8 text-xs">
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
