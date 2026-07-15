// Formatting + date/alert helpers — ported from data/charts.js (fmtM/fmtTHB)
// and data/pages2.js (parseDisplayDate / followUpAlertClass / alert level logic).
import type { AlertLevel } from "./types";

export function fmtM(v: number): string {
  if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(0) + "K";
  return "" + v;
}

export function fmtTHB(v: number): string {
  return "฿" + v.toLocaleString("en-US");
}

export function chanceClass(c: number): "g" | "y" | "r" {
  return c >= 60 ? "g" : c >= 40 ? "y" : "r";
}

const MONTH_ABBR: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Parses the display date format used throughout the app, e.g. "23 Jan 26". */
export function parseDisplayDate(s?: string | null): Date | null {
  if (!s) return null;
  const m = String(s).match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const mon = MONTH_ABBR[m[2].toLowerCase()];
  const yr = parseInt(m[3], 10);
  if (mon === undefined || isNaN(day)) return null;
  return new Date(yr < 100 ? 2000 + yr : yr, mon, day);
}

/** Alert level label based on days remaining until the given display date. */
export function alertLevel(dateStr?: string | null): AlertLevel | "" {
  const fd = parseDisplayDate(dateStr);
  if (!fd) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  fd.setHours(0, 0, 0, 0);
  const diff = Math.round((fd.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "Urgent";
  if (diff <= 3) return "Warning";
  if (diff <= 7) return "Upcoming";
  return "On Progress";
}

const LEVEL_TO_CSS_CLASS: Record<AlertLevel, string> = {
  Urgent: "fu-overdue",
  Warning: "fu-urgent",
  Upcoming: "fu-upcoming",
  "On Progress": "fu-ontrack",
};

const LEVEL_TO_DOT_CLASS: Record<AlertLevel, string> = {
  Urgent: "urgent",
  Warning: "warning",
  Upcoming: "upcoming",
  "On Progress": "onprogress",
};

/** Tag border/background CSS class (`fu-overdue`/`fu-urgent`/`fu-upcoming`/`fu-ontrack`). */
export function followUpAlertClass(dateStr?: string | null): string {
  const level = alertLevel(dateStr);
  return level ? LEVEL_TO_CSS_CLASS[level] : "";
}

/** Dot indicator class (`urgent`/`warning`/`upcoming`/`onprogress`). */
export function alertDotClass(level: AlertLevel): string {
  return LEVEL_TO_DOT_CLASS[level];
}

export const ALERT_LEVELS: AlertLevel[] = ["Urgent", "Warning", "Upcoming", "On Progress"];
