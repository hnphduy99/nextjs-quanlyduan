export function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, "");
}

export const headerMapping: Record<string, string> = {
  tenduan: "name",
  têndựán: "name",
  ten: "name",
  projectname: "name",
  name: "name",

  mota: "description",
  môtả: "description",
  mơtả: "description",
  description: "description",

  phanloai: "category",
  phânloại: "category",
  category: "category",
  nhomduan: "category",
  nhómdựán: "category",

  chudautu: "investor",
  chủđầutư: "investor",
  investor: "investor",

  doanhthudukien: "expectedRevenue",
  doanhthudựkiến: "expectedRevenue",
  "doanhthudựkiến(trđ)": "expectedRevenue",
  expectedrevenue: "expectedRevenue",
  revenue: "expectedRevenue",

  nguoiquyetdinh: "decisionMaker",
  ngườiquyếtđịnh: "decisionMaker",
  decisionmaker: "decisionMaker",

  daumoi: "contactPerson",
  đầumối: "contactPerson",
  contactperson: "contactPerson",

  hinhthuctrienkhai: "deploymentType",
  hìnhthứctriểnkhai: "deploymentType",
  deploymenttype: "deploymentType",

  "đánhgiákhảthi(%)": "feasibilityScore",
  "danhgiakhathi(%)": "feasibilityScore",
  danhgiakhathi: "feasibilityScore",
  đánhgiákhảthi: "feasibilityScore",
  feasibilityscore: "feasibilityScore",

  ngaydukiennghiemthu: "expectedCompletionDate",
  ngàydựkiếnnghiệmthu: "expectedCompletionDate",
  ngaynghiemthudukien: "expectedCompletionDate",
  ngàynghiệmthudựkiến: "expectedCompletionDate",
  expectedcompletiondate: "expectedCompletionDate",
  completiondate: "expectedCompletionDate",

  // Step 1
  ngaybatdaubuoc1: "step1_startDate",
  ngàybắtđầubước1: "step1_startDate",
  ngaybatdaub1: "step1_startDate",
  startdateb1: "step1_startDate",
  startdatestep1: "step1_startDate",
  ngaykethucbuoc1: "step1_endDate",
  ngàykếtthúcbước1: "step1_endDate",
  ngaykethucb1: "step1_endDate",
  enddateb1: "step1_endDate",
  enddatestep1: "step1_endDate",

  // Step 2
  ngaybatdaubuoc2: "step2_startDate",
  ngàybắtđầubước2: "step2_startDate",
  ngaybatdaub2: "step2_startDate",
  startdateb2: "step2_startDate",
  startdatestep2: "step2_startDate",
  ngaykethucbuoc2: "step2_endDate",
  ngàykếtthúcbước2: "step2_endDate",
  ngaykethucb2: "step2_endDate",
  enddateb2: "step2_endDate",
  enddatestep2: "step2_endDate",

  // Step 3
  ngaybatdaubuoc3: "step3_startDate",
  ngàybắtđầubước3: "step3_startDate",
  ngaybatdaub3: "step3_startDate",
  startdateb3: "step3_startDate",
  startdatestep3: "step3_startDate",
  ngaykethucbuoc3: "step3_endDate",
  ngàykếtthúcbước3: "step3_endDate",
  ngaykethucb3: "step3_endDate",
  enddateb3: "step3_endDate",
  enddatestep3: "step3_endDate",

  // Step 4
  ngaybatdaubuoc4: "step4_startDate",
  ngàybắtđầubước4: "step4_startDate",
  ngaybatdaub4: "step4_startDate",
  startdateb4: "step4_startDate",
  startdatestep4: "step4_startDate",
  ngaykethucbuoc4: "step4_endDate",
  ngàykếtthúcbước4: "step4_endDate",
  ngaykethucb4: "step4_endDate",
  enddateb4: "step4_endDate",
  enddatestep4: "step4_endDate"
};

export function parseCategory(val: any): "GPS_AN_NINH" | "KHCP_DN" | "GIAO_TIEP_CAN" {
  if (!val) return "GPS_AN_NINH";
  const str = String(val).trim().toUpperCase();
  if (str.includes("AN NINH") || str === "GPS_AN_NINH") return "GPS_AN_NINH";
  if (str.includes("KHCP") || str.includes("DOANH NGHIEP") || str.includes("DN") || str === "KHCP_DN") return "KHCP_DN";
  if (str.includes("GIAO TIEP CAN") || str.includes("TIEP CAN") || str === "GIAO_TIEP_CAN") return "GIAO_TIEP_CAN";
  return "GPS_AN_NINH";
}

export function parseDeploymentType(val: any): "MUA" | "THUE" {
  if (!val) return "MUA";
  const str = String(val).trim().toUpperCase();
  if (str.includes("THUE") || str.includes("THUÊ") || str === "THUE") return "THUE";
  return "MUA";
}

export function parseNumber(val: any): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  const num = Number(cleaned);
  return isNaN(num) ? undefined : num;
}

export function parseFeasibilityScore(val: any): number | undefined {
  const num = parseNumber(val);
  if (num === undefined) return undefined;
  return Math.round(num);
}

export function parseDateString(val: any): string | undefined {
  if (!val) return undefined;
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (typeof val === "number" && val > 0) {
    const utcDays = val - 25569;
    const utcValue = utcDays * 86400 * 1000;
    const dateInfo = new Date(utcValue);
    if (!isNaN(dateInfo.getTime())) {
      return dateInfo.toISOString();
    }
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }
  return undefined;
}
