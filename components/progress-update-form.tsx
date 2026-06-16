"use client";

import { updateProjectProgress } from "@/actions/project";
import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, TrendingUp } from "lucide-react";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface Step {
  id: string;
  stepName: string;
  stepOrder: number;
  startDate?: Date | null;
  endDate?: Date | null;
}

interface ProjectFile {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  stepOrder: number;
  createdAt: Date;
}

interface ProgressUpdateFormProps {
  projectId: string;
  currentStepOrder: number;
  currentPercentage: number;
  steps: Step[];
  files?: ProjectFile[];
}

const STEP_PERCENTAGE: Record<number, number> = { 1: 25, 2: 50, 3: 75, 4: 100 };

export function ProgressUpdateForm({
  projectId,
  currentStepOrder,
  currentPercentage,
  steps,
  files = []
}: ProgressUpdateFormProps) {
  const [isPending, startTransition] = useTransition();

  const availableSteps = steps.filter((s) => s.stepOrder >= currentStepOrder);

  const formSchema = z.object({
    newStepOrder: z.number().int().min(currentStepOrder, `Bước phải >= ${currentStepOrder}`),
    note: z.string().min(1, "Tiến độ / Kết quả đã triển khai không được để trống"),
    nextPlan: z.string().min(1, "Kế hoạch triển khai tiếp theo không được để trống")
  });

  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    control
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { newStepOrder: currentStepOrder, note: "", nextPlan: "" },
    disabled: currentPercentage === 100
  });

  const selectedStep = watch("newStepOrder");
  const previewPercentage = STEP_PERCENTAGE[selectedStep] ?? currentPercentage;

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const result = await updateProjectProgress({
        projectId,
        newStepOrder: data.newStepOrder,
        note: data.note,
        nextPlan: data.nextPlan
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Cập nhật tiến độ thành công!");
        reset({ newStepOrder: data.newStepOrder, note: "", nextPlan: "" });
      }
    });
  };

  const currentStepFiles = files.filter((f) => f.stepOrder === currentStepOrder);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Chọn bước tiếp theo */}
      <div className="space-y-1.5">
        <Label htmlFor="newStepOrder">Bước tiến độ</Label>
        <Controller
          name="newStepOrder"
          control={control}
          render={({ field }) => (
            <Select value={field.value.toString()} onValueChange={(val) => field.onChange(parseInt(val, 10))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn bước tiến độ" />
              </SelectTrigger>
              <SelectContent>
                {availableSteps.map((step) => (
                  <SelectItem key={step.id} value={step.stepOrder.toString()}>
                    Bước {step.stepOrder}: {step.stepName}
                    {step.stepOrder === currentStepOrder ? " (hiện tại)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.newStepOrder && <p className="text-sm text-(--color-destructive)">{errors.newStepOrder.message}</p>}

        {/* Preview % */}
        <div className="flex items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-(--color-border)">
            <div
              className="h-full rounded-full bg-(--color-primary) transition-all duration-500"
              style={{ width: `${previewPercentage}%` }}
            />
          </div>
          <span className="text-sm font-bold text-(--color-primary) tabular-nums">{previewPercentage}%</span>
        </div>
        {/* <p className="text-xs text-(--color-text-muted)">% hoàn thành tự tính theo bước — không cần nhập thủ công</p> */}
      </div>

      {/* Tiến độ/Kết quả đã triển khai */}
      <div className="space-y-1.5">
        <Label htmlFor="note">Tiến độ / Kết quả đã triển khai</Label>
        <Textarea
          id="note"
          placeholder="Mô tả kết quả đã đạt được, công việc đã hoàn thành..."
          {...register("note")}
          rows={3}
        />
        {errors.note && <p className="text-sm text-red-500">{errors.note.message}</p>}
      </div>

      {/* Kế hoạch triển khai tiếp theo */}
      <div className="space-y-1.5">
        <Label htmlFor="nextPlan">Kế hoạch triển khai tiếp theo</Label>
        <Textarea
          id="nextPlan"
          placeholder="Mô tả kế hoạch công việc tiếp theo cần thực hiện..."
          {...register("nextPlan")}
          rows={3}
        />
        {errors.nextPlan && <p className="text-sm text-red-500">{errors.nextPlan.message}</p>}
      </div>

      {/* File đính kèm */}
      <div className="space-y-2">
        <Label htmlFor="nextPlan">File đính kèm bước {currentStepOrder}</Label>
        <div className="rounded-lg border border-(--color-border) p-3">
          <FileUpload projectId={projectId} stepOrder={currentStepOrder} existingFiles={currentStepFiles} />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className={cn("w-full md:w-auto", currentPercentage === 100 && "hidden")}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang cập nhật...
          </>
        ) : (
          <>
            <TrendingUp className="h-4 w-4" />
            Cập nhật tiến độ
          </>
        )}
      </Button>
    </form>
  );
}
