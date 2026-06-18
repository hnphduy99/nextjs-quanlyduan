"use client";

import { updateProject } from "@/actions/project";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEFAULT_STEPS } from "@/lib/project-constants";
import { ProjectFormValues, projectSchema } from "@/schemas/project";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useEffect } from "react";
import { DefaultValues, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import ProjectForm from "./project-form";

interface ProjectStep {
  id: string;
  projectId: string;
  stepName: string;
  stepOrder: number;
  startDate: Date | string | null;
  endDate: Date | string | null;
}

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  category: "GPS_AN_NINH" | "KHCP_DN" | "GIAO_TIEP_CAN";
  investor: string | null;
  expectedRevenue: number | null;
  decisionMaker: string | null;
  contactPerson: string | null;
  deploymentType: "MUA" | "THUE";
  feasibilityScore: number | null;
  expectedCompletionDate: Date | string | null;
  steps: ProjectStep[];
}

interface UpdateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectData | null;
}

const getProjectFormValues = (project: ProjectData | null): DefaultValues<ProjectFormValues> => {
  return {
    name: project?.name || "",
    description: project?.description || "",
    category: project?.category,
    investor: project?.investor || "",
    expectedRevenue: project?.expectedRevenue?.toString() || "",
    decisionMaker: project?.decisionMaker || "",
    contactPerson: project?.contactPerson || "",
    deploymentType: project?.deploymentType,
    feasibilityScore: project?.feasibilityScore?.toString() || "",
    expectedCompletionDate: project?.expectedCompletionDate ? new Date(project.expectedCompletionDate) : undefined,
    stepDates: DEFAULT_STEPS.map((s) => {
      const step = project?.steps.find((st) => st.stepOrder === s.stepOrder);
      return {
        stepOrder: s.stepOrder,
        startDate: step?.startDate ? new Date(step.startDate) : undefined,
        endDate: step?.endDate ? new Date(step.endDate) : undefined
      };
    })
  };
};

export function UpdateProjectDialog({ open, onOpenChange, project }: UpdateProjectDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: getProjectFormValues(project)
  });

  const { fields } = useFieldArray({
    control,
    name: "stepDates"
  });

  useEffect(() => {
    if (project) {
      reset(getProjectFormValues(project));
    }
  }, [project, reset]);

  const onSubmit = async (data: ProjectFormValues) => {
    if (!project) return;

    const formattedData = {
      id: project.id,
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

    const result = await updateProject(formattedData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Cập nhật dự án thành công!");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Chỉnh sửa dự án</DialogTitle>
          <DialogDescription>Cập nhật thông tin dự án và thời hạn các bước triển khai</DialogDescription>
        </DialogHeader>

        <ProjectForm
          register={register}
          handleSubmit={handleSubmit}
          control={control}
          errors={errors}
          isSubmitting={isSubmitting}
          fields={fields}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
