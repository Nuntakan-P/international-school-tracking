// School Grade Matrix — ported from data/pages.js renderGradeMatrix().
import { fmtM } from "@/lib/format";
import type { Grade, GradeMatrixEntry } from "@/lib/types";

const G: Record<Grade, { accent: string; bg: string; label: string; sub: string }> = {
  A: { accent: "#2e9e5b", bg: "#e6f5ec", label: "Grade A", sub: "Re-Score 85-100" },
  B: { accent: "#2f6fe0", bg: "#eaf1fd", label: "Grade B", sub: "Re-Score 70-84" },
  C: { accent: "#7a6ad0", bg: "#eeebfa", label: "Grade C", sub: "Re-Score 60-69" },
  D: { accent: "#e8554e", bg: "#fdeceb", label: "Grade D", sub: "Re-Score ≤59" },
};
const GRADES: Grade[] = ["A", "B", "C", "D"];

export function GradeMatrix({ gm }: { gm: Record<string, GradeMatrixEntry> }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 10 }}>
        {GRADES.map((g) => {
          const c = G[g];
          const d = gm[g];
          return (
            <div key={g} className="grade-cell" style={{ background: c.bg, border: `1.5px solid ${c.accent}33`, borderRadius: 12, padding: 13 }}>
              <div style={{ fontFamily: "var(--display)", fontSize: 19, fontWeight: 800, color: c.accent }}>{c.label}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 8px" }}>{c.sub}</div>
              <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, color: "var(--navy)" }}>{d.count}</div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 600 }}>Schools</div>
              <div style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 700, color: "var(--navy)", marginTop: 4 }}>{d.projects}</div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 600 }}>Projects</div>
              <div style={{ fontSize: 12, color: c.accent, fontWeight: 700, marginTop: 4 }}>{fmtM(d.value)}</div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>Project Value</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", margin: "8px 0 6px" }}>
        High Chance (≥70%)
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {GRADES.map((g) => {
          const c = G[g];
          const d = gm[g];
          return (
            <div key={g} className="grade-hc-cell" style={{ background: c.bg, border: `1.5px dashed ${c.accent}66`, borderRadius: 12, padding: 13 }}>
              <div style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 700, color: c.accent }}>{c.label}</div>
              <div style={{ fontSize: 10, color: "var(--muted)", margin: "1px 0 6px" }}>Chance ≥ 70%</div>
              <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--navy)" }}>{d.hcSchools}</div>
              <div style={{ fontSize: 10, color: "var(--ink-soft)", fontWeight: 600 }}>Schools</div>
              <div style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 700, color: "var(--navy)", marginTop: 3 }}>{d.hcProjects}</div>
              <div style={{ fontSize: 10, color: "var(--ink-soft)", fontWeight: 600 }}>Projects</div>
              <div style={{ fontSize: 11, color: c.accent, fontWeight: 700, marginTop: 3 }}>{fmtM(d.hcValue)}</div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>Value</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
