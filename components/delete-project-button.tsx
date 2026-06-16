"use client";

import { deleteProject } from "@/actions/project";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function DeleteProjectButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProject(projectId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã xóa dự án thành công");
        setOpen(false);
      }
    });
  };

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="hover:text-(--color-destructive)">
        <Trash2 className="text-destructive h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa dự án</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa dự án &quot;{projectName}&quot;? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
