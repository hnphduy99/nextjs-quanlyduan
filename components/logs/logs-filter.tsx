import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTION_META } from "@/constants/logs";
import { Filter, RefreshCw, Search } from "lucide-react";
import { UserDropdownItem } from "./types";

interface LogsFilterProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedUser: string;
  onSelectedUserChange: (val: string) => void;
  selectedAction: string;
  onSelectedActionChange: (val: string) => void;
  dateFrom: string;
  onDateFromChange: (val: string) => void;
  dateTo: string;
  onDateToChange: (val: string) => void;
  users: UserDropdownItem[];
  actions: string[];
  isPending: boolean;
  onApply: () => void;
  onReset: () => void;
}

export function LogsFilter({
  search,
  onSearchChange,
  selectedUser,
  onSelectedUserChange,
  selectedAction,
  onSelectedActionChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  users,
  actions,
  isPending,
  onApply,
  onReset
}: LogsFilterProps) {
  return (
    <Card className="border-border border bg-(--color-surface) shadow-sm">
      <CardHeader className="px-4 pt-4 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Filter className="text-primary h-4 w-4" />
          Bộ lọc tìm kiếm
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
          {/* Search Input */}
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs font-semibold">Từ khóa</label>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Chi tiết/IP/Email..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* User Select */}
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs font-semibold">Người thực hiện</label>
            <Select value={selectedUser} onValueChange={onSelectedUserChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả người dùng</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Select */}
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs font-semibold">Hành động</label>
            <Select value={selectedAction} onValueChange={onSelectedActionChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hành động</SelectItem>
                {actions.map((act) => (
                  <SelectItem key={act} value={act}>
                    {ACTION_META[act]?.label || act}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date From */}
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs font-semibold">Từ ngày</label>
            <Input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} />
          </div>

          {/* Date To */}
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs font-semibold">Đến ngày</label>
            <Input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onReset}
            disabled={isPending}
            className="h-9 w-full cursor-pointer gap-2 text-xs sm:w-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button onClick={onApply} disabled={isPending} className="h-9 w-full cursor-pointer gap-2 text-xs sm:w-auto">
            <Filter className="h-3.5 w-3.5" />
            Lọc dữ liệu
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
