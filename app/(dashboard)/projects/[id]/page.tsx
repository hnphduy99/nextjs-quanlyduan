import { getProjectById } from "@/actions/project";
import { ProgressUpdateForm } from "@/components/progress-update-form";
import { ProjectLogTable } from "@/components/project-log-table";
import { StepTimeline } from "@/components/step-timeline";
import { CATEGORY_LABELS, DEPLOYMENT_LABELS } from "@/constants/project";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Calendar,
  CircleDollarSign,
  Clock,
  History,
  Package,
  Phone,
  ShieldCheck,
  Tag,
  TrendingUp,
  User
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProjectDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [user, project] = await Promise.all([getCurrentUser(), getProjectById(id)]);

  if (!user || !project) notFound();

  const currentStep = project.steps.find((s) => s.stepOrder === project.currentStepOrder);
  const canUpdate = user.role === "ADMIN" || user.role === "PM" || project.createdById === user.id;

  // Kiểm tra quá hạn — bước hiện tại có endDate < now
  const now = new Date();
  const isOverdue = currentStep?.endDate && currentStep.endDate < now && project.percentage < 100;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/projects"
          className="text-muted-foreground hover:text-primary mb-4 inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-(--color-text)">{project.name}</h1>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  ⚠ Quá hạn
                </Badge>
              )}
            </div>
            {project.description && <p className="text-muted-foreground mt-1 text-sm">{project.description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={project.percentage === 100 ? "success" : "default"} className="px-3 py-1 text-base">
              {project.percentage}%
            </Badge>
          </div>
        </div>

        {/* Meta row */}
        <div className="text-muted-foreground mt-3 flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            {project.createdBy.name}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {formatDate(project.createdAt)}
          </span>
          {currentStep && (
            <Badge variant={isOverdue ? "destructive" : "outline"}>Bước hiện tại: {currentStep.stepName}</Badge>
          )}
          {project.expectedCompletionDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Nghiệm thu: {formatDate(project.expectedCompletionDate).split(" ")[1]}
            </span>
          )}
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Category + Deployment */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs text-(--color-text-muted)">
              <Tag className="h-3.5 w-3.5" />
              Phân loại
            </div>
            <p className="text-sm font-semibold text-(--color-text)">
              {CATEGORY_LABELS[project.category] ?? project.category}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-(--color-text-muted)">
              <Package className="h-3.5 w-3.5" />
              <span>Hình thức: {DEPLOYMENT_LABELS[project.deploymentType] ?? project.deploymentType}</span>
            </div>
          </CardContent>
        </Card>

        {/* Investor */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs text-(--color-text-muted)">
              <Building2 className="h-3.5 w-3.5" />
              Chủ đầu tư
            </div>
            <p className="text-sm font-semibold text-(--color-text)">{project.investor || "—"}</p>
            {project.expectedRevenue && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-(--color-text-muted)">
                <CircleDollarSign className="h-3.5 w-3.5" />
                <span>{project.expectedRevenue.toLocaleString("vi-VN")} triệu đồng</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contacts */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs text-(--color-text-muted)">
              <Phone className="h-3.5 w-3.5" />
              Người quyết định
            </div>
            <p className="text-sm font-semibold text-(--color-text)">{project.decisionMaker || "—"}</p>
            <div className="mt-2 text-xs text-(--color-text-muted)">
              <span className="font-medium">Đầu mối:</span> {project.contactPerson || "—"}
            </div>
          </CardContent>
        </Card>

        {/* Feasibility */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs text-(--color-text-muted)">
              <ShieldCheck className="h-3.5 w-3.5" />
              Khả thi
            </div>
            {project.feasibilityScore !== null && project.feasibilityScore !== undefined ? (
              <>
                <p className="text-primary text-2xl font-black">{project.feasibilityScore}%</p>
                {/* <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-(--color-border)">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${project.feasibilityScore}%` }} />
                </div> */}
              </>
            ) : (
              <p className="text-sm text-(--color-text-muted)">Chưa đánh giá</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="text-primary h-5 w-5" />
            Tiến độ dự án
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Hoàn thành</span>
              <span className="font-medium">{project.percentage}%</span>
            </div>
            <Progress value={project.percentage} className="h-4" />
          </div>
          <StepTimeline steps={project.steps} currentStepOrder={project.currentStepOrder} />
        </CardContent>
      </Card>

      {/* Update Form */}
      {canUpdate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="text-primary h-4 w-4" />
              Cập nhật tiến độ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressUpdateForm
              projectId={project.id}
              currentStepOrder={project.currentStepOrder}
              currentPercentage={project.percentage}
              steps={project.steps}
              files={project.files}
            />
          </CardContent>
        </Card>
      )}

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="text-primary h-5 w-5" />
            Lịch sử cập nhật ({project.logs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectLogTable logs={project.logs} files={project.files} />
        </CardContent>
      </Card>
    </div>
  );
}
