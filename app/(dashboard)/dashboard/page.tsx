import { getDashboardStats } from "@/actions/project";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  FolderKanban,
  Loader2,
  TrendingUp,
  User
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardFilters } from "./dashboard-filters";

export const metadata = {
  title: "Dashboard — CRM Dynamic",
  description: "Tổng quan hệ thống quản lý dự án"
};

const STEP_NAMES: Record<number, string> = {
  1: "Tiếp cận KH",
  2: "Đề xuất giải pháp",
  3: "Tham gia thầu",
  4: "Triển khai"
};

const STEP_COLORS: Record<number, { bg: string; text: string; dot: string }> = {
  1: { bg: "bg-sky-500/15", text: "text-sky-400", dot: "bg-sky-400" },
  2: { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  3: { bg: "bg-rose-500/15", text: "text-rose-400", dot: "bg-rose-400" },
  4: { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" }
};

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  trend
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  trend?: string;
}) {
  return (
    <Card className="group relative overflow-hidden transition-transform duration-200 hover:scale-[1.01]">
      <div className={`absolute top-0 right-0 left-0 h-0.5 ${iconBg.replace("/15", "")} opacity-60`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-2 text-xs font-medium tracking-widest text-(--color-text-muted) uppercase">{label}</p>
            <p className="text-4xl leading-none font-black text-(--color-text) tabular-nums">{value}</p>
            {trend && (
              <p className="mt-2 flex items-center gap-1 text-xs text-(--color-text-muted)">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <div className={`h-12 w-12 rounded-xl ${iconBg} flex shrink-0 items-center justify-center`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectProgressBar({
  name,
  percentage,
  id,
  currentStepOrder
}: {
  name: string;
  percentage: number;
  id: string;
  currentStepOrder: number;
}) {
  const stepColor = STEP_COLORS[currentStepOrder] ?? STEP_COLORS[1];
  const color =
    percentage === 100
      ? "bg-emerald-500"
      : percentage >= 50
        ? "bg-(--color-primary)"
        : percentage > 0
          ? "bg-amber-500"
          : "bg-(--color-border)";

  return (
    <Link href={`/projects/${id}`} className="group flex items-center gap-3 py-2.5 transition-opacity hover:opacity-80">
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${stepColor.bg}`}>
        <span className={`text-xs font-bold ${stepColor.text}`}>{currentStepOrder}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="truncate text-sm font-medium text-(--color-text) transition-colors group-hover:text-(--color-primary)">
            {name}
          </span>
          <span className="ml-3 shrink-0 text-xs font-bold text-(--color-text-muted) tabular-nums">{percentage}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--color-border)">
          <div
            className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-(--color-text-muted) opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ userId?: string; dateFrom?: string; dateTo?: string }>;
}) {
  const params = await searchParams;
  const stats = await getDashboardStats({
    userId: params.userId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo
  });
  if (!stats) redirect("/login");

  const { kpis, recentLogs, projectsByProgress, recentProjects, overdueProjects, stepDistribution, allUsers, user } =
    stats;

  const isManager = user.role === "ADMIN" || user.role === "PM";
  const topProjects = [...projectsByProgress].slice(0, 6);

  return (
    <div className="animate-in space-y-6">
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-(--color-text)">Tổng quan</h1>
          <p className="mt-1 text-sm text-(--color-text-muted)">Theo dõi tiến độ và hoạt động của toàn bộ hệ thống</p>
        </div>
        <Link
          href="/projects"
          className="flex items-center gap-2 text-sm font-medium text-(--color-primary) transition-colors hover:text-(--color-primary-hover)"
        >
          <FolderKanban className="h-4 w-4" />
          Xem tất cả dự án
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ── FILTERS (Manager only) ── */}
      {isManager && <DashboardFilters allUsers={allUsers} currentFilters={params} />}

      {/* ── KPI CARDS ── */}
      <div className="stagger-children grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Tổng dự án"
          value={kpis.totalProjects}
          icon={FolderKanban}
          iconColor="text-(--color-primary)"
          iconBg="bg-primary/15"
        />
        <StatCard
          label="Hoàn thành"
          value={kpis.completedProjects}
          icon={CheckCircle2}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/15"
          trend={
            kpis.totalProjects > 0
              ? `${Math.round((kpis.completedProjects / kpis.totalProjects) * 100)}% tổng số`
              : undefined
          }
        />
        <StatCard
          label="Đang thực hiện"
          value={kpis.inProgressProjects}
          icon={Loader2}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/15"
        />
        <StatCard
          label="Quá hạn"
          value={overdueProjects.length}
          icon={AlertTriangle}
          iconColor="text-rose-400"
          iconBg="bg-rose-500/15"
          trend={overdueProjects.length > 0 ? "Cần xử lý ngay" : "Đúng tiến độ"}
        />
        <StatCard
          label="TB hoàn thành"
          value={`${kpis.avgCompletion}%`}
          icon={BarChart3}
          iconColor="text-sky-400"
          iconBg="bg-sky-500/15"
        />
      </div>

      {/* ── STEP DISTRIBUTION ── */}
      <Card>
        <CardHeader className="border-b border-(--color-border) p-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <BarChart3 className="h-4 w-4 text-(--color-primary)" />
            Phân bố dự án theo bước
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((stepOrder) => {
              const dist = stepDistribution.find((d) => d.currentStepOrder === stepOrder);
              const count = dist?._count.id ?? 0;
              const colors = STEP_COLORS[stepOrder];
              return (
                <div key={stepOrder} className={`rounded-xl ${colors.bg} p-4`}>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${colors.dot}`} />
                    <span className={`text-xs font-medium ${colors.text}`}>Bước {stepOrder}</span>
                  </div>
                  <p className="mt-2 text-3xl font-black text-(--color-text) tabular-nums">{count}</p>
                  <p className="mt-0.5 text-xs text-(--color-text-muted)">{STEP_NAMES[stepOrder]}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── MAIN BODY ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* LEFT: Progress + Overdue */}
        <div className="space-y-6 xl:col-span-3">
          {/* Project Progress List — sorted by step (high first) */}
          <Card>
            <CardHeader className="border-b border-(--color-border) p-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <TrendingUp className="h-4 w-4 text-(--color-primary)" />
                Tiến độ dự án
                <span className="ml-auto text-xs font-normal text-(--color-text-muted)">Ưu tiên bước cao hơn</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pt-2">
              {topProjects.length === 0 ? (
                <div className="py-10 text-center text-sm text-(--color-text-muted)">Chưa có dự án nào</div>
              ) : (
                <div className="divide-y divide-(--color-border)">
                  {topProjects.map((project) => (
                    <ProjectProgressBar
                      key={project.id}
                      id={project.id}
                      name={project.name}
                      percentage={project.percentage}
                      currentStepOrder={project.currentStepOrder}
                    />
                  ))}
                </div>
              )}
              {projectsByProgress.length > 6 && (
                <div className="border-t border-(--color-border) pt-3">
                  <Link
                    href="/projects"
                    className="flex items-center gap-1 text-xs text-(--color-primary) hover:underline"
                  >
                    Xem thêm {projectsByProgress.length - 6} dự án khác
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overdue Projects */}
          {overdueProjects.length > 0 && (
            <Card className="border-rose-500/30">
              <CardHeader className="border-b border-rose-500/20 bg-rose-500/5 p-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-rose-400">
                  <AlertTriangle className="h-4 w-4" />
                  Dự án quá hạn ({overdueProjects.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-(--color-border)">
                  {overdueProjects.map((p) => {
                    const currentStep = p.steps.find((s) => s.stepOrder === p.currentStepOrder);
                    const isOverdue = currentStep?.endDate && currentStep.endDate < new Date();
                    return (
                      <Link
                        key={p.id}
                        href={`/projects/${p.id}`}
                        className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-(--color-surface-elevated)"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/15">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-(--color-text) transition-colors group-hover:text-rose-400">
                            {p.name}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-(--color-text-muted)">
                            <User className="h-3 w-3" />
                            {p.createdBy.name}
                            {currentStep && (
                              <>
                                <span className="mx-1">·</span>
                                <span className="text-rose-400">
                                  Bước {currentStep.stepOrder}: hạn{" "}
                                  {currentStep.endDate ? formatDate(currentStep.endDate) : "N/A"}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <Badge variant="destructive" className="shrink-0 text-xs">
                          Quá hạn
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Projects Table */}
          <Card>
            <CardHeader className="border-b border-(--color-border) p-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Clock className="h-4 w-4 text-amber-400" />
                Dự án gần đây
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[28vh] overflow-y-auto p-0">
              <div className="divide-y divide-(--color-border)">
                {recentProjects.map((p) => {
                  const currentStep = p.steps.find((s) => s.stepOrder === p.currentStepOrder);
                  return (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-(--color-surface-elevated)"
                    >
                      <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                        <FolderKanban className="h-3.5 w-3.5 text-(--color-primary)" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-(--color-text) transition-colors group-hover:text-(--color-primary)">
                          {p.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-(--color-text-muted)">
                          <User className="h-3 w-3" />
                          {p.createdBy.name}
                          {currentStep && (
                            <>
                              <span className="mx-1">·</span>
                              <span>
                                Bước {currentStep.stepOrder}: {currentStep.stepName}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="w-16">
                          <Progress value={p.percentage} />
                        </div>
                        <Badge variant={p.percentage === 100 ? "success" : "secondary"} className="text-xs">
                          {p.percentage}%
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
                {recentProjects.length === 0 && (
                  <div className="py-10 text-center text-sm text-(--color-text-muted)">Chưa có dự án nào</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Activity Feed */}
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader className="border-b border-(--color-border) p-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Activity className="h-4 w-4 text-sky-400" />
                Hoạt động gần đây
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[54vh] overflow-y-auto p-0">
              {recentLogs.length === 0 ? (
                <div className="py-10 text-center text-sm text-(--color-text-muted)">Chưa có hoạt động nào</div>
              ) : (
                <div className="divide-y divide-(--color-border)">
                  {recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="group flex gap-3 px-4 py-3 transition-colors hover:bg-(--color-surface-elevated)"
                    >
                      <div className="flex shrink-0 flex-col items-center pt-1">
                        <div
                          className={`h-2 w-2 shrink-0 rounded-full ${log.newPercentage === 100 ? "bg-emerald-500" : "bg-(--color-primary)"}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-primary truncate text-xs font-semibold">{log.project.name}</p>
                        <p className="mt-0.5 text-[11px] text-(--color-text-muted)">
                          Bước {log.oldStep} → {log.newStep} · {log.oldPercentage}% → {log.newPercentage}%
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-(--color-text-muted)">
                          <User className="h-2.5 w-2.5" />
                          {log.updatedBy.name} · {formatDate(log.changedAt)}
                        </p>
                        {log.note && (
                          <p className="mt-1 truncate text-[11px] text-(--color-text-muted) italic">
                            &ldquo;{log.note}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
