"use client";

import { sendManualReminder } from "@/actions/email";
import { Button } from "@/components/ui/button";
import { BellRing, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

interface ReminderButtonProps {
  projectId: string;
  projectName: string;
}

export function ReminderButton({ projectId, projectName }: ReminderButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleSendReminder = () => {
    startTransition(async () => {
      const result = await sendManualReminder(projectId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Đã gửi email nhắc nhở xử lý dự án "${projectName}" thành công!`);
      }
    });
  };

  return (
    <Button
      onClick={handleSendReminder}
      disabled={isPending}
      className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-amber-700/30 bg-amber-600 px-4 font-medium text-white shadow-sm transition-all select-none hover:border-amber-700/50 hover:bg-amber-700 hover:shadow-md active:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-white" />
      ) : (
        <BellRing className="h-4 w-4 animate-pulse text-white" />
      )}
      <span>{isPending ? "Đang gửi nhắc nhở..." : "Gửi nhắc nhở trễ hạn"}</span>
    </Button>
  );
}
