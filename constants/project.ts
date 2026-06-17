export const CATEGORY_OPTIONS = [
  { value: "GPS_AN_NINH", label: "GPS An ninh" },
  { value: "KHCP_DN", label: "Dự án KHCP/DN" },
  { value: "GIAO_TIEP_CAN", label: "Giao tiếp cận" }
] as const;

export const DEPLOYMENT_OPTIONS = [
  { value: "MUA", label: "Mua" },
  { value: "THUE", label: "Thuê" }
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  GPS_AN_NINH: "GPS An ninh",
  KHCP_DN: "Dự án KHCP/DN",
  GIAO_TIEP_CAN: "Giao tiếp cận"
};

export const DEPLOYMENT_LABELS: Record<string, string> = {
  MUA: "Mua",
  THUE: "Thuê"
};

export const STEP_NAMES: Record<number, string> = {
  1: "Tiếp cận KH",
  2: "Đề xuất giải pháp",
  3: "Tham gia thầu",
  4: "Triển khai"
};

export const STEP_COLORS: Record<number, { bg: string; text: string; dot: string }> = {
  1: { bg: "bg-sky-500/15", text: "text-sky-400", dot: "bg-sky-400" },
  2: { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  3: { bg: "bg-rose-500/15", text: "text-rose-400", dot: "bg-rose-400" },
  4: { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" }
};
