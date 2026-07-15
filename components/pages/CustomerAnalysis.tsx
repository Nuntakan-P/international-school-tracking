"use client";

// Page 3 — Customer Analysis. Ported from data/pages3.js customer().
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { RadarModal } from "@/components/modals/RadarModal";
import { GRADE_META } from "@/lib/radar";
import type { Grade, School } from "@/lib/types";

const GRADES: Grade[] = ["A", "B", "C", "D"];

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="tt-scorebar">
      <div className="tt-scorefill" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

function TooltipRow({ label, value, cls }: { label: string; value: React.ReactNode; cls?: string }) {
  return (
    <div className="tt-row">
      <span className="tt-lbl">{label}</span>
      <span className={`tt-val ${cls || ""}`}>{value ?? "—"}</span>
    </div>
  );
}

export function CustomerAnalysis() {
  const { filteredSchools: data } = useDashboard();
  const [query, setQuery] = useState("");
  const [highlightNo, setHighlightNo] = useState<number | null>(null);
  const [hoveredNo, setHoveredNo] = useState<number | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [radarSchool, setRadarSchool] = useState<School | null>(null);
  const tileRefs = useRef(new Map<number, HTMLDivElement>());
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null);

  const groups = useMemo(() => {
    const g: Record<Grade, School[]> = { A: [], B: [], C: [], D: [] };
    [...data]
      .sort((a, b) => (a.grade !== b.grade ? GRADES.indexOf(a.grade) - GRADES.indexOf(b.grade) : b.reScore - a.reScore))
      .forEach((s) => { if (g[s.grade]) g[s.grade].push(s); });
    return g;
  }, [data]);

  const hoveredSchool = hoveredNo != null ? data.find((s) => s.no === hoveredNo) || null : null;

  useLayoutEffect(() => {
    // Leaving tooltipPos stale while hidden is harmless — the tooltip is only
    // ever visible (opacity/pointer-events) when hoveredSchool is set.
    if (!hoveredSchool || !hoverRect) return;
    const tw = tooltipRef.current?.offsetWidth || 272;
    const th = tooltipRef.current?.offsetHeight || 420;
    const gap = 12, vw = window.innerWidth, vh = window.innerHeight;
    let x = hoverRect.right + gap;
    if (x + tw > vw - 8) x = hoverRect.left - tw - gap;
    if (x < 8) x = Math.max(8, vw - tw - 8);
    let y = hoverRect.top;
    if (y + th > vh - 8) y = vh - th - 8;
    if (y < 8) y = 8;
    setTooltipPos({ left: x, top: y });
  }, [hoveredSchool, hoverRect]);

  function handleSearch(q: string) {
    setQuery(q);
    if (!q.trim()) { setHighlightNo(null); return; }
    const needle = q.trim().toLowerCase();
    const match = data.find((s) => s.name.toLowerCase().includes(needle));
    if (match) {
      setHighlightNo(match.no);
      const el = tileRefs.current.get(match.no);
      if (el) {
        const top = window.pageYOffset + el.getBoundingClientRect().top - 120;
        window.scrollTo({ top, behavior: "smooth" });
      }
    } else {
      setHighlightNo(-1); // sentinel: "not found"
    }
  }

  const searchMatch = highlightNo != null && highlightNo !== -1 ? data.find((s) => s.no === highlightNo) : null;

  return (
    <div>
      <div className="page-head">
        <h2>Customer Analysis</h2>
        <span className="sub">Re-Score heat map · {data.length} schools · hover = ข้อมูล · คลิก = Radar Analysis</span>
      </div>

      <div className="ca-search-wrap">
        <input
          type="text"
          className="ca-search"
          placeholder="🔍 ค้นหาชื่อโรงเรียน... (Search school name)"
          autoComplete="off"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") { setQuery(""); setHighlightNo(null); } }}
        />
        <div className="ca-search-hint">
          {query.trim() && (searchMatch
            ? <span className="sh-found">✓ พบ: {searchMatch.name}</span>
            : <span className="sh-notfound">ไม่พบโรงเรียนที่ค้นหา</span>)}
        </div>
      </div>

      <div className="ca-legend card tight" style={{ marginBottom: 16 }}>
        <div className="ca-leg-grid">
          {GRADES.map((g) => {
            const c = GRADE_META[g];
            return (
              <div className="ca-leg-item" key={g}>
                <div className="ca-leg-dot" style={{ background: c.accent }} />
                <div>
                  <div className="ca-leg-name" style={{ color: c.text }}>
                    {c.label} <span style={{ fontWeight: 400, color: "var(--muted)" }}>{c.desc}</span>
                  </div>
                  <div className="ca-leg-cnt">{groups[g].length} schools</div>
                </div>
              </div>
            );
          })}
          <div className="ca-leg-sep" />
          <div className="ca-leg-hint">
            <u><b>Bold + Underline</b></u> = Score ลดลง ▼ &nbsp;|&nbsp; Regular = Score เพิ่ม / คงที่ ▲ &nbsp;·&nbsp; 🖱 คลิก tile เพื่อดู Radar Analysis
          </div>
        </div>
      </div>

      <div className="ca-sections">
        {GRADES.map((grade) => {
          const schools = groups[grade];
          if (!schools.length) return null;
          const c = GRADE_META[grade];
          return (
            <div className="ca-section" key={grade}>
              <div className="ca-sec-hd">
                <span className="ca-grade-badge" style={{ background: c.accent, color: "#fff" }}>Grade {grade}</span>
                <span className="ca-sec-title" style={{ color: c.text }}>{c.label}</span>
                <span className="ca-sec-desc">— {c.desc}</span>
                <span className="ca-sec-count">{schools.length} schools</span>
              </div>
              <div className="ca-grid">
                {schools.map((s) => {
                  const dec = s.reScore < s.initialScore;
                  const diff = s.reScore - s.initialScore;
                  const cssVars = {
                    "--tc": c.accent, "--tb": c.border, "--tbg": c.bg, "--tt": c.text,
                  } as React.CSSProperties & Record<string, string>;
                  return (
                    <div
                      key={s.no}
                      ref={(el) => { if (el) tileRefs.current.set(s.no, el); else tileRefs.current.delete(s.no); }}
                      className={`ca-tile ${highlightNo === s.no ? "ca-highlight" : ""}`}
                      style={cssVars}
                      tabIndex={0}
                      title="คลิกเพื่อดู Radar Analysis"
                      onMouseEnter={(e) => { setHoveredNo(s.no); setHoverRect(e.currentTarget.getBoundingClientRect()); }}
                      onMouseLeave={() => { setHoveredNo(null); setHoverRect(null); }}
                      onClick={() => { setHoveredNo(null); setRadarSchool(s); }}
                    >
                      <div className={`ca-name ${dec ? "ca-dec" : "ca-inc"}`}>{s.name}</div>
                      <div className="ca-tile-foot">
                        <span className="ca-re">{s.reScore}</span>
                        <span className={`ca-chg ${dec ? "neg" : "pos"}`}>{diff >= 0 ? "▲+" : "▼"}{Math.abs(diff)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div
        ref={tooltipRef}
        className={`ca-tooltip ${hoveredSchool ? "visible" : ""}`}
        role="tooltip"
        style={tooltipPos ? { left: tooltipPos.left, top: tooltipPos.top } : undefined}
      >
        {hoveredSchool && (() => {
          const c = GRADE_META[hoveredSchool.grade];
          const diff = hoveredSchool.reScore - hoveredSchool.initialScore;
          return (
            <>
              <div className="tt-head" style={{ borderLeftColor: c.accent }}>
                <div className="tt-school">{hoveredSchool.name}</div>
                <div className="tt-meta">{hoveredSchool.province} · {hoveredSchool.salesperson}</div>
              </div>
              <div className="tt-body">
                <div className="tt-score-block">
                  <div className="tt-grade-big" style={{ color: c.accent }}>Grade {hoveredSchool.grade}</div>
                  <div className="tt-score-nums">
                    <div style={{ flex: "0 0 auto" }}>
                      <span className="tt-lbl">Re-Score</span>
                      <span className="tt-big" style={{ color: c.accent }}>{hoveredSchool.reScore}</span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>/100</span>
                    </div>
                    <div style={{ flex: 1, color: c.accent }}><ScoreBar value={hoveredSchool.reScore} color={c.accent} /></div>
                  </div>
                  <div className={`tt-change ${diff >= 0 ? "pos" : "neg"}`}>
                    {diff >= 0 ? "▲" : "▼"} {Math.abs(diff)} pts from initial ({hoveredSchool.initialScore})
                  </div>
                </div>
                <div className="tt-divider" />
                <div className="tt-rows">
                  <TooltipRow label="Funnel Stage" value={<span className="tag funnel">{hoveredSchool.funnel}</span>} />
                  <TooltipRow label="Project Value" value={"฿" + hoveredSchool.projectValue.toLocaleString("en-US")} />
                  <TooltipRow label="Chance (%)" value={hoveredSchool.chance + "%"} cls={hoveredSchool.chance >= 60 ? "pos" : hoveredSchool.chance < 40 ? "neg" : ""} />
                  <TooltipRow label="Curriculum" value={hoveredSchool.curriculum} />
                  <TooltipRow label="Status" value={hoveredSchool.status} />
                </div>
                <div className="tt-divider" />
                <div className="tt-sec-hd">End of Year 2026</div>
                <div className="tt-rows">
                  <TooltipRow label="Tuition" value={hoveredSchool.tuition} />
                  <TooltipRow label="Class Level" value={hoveredSchool.classLevel} />
                  <TooltipRow label="No. of Student" value={hoveredSchool.students} />
                  <TooltipRow label="Facility Status" value={hoveredSchool.facilityStatus} />
                  <TooltipRow label="Ready Land" value={hoveredSchool.readyLand} />
                  <TooltipRow label="Reputation" value={hoveredSchool.reputation} />
                  <TooltipRow label="Relationship" value={hoveredSchool.relationship} />
                </div>
                <div className="tt-note">📅 {hoveredSchool.followUpDate || "—"} &nbsp;·&nbsp; 🖱 คลิกเพื่อดู Radar Analysis</div>
              </div>
            </>
          );
        })()}
      </div>

      <RadarModal school={radarSchool} onClose={() => setRadarSchool(null)} />
    </div>
  );
}
