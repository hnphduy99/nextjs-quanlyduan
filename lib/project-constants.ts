/** 4 bước cố định mặc định cho mỗi dự án */
export const DEFAULT_STEPS = [
  { stepOrder: 1, stepName: "Tiếp cận khách hàng và tìm hiểu nhu cầu" },
  { stepOrder: 2, stepName: "Đề xuất giải pháp và viết đề án" },
  { stepOrder: 3, stepName: "Tham gia thầu và ký HĐ" },
  { stepOrder: 4, stepName: "Triển khai và hỗ trợ sau bán hàng" }
] as const;

/** % tự tính theo bước (bước hiện tại / tổng bước * 100) */
export function calcPercentageByStep(currentStep: number, totalSteps: number = 4): number {
  return Math.round((currentStep / totalSteps) * 100);
}
