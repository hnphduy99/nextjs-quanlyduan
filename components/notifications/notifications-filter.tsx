import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, RefreshCw, Search } from "lucide-react";

interface NotificationsFilterProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedType: string;
  onSelectedTypeChange: (val: string) => void;
  selectedStatus: string;
  onSelectedStatusChange: (val: string) => void;
  isPending: boolean;
  onApply: () => void;
  onReset: () => void;
}

export function NotificationsFilter({
  search,
  onSearchChange,
  selectedType,
  onSelectedTypeChange,
  selectedStatus,
  onSelectedStatusChange,
  isPending,
  onApply,
  onReset
}: NotificationsFilterProps) {
  return (
    <Card className="border-border border bg-(--color-surface) shadow-sm">
      <CardHeader className="px-4 pt-4 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Filter className="text-primary h-4 w-4" />
          Bộ lọc tìm kiếm
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Search Input */}
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs font-semibold">Từ khóa</label>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Tên dự án/Người nhận/Email..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Type Select */}
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs font-semibold">Loại thông báo</label>
            <Select value={selectedType} onValueChange={onSelectedTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả các loại</SelectItem>
                <SelectItem value="AUTO_OVERDUE">Hệ thống tự động</SelectItem>
                <SelectItem value="MANUAL_REMINDER">PM/ADMIN nhắc nhở</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Select */}
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs font-semibold">Trạng thái</label>
            <Select value={selectedStatus} onValueChange={onSelectedStatusChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="SUCCESS">Thành công</SelectItem>
                <SelectItem value="FAILED">Thất bại</SelectItem>
              </SelectContent>
            </Select>
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
