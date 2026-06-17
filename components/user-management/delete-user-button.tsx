"use client";

import { deleteUser } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  const handleDelete = () => {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000);
      return;
    }
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Đã xóa ${userName}`);
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      className={`h-8 transition-colors ${confirm ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30" : "hover:bg-destructive/10 hover:text-(--color-destructive)"}`}
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      <span className="ml-1.5 text-xs">{confirm ? "Xác nhận?" : "Xóa"}</span>
    </Button>
  );
}
