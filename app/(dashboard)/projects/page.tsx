import { getProjects } from "@/actions/project";
import { DeleteProjectButton } from "@/components/delete-project-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { ArrowRight, Clock, FolderKanban, User } from "lucide-react";
import Link from "next/link";
import { ProjectsHeader } from "./projects-header";

export default async function ProjectsPage() {
  const [user, projects] = await Promise.all([getCurrentUser(), getProjects()]);

  if (!user) return null;

  const canDelete = user.role === "ADMIN" || user.role === "PM";

  return (
    <div className="space-y-6">
      {/* Header */}
      <ProjectsHeader />

      {/* Stats */}
      <div className="stagger-children grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="bg-primary/15 flex h-10 w-10 items-center justify-center rounded-xl">
              <FolderKanban className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{projects.length}</p>
              <p className="text-muted-foreground text-xs">Tổng dự án</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
              <Clock className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{projects.filter((p) => p.percentage === 100).length}</p>
              <p className="text-muted-foreground text-xs">Hoàn thành</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
              <ArrowRight className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {projects.filter((p) => p.percentage > 0 && p.percentage < 100).length}
              </p>
              <p className="text-muted-foreground text-xs">Đang xử lý</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-lg font-medium">Chưa có dự án nào</p>
            <p className="text-muted-foreground text-sm">Tạo dự án đầu tiên để bắt đầu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="stagger-children grid max-h-[calc(100vh-16rem)] gap-4 overflow-y-auto">
          {projects.map((project) => {
            const currentStep = project.steps.find((s) => s.stepOrder === project.currentStepOrder);
            return (
              <Card key={project.id} className="group hover:border-primary/30 mx-2 transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <Link
                          href={`/projects/${project.id}`}
                          className="hover:text-primary truncate text-lg font-semibold transition-colors"
                        >
                          {project.name}
                        </Link>
                        <Badge variant={project.percentage === 100 ? "success" : "secondary"}>
                          {project.percentage}%
                        </Badge>
                      </div>

                      {project.description && (
                        <p className="text-muted-foreground mb-3 line-clamp-1 text-sm">{project.description}</p>
                      )}

                      <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {project.createdBy.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(project.createdAt)}
                        </span>
                        {currentStep && (
                          <Badge variant="outline" className="text-xs">
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
        </div>
      )}
    </div>
  );
}
