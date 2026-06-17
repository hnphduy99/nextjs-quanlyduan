"use client";

import { CreateProjectDialog } from "@/components/create-project-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

export function ProjectsHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dự án</h1>
          <p className="text-muted-foreground text-sm">Quản lý và theo dõi tiến độ các dự án</p>
        </div>
        <Button onClick={() => setOpen(true)} className="w-full self-start sm:w-auto sm:self-auto">
          <Plus className="h-4 w-4" />
          Tạo dự án
        </Button>
      </div>
      <CreateProjectDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
