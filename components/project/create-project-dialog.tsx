"use client";

import { createProject } from "@/actions/project";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEFAULT_STEPS } from "@/lib/project-constants";
import { ProjectFormValues, projectSchema } from "@/schemas/project";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import ProjectForm from "./project-form";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting }
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
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

  const resetForm = () => {
    reset();
  };

  const onSubmit = async (data: ProjectFormValues) => {
    const formattedData = {
      name: data.name,
      description: data.description,
      category: data.category,
      investor: data.investor,
      expectedRevenue: parseFloat(data.expectedRevenue),
      decisionMaker: data.decisionMaker,
      contactPerson: data.contactPerson,
      deploymentType: data.deploymentType,
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
      toast.error(result.error);
    } else {
      toast.success("Tạo dự án thành công!");
      resetForm();
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Tạo dự án mới</DialogTitle>
          <DialogDescription>Nhập đầy đủ thông tin để tạo dự án và 4 bước triển khai tự động</DialogDescription>
        </DialogHeader>

        <ProjectForm
          register={register}
          handleSubmit={handleSubmit}
          control={control}
          errors={errors}
          isSubmitting={isSubmitting}
          fields={fields}
          onSubmit={onSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
