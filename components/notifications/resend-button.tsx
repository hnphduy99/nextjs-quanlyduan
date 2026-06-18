"use client";

import { resendNotification } from "@/actions/email";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

interface ResendButtonProps {
  notificationId: string;
  isProjectCompleted: boolean;
}

export function ResendButton({ notificationId, isProjectCompleted }: ResendButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleResend = () => {
    if (isProjectCompleted) {
      toast.error("Dự án này đã hoàn thành, không thể gửi lại nhắc nhở.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await resendNotification(notificationId);
        if (result.success) {
          toast.success("Gửi lại email nhắc nhở thành công!");
        } else {
          toast.error(result.error || "Gửi lại nhắc nhở thất bại.");
        }
      } catch (error: any) {
        console.error("Lỗi khi gửi lại nhắc nhở:", error);
        toast.error("Đã xảy ra lỗi hệ thống khi gửi lại nhắc nhở.");
      }
    });
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleResend}
      disabled={isPending || isProjectCompleted}
      className="border-primary/20 bg-primary/5 text-primary hover:bg-primary flex h-8 cursor-pointer items-center gap-1 text-xs font-semibold transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      title={isProjectCompleted ? "Dự án đã hoàn thành" : "Gửi lại thông báo này"}
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
      <span>{isPending ? "Đang gửi..." : "Gửi lại"}</span>
    </Button>
  );
}
