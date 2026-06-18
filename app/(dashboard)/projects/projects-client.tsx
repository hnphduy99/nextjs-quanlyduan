"use client";

import { getProjects } from "@/actions/project";
import { DeleteProjectButton } from "@/components/delete-project-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UpdateProjectDialog } from "@/components/update-project-dialog";
import { PAGINATION_CONFIG } from "@/constants/pagination";
import { formatDate } from "@/lib/utils";
import { ArrowRight, Clock, FolderKanban, Loader2, Pencil, User } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

type ProjectItem = Awaited<ReturnType<typeof getProjects>>["projects"][number];

interface ProjectsClientProps {
  initialProjects: ProjectItem[];
  initialHasMore: boolean;
  canDelete: boolean;
  canEdit: boolean;
}

export function ProjectsClient({ initialProjects, initialHasMore, canDelete, canEdit }: ProjectsClientProps) {
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  const [prevInitialProjects, setPrevInitialProjects] = useState(initialProjects);
  if (initialProjects !== prevInitialProjects) {
    setProjects(initialProjects);
    setPage(1);
    setHasMore(initialHasMore);
    setPrevInitialProjects(initialProjects);
  }

  const handleLoadMore = () => {
    if (isPending) return;
    const nextPage = page + 1;

    startTransition(async () => {
      try {
        const result = await getProjects({ page: nextPage, limit: PAGINATION_CONFIG.DEFAULT_LIMIT });
        setProjects((prev) => [...prev, ...result.projects]);
        setPage(nextPage);
        setHasMore(result.hasMore);
      } catch (error) {
        console.error("Lỗi khi tải thêm dự án:", error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-lg font-medium">Chưa có dự án nào</p>
            <p className="text-muted-foreground text-sm">Tạo dự án đầu tiên để bắt đầu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="stagger-children grid max-h-[calc(100vh-16rem)] gap-4 overflow-y-auto pr-1">
          {projects.map((project) => {
            const currentStep = project.steps.find((s) => s.stepOrder === project.currentStepOrder);
            return (
              <Card
                key={project.id}
                className="group hover:border-primary/30 animate-in mx-0 transition-all duration-300 sm:mx-2"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <Link
                          href={`/projects/${project.id}`}
                          className="hover:text-primary truncate text-lg font-semibold transition-colors"
                        >
                          {project.name}
                        </Link>
                        <Badge variant={project.percentage === 100 ? "success" : "secondary"}>
                          {project.percentage}%
                        </Badge>
                        {currentStep?.endDate && new Date(currentStep?.endDate) < new Date() && (
                          <Badge variant={"destructive"} className="text-xs">
                            Quá hạn
                          </Badge>
                        )}
                      </div>

                      {project.description && (
                        <p className="text-muted-foreground mb-3 line-clamp-1 text-sm">{project.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {project.createdBy.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(project.createdAt)}
                        </span>
                        {currentStep && (
                          <Badge variant="default" className="text-xs">
                            Bước {currentStep.stepOrder}: {currentStep.stepName}
                          </Badge>
                        )}
                        <span>
                          {project.steps.length} bước · {project._count.logs} cập nhật
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Link href={`/projects/${project.id}`}>
                        <Badge
                          variant="outline"
                          className="hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors"
                        >
                          Chi tiết <ArrowRight className="ml-1 h-3 w-3" />
                        </Badge>
                      </Link>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedProject(project);
                            setEditOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {(canDelete || project.percentage !== 100) && (
                        <DeleteProjectButton projectId={project.id} projectName={project.name} />
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <Progress value={project.percentage} />
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-2 pb-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isPending}
                className="border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary w-full max-w-xs cursor-pointer gap-2 shadow-xs transition-all duration-300"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  "Tải thêm dự án"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
      {editOpen && selectedProject && (
        <UpdateProjectDialog open={editOpen} onOpenChange={setEditOpen} project={selectedProject} />
      )}
    </div>
  );
}
