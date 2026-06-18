import { getProjects } from "@/actions/project";
import { Card, CardContent } from "@/components/ui/card";
import { PAGINATION_CONFIG } from "@/constants/pagination";
import { getCurrentUser } from "@/lib/auth";
import { ArrowRight, Clock, FolderKanban } from "lucide-react";
import { ProjectsClient } from "./projects-client";
import { ProjectsHeader } from "./projects-header";

export default async function ProjectsPage() {
  const [user, projectsData] = await Promise.all([
    getCurrentUser(),
    getProjects({ page: 1, limit: PAGINATION_CONFIG.DEFAULT_LIMIT })
  ]);

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
              <p className="text-2xl font-bold">{projectsData.totalCount}</p>
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
              <p className="text-2xl font-bold">{projectsData.completedCount}</p>
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
              <p className="text-2xl font-bold">{projectsData.inProgressCount}</p>
              <p className="text-muted-foreground text-xs">Đang xử lý</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <ProjectsClient
        initialProjects={projectsData.projects}
        initialHasMore={projectsData.hasMore}
        canDelete={canDelete}
        canEdit={canDelete}
      />
    </div>
  );
}
