// Customer Analysis grade styling + 7-dimension radar scoring —
// ported from data/pages3.js (GRADE / SCORE_MAP / AXES / getScore).
import type { Grade, School } from "./types";

export const GRADE_META: Record<Grade, { bg: string; border: string; text: string; accent: string; label: string; desc: string }> = {
  A: { bg: "#e6f5ec", border: "#2e9e5b", text: "#1a6b37", accent: "#2e9e5b", label: "Re-Score A (85-100)", desc: "Top Priority" },
  B: { bg: "#eaf1fd", border: "#2f6fe0", text: "#1b4f9c", accent: "#2f6fe0", label: "Re-Score B (70-84)", desc: "High Potential" },
  C: { bg: "#eeebfa", border: "#7a6ad0", text: "#4a3a9c", accent: "#7a6ad0", label: "Re-Score C (60-69)", desc: "Medium Priority" },
  D: { bg: "#fdeceb", border: "#e8554e", text: "#b53b34", accent: "#e8554e", label: "Re-Score D (≤59)", desc: "Monitor" },
};

export type RadarKey = "tuition" | "classLevel" | "students" | "facilityStatus" | "readyLand" | "reputation" | "relationship";

const SCORE_MAP: Record<RadarKey, Record<string, number> & { _def: number }> = {
  tuition: { "High (>500K/yr)": 100, "Mid (200-500K/yr)": 55, "Low (<200K/yr)": 20, _def: 30 },
  classLevel: { "Early-Nursery & Primary & Secondary": 100, "Primary & Secondary": 80, "Early-Nursery": 60, Primary: 50, Secondary: 40, _def: 50 },
  students: { "≥801": 100, "400-800": 60, "399≤": 25, _def: 30 },
  facilityStatus: { "New & Modern": 100, "Good Condition": 75, "Old & Deteriorated": 40, Insufficient: 20, _def: 40 },
  readyLand: { "New Area & Ready to Develop": 100, "Old Area & Ready to Develop": 70, "Old Area & Waiting a Budget": 35, "No Land Available": 10, _def: 40 },
  reputation: { "Advertise & Low Competition": 100, "No Advertise & Low Competition": 75, "Advertise & High Competition": 50, "No Advertise & High Competition": 25, _def: 50 },
  relationship: { "Reach to Owner": 100, "Reach to Principal": 75, "Reach to Procurement": 50, "No Contact": 20, _def: 40 },
};

export const RADAR_AXES: { key: RadarKey; label: string | string[] }[] = [
  { key: "tuition", label: "Tuition" },
  { key: "classLevel", label: "Class Level" },
  { key: "students", label: "No. of Students" },
  { key: "facilityStatus", label: "Facility Status" },
  { key: "readyLand", label: "Ready Land" },
  { key: "reputation", label: ["Reputation &", "Competition"] },
  { key: "relationship", label: "Relationship" },
];

export function getRadarScore(s: School, key: RadarKey): number {
  const map = SCORE_MAP[key];
  const v = s[key];
  if (!v) return map._def;
  return map[v] !== undefined ? map[v] : map._def;
}
