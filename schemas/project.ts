import * as z from "zod";

export const StepDateSchema = z
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

export const projectSchema = z
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

export type ProjectFormValues = z.infer<typeof projectSchema>;
