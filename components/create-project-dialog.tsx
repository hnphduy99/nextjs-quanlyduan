"use client";

import { createProject } from "@/actions/project";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_OPTIONS, DEPLOYMENT_OPTIONS } from "@/constants/project";
import { DEFAULT_STEPS } from "@/lib/project-constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Building2, CircleDollarSign, Loader2, Phone, Plus, ShieldCheck, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Textarea } from "./ui/textarea";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StepDateSchema = z
  .object({
    stepOrder: z.number().int().positive(),
    startDate: z.date({ message: "Ngày bắt đầu không được để trống" }),
    endDate: z.date({ message: "Ngày kết thúc không được để trống" })
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return data.startDate <= data.endDate;
    },
    {
      message: "Ngày bắt đầu không được sau ngày kết thúc",
      path: ["startDate"]
    }
  );

const formSchema = z
  .object({
    name: z.string().min(1, "Tên dự án không được trống"),
    description: z.string().optional(),
    category: z.enum(["GPS_AN_NINH", "KHCP_DN", "GIAO_TIEP_CAN"], {
      error: "Phân loại không được trống"
    }),
    investor: z.string().min(1, "Chủ đầu tư không được trống"),
    expectedRevenue: z.string().min(1, "Doanh thu dự kiến không được trống"),
    decisionMaker: z.string().min(1, "Người quyết định không được trống"),
    contactPerson: z.string().min(1, "Đầu mối không được trống"),
    deploymentType: z.enum(["MUA", "THUE"], {
      error: "Hình thức triển khai không được trống"
    }),
    feasibilityScore: z.string().min(1, "Đánh giá khả thi không được trống"),
    expectedCompletionDate: z.date({ message: "Ngày dự kiến nghiệm thu không được trống" }),
    stepDates: z.array(StepDateSchema).length(4, "Phải có đầy đủ 4 bước")
  })
  .superRefine((data, ctx) => {
    const steps = data.stepDates;
    for (let i = 1; i < steps.length; i++) {
      const prev = steps[i - 1];
      const current = steps[i];

      if (prev.endDate && current.startDate && current.startDate < prev.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Không được trước ngày kết thúc của Bước ${prev.stepOrder}`,
          path: ["stepDates", i, "startDate"]
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: undefined,
      investor: "",
      expectedRevenue: "",
      decisionMaker: "",
      contactPerson: "",
      deploymentType: undefined,
      feasibilityScore: "",
      expectedCompletionDate: undefined,
      stepDates: DEFAULT_STEPS.map((s) => ({
        stepOrder: s.stepOrder,
        startDate: undefined,
        endDate: undefined
      }))
    }
  });

  const { fields } = useFieldArray({
    control,
    name: "stepDates"
  });

  const [error, setError] = useState("");

  const resetForm = () => {
    reset();
    setError("");
  };

  const onSubmit = async (data: FormValues) => {
    setError("");

    const formattedData = {
      name: data.name,
      description: data.description,
      category: data.category as "GPS_AN_NINH" | "KHCP_DN" | "GIAO_TIEP_CAN",
      investor: data.investor,
      expectedRevenue: parseFloat(data.expectedRevenue),
      decisionMaker: data.decisionMaker,
      contactPerson: data.contactPerson,
      deploymentType: data.deploymentType as "MUA" | "THUE",
      feasibilityScore: parseInt(data.feasibilityScore, 10),
      expectedCompletionDate: format(data.expectedCompletionDate, "yyyy-MM-dd"),
      stepDates: data.stepDates.map((sd) => ({
        stepOrder: sd.stepOrder,
        startDate: format(sd.startDate, "yyyy-MM-dd"),
        endDate: format(sd.endDate, "yyyy-MM-dd")
      }))
    };

    const result = await createProject(formattedData);
    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success("Tạo dự án thành công!");
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Tạo dự án mới</DialogTitle>
          <DialogDescription>Nhập đầy đủ thông tin để tạo dự án và 4 bước triển khai tự động</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* SECTION 1: Thông tin cơ bản */}
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-(--color-text)">
              <span className="bg-primary/20 flex h-5 w-5 items-center justify-center rounded-full text-xs text-(--color-primary)">
                1
              </span>
              Thông tin dự án
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="project-name">
                  Tên dự án <span className="text-(--color-destructive)">*</span>
                </Label>
                <Input id="project-name" placeholder="VD: Hệ thống camera giám sát ABC..." {...register("name")} />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="project-desc">Mô tả</Label>
                <Textarea
                  id="project-desc"
                  placeholder="Mô tả chi tiết dự án..."
                  rows={2}
                  {...register("description")}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Category — Radix Select */}
                <div className="space-y-1.5">
                  <Label>
                    Phân loại dự án <span className="text-(--color-destructive)">*</span>
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
                    Hình thức triển khai <span className="text-(--color-destructive)">*</span>
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
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-(--color-text)">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-xs text-amber-500">
                2
              </span>
              Thông tin khách hàng
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="investor" className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-(--color-text-muted)" />
                  Chủ đầu tư <span className="text-(--color-destructive)">*</span>
                </Label>
                <Input id="investor" placeholder="Tên công ty / tổ chức..." {...register("investor")} />
                {errors.investor && <p className="text-sm text-red-500">{errors.investor.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expected-revenue" className="flex items-center gap-1.5">
                  <CircleDollarSign className="h-3.5 w-3.5 text-(--color-text-muted)" />
                  Doanh thu dự kiến (trđ) <span className="text-(--color-destructive)">*</span>
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
                  <Phone className="h-3.5 w-3.5 text-(--color-text-muted)" />
                  Người quyết định (Tên - SĐT) <span className="text-(--color-destructive)">*</span>
                </Label>
                <Input id="decision-maker" placeholder="VD: Nguyễn Văn A - 0901234567" {...register("decisionMaker")} />
                {errors.decisionMaker && <p className="text-sm text-red-500">{errors.decisionMaker.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-person" className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-(--color-text-muted)" />
                  Đầu mối (Tên - SĐT) <span className="text-(--color-destructive)">*</span>
                </Label>
                <Input id="contact-person" placeholder="VD: Trần Thị B - 0912345678" {...register("contactPerson")} />
                {errors.contactPerson && <p className="text-sm text-red-500">{errors.contactPerson.message}</p>}
              </div>
            </div>
          </div>

          {/* SECTION 3: Đánh giá & Nghiệm thu */}
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-(--color-text)">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-500">
                3
              </span>
              Đánh giá & Nghiệm thu
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="feasibility-score" className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-(--color-text-muted)" />
                  Đánh giá khả thi (%) <span className="text-(--color-destructive)">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="feasibility-score"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0 – 100"
                    className="pr-8"
                    {...register("feasibilityScore")}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-(--color-text-muted)">
                    %
                  </span>
                </div>
                {errors.feasibilityScore && <p className="text-sm text-red-500">{errors.feasibilityScore.message}</p>}
              </div>

              {/* Ngày nghiệm thu — DatePicker component */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-(--color-text-muted)" />
                  Ngày dự kiến nghiệm thu <span className="text-(--color-destructive)">*</span>
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
                const hasError = !!(startDateError || endDateError);

                return (
                  <div
                    key={field.id}
                    className={`rounded-lg border p-3 transition-all ${
                      hasError ? "border-red-500/50 bg-red-500/5" : "border-border"
                    }`}
                  >
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
                            {startDateError && (
                              <p className="mt-1 text-xs font-medium text-red-500">{startDateError}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs">
                              Kết thúc <span className="text-(--color-destructive)">*</span>
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
            <p className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />% hoàn thành tự tính: B1=25%, B2=50%, B3=75%,
              B4=100%
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Tạo dự án
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
