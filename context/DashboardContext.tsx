"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import * as XLSX from "xlsx";
import { parseWorkbook } from "@/lib/parser";
import { SEED_PLAN_ACTUAL, SEED_SCHOOLS } from "@/lib/seedData";
import { parseDisplayDate } from "@/lib/format";
import type { Filters, MapMode, PageId, PlanActualData, School, TopMode } from "@/lib/types";

const DEFAULT_FILTERS: Filters = { sales: "All", year: "All", month: "All", grade: "All" };

// The prototype's yearKey/monthNum sliced an ISO "yyyy-mm-dd" string, but every
// updatedDate in play (seed data + parsed workbook) is the display format
// "D Mon YY" — that mismatch made the Year/Month filters a no-op. Parsing the
// real format here is what keeps those two dropdowns actually filtering.
function yearKey(d?: string): string {
  const parsed = parseDisplayDate(d);
  return parsed ? String(parsed.getFullYear()) : "";
}
function monthNum(d?: string): string {
  const parsed = parseDisplayDate(d);
  return parsed ? String(parsed.getMonth() + 1).padStart(2, "0") : "";
}

interface DashboardState {
  schools: School[];
  planActual: PlanActualData;
  filters: Filters;
  filteredSchools: School[];
  page: PageId;
  setPage: (p: PageId) => void;
  mapMode: MapMode;
  setMapMode: (m: MapMode) => void;
  topMode: TopMode;
  setTopMode: (m: TopMode) => void;
  projectFilter: string;
  setProjectFilter: (v: string) => void;
  activityFilter: string;
  setActivityFilter: (v: string) => void;
  followUpFilter: string;
  setFollowUpFilter: (v: string) => void;
  updatedAlertFilter: string;
  setUpdatedAlertFilter: (v: string) => void;
  followUpAlertFilter: string;
  setFollowUpAlertFilter: (v: string) => void;
  paMonth: string;
  setPaMonth: (v: string) => void;
  paGrade: string;
  setPaGrade: (v: string) => void;
  dataLabel: string;
  setFilter: (key: keyof Filters, value: string) => void;
  resetFilters: () => void;
  uploadWorkbook: (file: File) => void;
  exportCSV: () => void;
  updateSchoolField: (no: number, projectNo: number | null, field: "projectValue" | "chance", value: number) => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const DashboardContext = createContext<DashboardState | null>(null);

export function useDashboard(): DashboardState {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within a DashboardProvider");
  return ctx;
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [schools, setSchools] = useState<School[]>(SEED_SCHOOLS);
  const [planActual, setPlanActual] = useState<PlanActualData>(SEED_PLAN_ACTUAL);
  const [dataLabel, setDataLabel] = useState("Seed dataset (demo)");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState<PageId>("executive");
  const [mapMode, setMapMode] = useState<MapMode>("map");
  const [topMode, setTopMode] = useState<TopMode>("score");
  const [projectFilter, setProjectFilter] = useState("All");
  const [activityFilter, setActivityFilter] = useState("All");
  const [followUpFilter, setFollowUpFilter] = useState("All");
  const [updatedAlertFilter, setUpdatedAlertFilter] = useState("All");
  const [followUpAlertFilter, setFollowUpAlertFilter] = useState("All");
  const [paMonth, setPaMonth] = useState("All");
  const [paGrade, setPaGrade] = useState("All");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const setFilter = useCallback((key: keyof Filters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const filteredSchools = useMemo(() => {
    const f = filters;
    return schools.filter((s) =>
      (f.sales === "All" || s.salesperson === f.sales) &&
      (f.year === "All" || yearKey(s.updatedDate) === f.year) &&
      (f.month === "All" || monthNum(s.updatedDate) === f.month) &&
      (f.grade === "All" || s.grade === f.grade)
    );
  }, [schools, filters]);

  const uploadWorkbook = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const result = ev.target?.result;
        if (!(result instanceof ArrayBuffer)) return;
        const wb = XLSX.read(new Uint8Array(result), { type: "array" });
        const parsed = parseWorkbook(wb);
        if (parsed.schools.length) {
          setSchools(parsed.schools);
          if (parsed.planActual) setPlanActual(parsed.planActual);
          setDataLabel(file.name);
          setFilters(DEFAULT_FILTERS);
          showToast("Loaded " + parsed.schools.length + " schools from " + file.name);
        } else {
          showToast("No school rows found — check the Master_Database sheet");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        showToast("Could not read file: " + message);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [showToast]);

  const exportCSV = useCallback(() => {
    const rows = filteredSchools;
    const cols: (keyof School)[] = [
      "no", "name", "province", "funnel", "tier", "salesperson", "curriculum",
      "initialScore", "reScore", "grade", "projectValue", "chance", "weightedValue", "status",
    ];
    const head = cols.join(",");
    const body = rows.map((r) => cols.map((c) => {
      const v = r[c];
      return typeof v === "string" && v.includes(",") ? `"${v}"` : v;
    }).join(",")).join("\n");
    const blob = new Blob([head + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "international_school_tracking.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("Exported " + rows.length + " rows to CSV");
  }, [filteredSchools, showToast]);

  const updateSchoolField = useCallback((no: number, projectNo: number | null, field: "projectValue" | "chance", value: number) => {
    setSchools((prev) => prev.map((s) => {
      if (s.no !== no) return s;
      if (projectNo == null) {
        const next = { ...s, [field]: value };
        next.weightedValue = Math.round(next.projectValue * next.chance / 100);
        return next;
      }
      const projects = s.projects.map((p) => {
        if (p.projectNo !== projectNo) return p;
        const nextP = { ...p, [field]: value };
        nextP.weightedValue = Math.round(nextP.projectValue * nextP.chance / 100);
        return nextP;
      });
      const headline = projects.find((p) => p.projectNo === 1);
      const patchedHead = projectNo === 1 && headline
        ? { [field]: value, weightedValue: headline.weightedValue }
        : {};
      return { ...s, projects, ...patchedHead };
    }));
  }, []);

  const value: DashboardState = {
    schools, planActual, filters, filteredSchools,
    page, setPage, mapMode, setMapMode, topMode, setTopMode,
    projectFilter, setProjectFilter, activityFilter, setActivityFilter,
    followUpFilter, setFollowUpFilter, updatedAlertFilter, setUpdatedAlertFilter,
    followUpAlertFilter, setFollowUpAlertFilter, paMonth, setPaMonth, paGrade, setPaGrade,
    dataLabel, setFilter, resetFilters, uploadWorkbook, exportCSV, updateSchoolField,
    toast, showToast,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}
