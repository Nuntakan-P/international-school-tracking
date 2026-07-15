"use client";

// Radar analysis modal (7-dimension) — ported from data/pages3.js openRadar().
import { useEffect } from "react";
import { RadarChart } from "@/components/charts/RadarChart";
import { GRADE_META, RADAR_AXES, getRadarScore } from "@/lib/radar";
import type { School } from "@/lib/types";

export function RadarModal({ school, onClose }: { school: School | null; onClose: () => void }) {
  useEffect(() => {
    if (!school) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [school, onClose]);

  if (!school) return null;
  const c = GRADE_META[school.grade];
  const scores = RADAR_AXES.map((a) => getRadarScore(school, a.key));
  const chartLabels = RADAR_AXES.map((a) => a.label);

  return (
    <div className="radar-modal">
      <div className="radar-backdrop" onClick={onClose} />
      <div className="radar-card">
        <button className="radar-close" aria-label="Close" onClick={onClose}>✕</button>
        <div className="radar-header" style={{ borderTop: `4px solid ${c.accent}` }}>
          <span className="radar-grade-badge" style={{ background: c.accent }}>{school.grade}</span>
          <div>
            <div className="radar-school">{school.name}</div>
            <div className="radar-meta">
              {school.province} · {school.salesperson} · Re-Score <b style={{ color: c.accent }}>{school.reScore}</b>/100
            </div>
          </div>
        </div>
        <div className="radar-body">
          <div className="radar-chart-wrap">
            <RadarChart labels={chartLabels} scores={scores} accent={c.accent} name={school.name} />
          </div>
          <div className="radar-scores">
            <div className="radar-scores-title">7-Dimension Analysis</div>
            {RADAR_AXES.map((a, i) => {
              const sc = scores[i];
              const v = school[a.key] || "—";
              const label = Array.isArray(a.label) ? a.label.join(" ") : a.label;
              return (
                <div className="radar-row" key={a.key}>
                  <div className="radar-row-hd">
                    <span className="radar-dim">{label}</span>
                    <span className="radar-sc" style={{ color: c.accent }}>{sc}</span>
                  </div>
                  <div className="radar-val-txt">{v}</div>
                  <div style={{ height: 5, background: "var(--line-soft)", borderRadius: 4, overflow: "hidden", marginTop: 4 }}>
                    <div style={{ height: "100%", width: `${sc}%`, background: c.accent, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
