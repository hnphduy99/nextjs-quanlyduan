import { CATEGORY_OPTIONS, DEPLOYMENT_OPTIONS } from "@/constants/project";
import { DEFAULT_STEPS } from "@/lib/project-constants";
import { ProjectFormValues } from "@/schemas/project";
import { Loader2, Plus } from "lucide-react";
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister
} from "react-hook-form";
import { Button } from "../ui/button";
import DatePicker from "../ui/date-picker";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";

interface ProjectFormProps {
  register: UseFormRegister<ProjectFormValues>;
  handleSubmit: UseFormHandleSubmit<ProjectFormValues>;
  control: Control<ProjectFormValues>;
  errors: FieldErrors<ProjectFormValues>;
  isSubmitting: boolean;
  fields: FieldArrayWithId<ProjectFormValues, "stepDates", "id">[];
  onSubmit: (data: ProjectFormValues) => void;
  onCancel: () => void;
}

export default function ProjectForm({
  register,
  handleSubmit,
  control,
  errors,
  isSubmitting,
  fields,
  onSubmit,
  onCancel
}: ProjectFormProps) {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* SECTION 1: Thông tin cơ bản */}
      <div className="border-border rounded-xl border bg-(--color-surface) p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <span className="bg-primary/20 flex h-5 w-5 items-center justify-center rounded-full text-xs text-(--color-primary)">
            1
          </span>
          Thông tin dự án
        </h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="project-name">
              Tên dự án <span className="text-destructive">*</span>
            </Label>
            <Input id="project-name" placeholder="VD: Hệ thống camera giám sát ABC..." {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-desc">Mô tả</Label>
            <Textarea id="project-desc" placeholder="Mô tả chi tiết dự án..." rows={2} {...register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Category — Radix Select */}
            <div className="space-y-1.5">
              <Label>
                Phân loại dự án <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn phân loại" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
            </div>

            {/* Deployment Type — Radix Select */}
            <div className="space-y-1.5">
              <Label>
                Hình thức triển khai <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="deploymentType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn hình thức" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPLOYMENT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.deploymentType && <p className="text-sm text-red-500">{errors.deploymentType.message}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Thông tin khách hàng */}
      <div className="border-border rounded-xl border bg-(--color-surface) p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-xs text-amber-500">
            2
          </span>
          Thông tin khách hàng
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="investor" className="flex items-center gap-1.5">
              Chủ đầu tư <span className="text-destructive">*</span>
            </Label>
            <Input id="investor" placeholder="Tên công ty / tổ chức..." {...register("investor")} />
            {errors.investor && <p className="text-sm text-red-500">{errors.investor.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expected-revenue" className="flex items-center gap-1.5">
              Doanh thu dự kiến (trđ) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="expected-revenue"
              type="number"
              min={0}
              step={0.1}
              placeholder="VD: 500"
              {...register("expectedRevenue")}
            />
            {errors.expectedRevenue && <p className="text-sm text-red-500">{errors.expectedRevenue.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="decision-maker" className="flex items-center gap-1.5">
              Người quyết định (Tên - SĐT) <span className="text-destructive">*</span>
            </Label>
            <Input id="decision-maker" placeholder="VD: Nguyễn Văn A - 0901234567" {...register("decisionMaker")} />
            {errors.decisionMaker && <p className="text-sm text-red-500">{errors.decisionMaker.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-person" className="flex items-center gap-1.5">
              Đầu mối (Tên - SĐT) <span className="text-destructive">*</span>
            </Label>
            <Input id="contact-person" placeholder="VD: Trần Thị B - 0912345678" {...register("contactPerson")} />
            {errors.contactPerson && <p className="text-sm text-red-500">{errors.contactPerson.message}</p>}
          </div>
        </div>
      </div>

      {/* SECTION 3: Đánh giá & Nghiệm thu */}
      <div className="border-border rounded-xl border bg-(--color-surface) p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-500">
            3
          </span>
          Đánh giá & Nghiệm thu
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="feasibility-score" className="flex items-center gap-1.5">
              Đánh giá khả thi (%) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="feasibility-score"
              type="number"
              min={0}
              max={100}
              placeholder="0 – 100"
              {...register("feasibilityScore")}
            />
            {errors.feasibilityScore && <p className="text-sm text-red-500">{errors.feasibilityScore.message}</p>}
          </div>

          {/* Ngày nghiệm thu — DatePicker component */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              Ngày dự kiến nghiệm thu <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="expectedCompletionDate"
              control={control}
              render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
            />
            {errors.expectedCompletionDate && (
              <p className="text-sm text-red-500">{errors.expectedCompletionDate.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: 4 bước cố định */}
      <div className="border-border rounded-xl border bg-(--color-surface) p-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-xs text-sky-500">
              4
            </span>
            Các bước triển khai
          </h3>
        </div>

        <div className="mt-3 space-y-2">
          {fields.map((field, index) => {
            const step = DEFAULT_STEPS.find((s) => s.stepOrder === field.stepOrder)!;
            const startDateError = errors.stepDates?.[index]?.startDate?.message;
            const endDateError = errors.stepDates?.[index]?.endDate?.message;

            return (
              <div key={field.id} className={`rounded-lg border p-3 transition-all`}>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/15 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                    {step.stepOrder}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{step.stepName}</p>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">
                          Bắt đầu <span className="text-destructive">*</span>
                        </Label>
                        <Controller
                          name={`stepDates.${index}.startDate`}
                          control={control}
                          render={({ field: controllerField }) => (
                            <DatePicker value={controllerField.value} onChange={controllerField.onChange} />
                          )}
                        />
                        {startDateError && <p className="mt-1 text-xs font-medium text-red-500">{startDateError}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">
                          Kết thúc <span className="text-destructive">*</span>
                        </Label>
                        <Controller
                          name={`stepDates.${index}.endDate`}
                          control={control}
                          render={({ field: controllerField }) => (
                            <DatePicker value={controllerField.value} onChange={controllerField.onChange} />
                          )}
                        />
                        {endDateError && <p className="mt-1 text-xs font-medium text-red-500">{endDateError}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="text-muted-foreground shrink-0 text-xs">{step.stepOrder * 25}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Lưu
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
