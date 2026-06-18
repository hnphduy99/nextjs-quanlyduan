"use client";

import { CreateProjectDialog } from "@/components/project/create-project-dialog";
import { ImportProjectsDialog } from "@/components/project/import-projects-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { useState } from "react";

export function ProjectsHeader() {
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dự án</h1>
          <p className="text-muted-foreground text-sm">Quản lý và theo dõi tiến độ các dự án</p>
        </div>
        <div className="flex w-full items-center gap-2 self-start sm:w-auto sm:self-auto">
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            className="flex-1 cursor-pointer sm:flex-initial"
          >
            <Upload className="h-4 w-4" />
            Import Excel
          </Button>
          <Button onClick={() => setOpen(true)} className="flex-1 cursor-pointer sm:flex-initial">
            <Plus className="h-4 w-4" />
            Tạo dự án
          </Button>
        </div>
      </div>
      <CreateProjectDialog open={open} onOpenChange={setOpen} />
      <ImportProjectsDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
