// Shared domain types — mirrors the Master_Database schema documented in the
// design handoff README ("School Record Schema" / "State Object").

export type Grade = "A" | "B" | "C" | "D";
export type Tier = "HH" | "HL" | "LH" | "LL";

export interface Project {
  projectNo: number;
  product: string;
  funnel: string;
  funnelIdx: number;
  projectValue: number;
  chance: number;
  weightedValue: number;
  status: string;
  updatedAction: string;
  updatedDate: string;
  updatedSerial?: number;
  followUpAction: string;
  followUpDate: string;
  followUpSerial?: number;
}

export interface School {
  no: number;
  name: string;
  province: string;
  funnel: string;
  funnelIdx: number;
  tier: Tier;
  salesperson: string;
  curriculum: string;
  initialScore: number;
  reScore: number;
  grade: Grade;
  initialGrade?: Grade;
  projectValue: number;
  chance: number;
  weightedValue: number;
  numProjects: number;
  projects: Project[];
  status: string;
  updatedAction: string;
  updatedDate: string;
  followUpAction: string;
  followUpDate: string;
  active: boolean;
  activeProjects: number;
  winProjects: number;
  lostProjects: number;
  winValue: number;
  lostValue: number;
  isWinSchool: boolean;
  isLostSchool: boolean;
  isConsiderSchool: boolean;
  considerProjects: number;
  considerValue: number;
  quotationActions: number;
  poInstallActions: number;
  mainProduct?: string;
  tuition: string;
  classLevel: string;
  students: string;
  facilityStatus: string;
  readyLand: string;
  reputation: string;
  relationship: string;
  customerType?: string;
  updatedThisMonth: boolean;
}

/** Per person + school + month plan/actual counts (8 funnel stages). */
export interface PlanActualGranular {
  person: string;
  school: string;
  grade: string;
  month: string;
  plan: number[];
  actual: number[];
}

/**
 * Two shapes coexist (matching the prototype): the seed dataset uses the
 * "legacy" shape (one {plan,actual} bucket per salesperson name), while a
 * parsed workbook produces the "granular" shape (per school + month rows).
 * `[key: string]: unknown` accommodates the legacy per-salesperson keys.
 */
export interface PlanActualData {
  stages: string[];
  granular?: PlanActualGranular[];
  persons?: string[];
  [salesperson: string]: unknown;
}

export interface Filters {
  sales: string;
  year: string;
  month: string;
  grade: string;
}

export type MapMode = "map" | "bar";
export type TopMode = "score" | "value" | "chance";
export type PageId = "executive" | "pipeline" | "customer" | "score" | "plan";

export interface KpiSet {
  totalSchools: number;
  activeSchools: number;
  activeOpportunities: number;
  activeProjects: number;
  activePct: number;
  totalProjectValue: number;
  weightedPipeline: number;
  winRate: number;
  winProjects: number;
  lostProjects: number;
  winSchools: number;
  winValue: number;
  wins: number;
  winConversionRate: number;
  quotationActions: number;
  poInstallActions: number;
  lostRate: number;
  lostSchools: number;
  lostValue: number;
  lostConversionRate: number;
  considerSchools: number;
  considerProjects: number;
  considerValue: number;
  considerChance: number;
  leadSchools: number;
  leadProjects: number;
  leadValue: number;
  considerOnlySchools: number;
  considerOnlyProjects: number;
  considerOnlyValue: number;
  avgReScore: number;
  openFollowUps: number;
  openFollowUpsProjects: number;
  updatedThisMonth: number;
  updatedThisMonthProjects: number;
  totalProjects: number;
  highChanceProjects: number;
}

export interface FunnelRow {
  stage: string;
  count: number;
  pct: number;
}

export interface SalespersonRow {
  name: string;
  pipeline: number;
  projectValue: number;
  poCount: number;
  installCount: number;
  schools: number;
}

export interface ProvinceRow {
  province: string;
  value: number;
  schoolCount: number;
  schools: { name: string; grade: Grade }[];
  totalProjects: number;
}

export interface TierMatrixEntry {
  count: number;
  value: number;
}

export interface GradeMatrixEntry {
  count: number;
  value: number;
  projects: number;
  hcSchools: number;
  hcProjects: number;
  hcValue: number;
}

export interface CurriculumRow {
  name: string;
  count: number;
  pct: number;
}

export interface ScoreImprovement {
  improved: number;
  same: number;
  decreased: number;
  improvedPct: number;
  samePct: number;
  decreasedPct: number;
}

export interface AvgScoreRow {
  tier: Grade | "Total";
  initial: number;
  reScore: number;
  change: number;
  n: number;
}

export interface ScoreDistBucket {
  label: string;
  count: number;
  pct: number;
}

export interface ScatterPoint {
  x: number;
  y: number;
  grade: Grade;
  name: string;
}

export interface PlanVsActualRow {
  stage: string;
  plan: number;
  actual: number;
  pct: number;
}

export interface PlanVsActualResult {
  rows: PlanVsActualRow[];
  totalPlan: number;
  totalActual: number;
  achievement: number;
}

export interface PipelineRow {
  no: number;
  name: string;
  province: string;
  funnel: string;
  projectValue: number;
  chance: number;
  weightedValue: number;
  salesperson: string;
  grade: Grade;
  reScore: number;
  tier: Tier;
  projectLabel: string;
  updatedAction: string;
  updatedDate: string;
  followUpAction: string;
  followUpDate: string;
}

export type AlertLevel = "Urgent" | "Warning" | "Upcoming" | "On Progress";
