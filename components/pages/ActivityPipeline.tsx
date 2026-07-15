"use client";

// Page 5 — Activity Pipeline. Ported from data/pages2.js plan().
import * as A from "@/lib/analytics";
import { alertLevel } from "@/lib/format";
import { FUNNEL_STAGES } from "@/lib/seedData";
import { useDashboard } from "@/context/DashboardContext";
import { PlanActualChart } from "@/components/charts/PlanActualChart";
import { Gauge } from "@/components/charts/Gauge";
import { Icon } from "@/components/icons/Icon";
import type { AlertLevel } from "@/lib/types";

const MONTHS = ["All", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const GRADES = ["All", "A", "B", "C", "D"];
const ALERT_KEYS: AlertLevel[] = ["Urgent", "Warning", "Upcoming", "On Progress"];

type AlertMatrix = Record<string, Record<AlertLevel, number>>;

function emptyMatrix(): AlertMatrix {
  const m: AlertMatrix = {};
  FUNNEL_STAGES.forEach((st) => { m[st] = { Urgent: 0, Warning: 0, Upcoming: 0, "On Progress": 0 }; });
  return m;
}

export function ActivityPipeline() {
  const {
    filteredSchools: data, planActual, filters, paMonth, setPaMonth, paGrade, setPaGrade,
  } = useDashboard();
  const sales = filters.sales;
  const pa = A.planVsActual(planActual, sales, paMonth, paGrade);

  const allPipeRows = A.pipelineRows(data, "All");
  const updMatrix = emptyMatrix();
  const folMatrix = emptyMatrix();
  allPipeRows.forEach((r) => {
    if (r.updatedAction && updMatrix[r.updatedAction]) {
      const level = alertLevel(r.updatedDate);
      if (level) updMatrix[r.updatedAction][level]++;
    }
    if (r.followUpAction && folMatrix[r.followUpAction]) {
      const level = alertLevel(r.followUpDate);
      if (level) folMatrix[r.followUpAction][level]++;
    }
  });
  const rowTotal = (m: Record<AlertLevel, number>) => m.Urgent + m.Warning + m.Upcoming + m["On Progress"];
  const stageTotal = (m: AlertMatrix, st: string) => (m[st] ? rowTotal(m[st]) : 0);
  const grandTotal = (m: AlertMatrix) => FUNNEL_STAGES.reduce((s, st) => s + stageTotal(m, st), 0);

  return (
    <div>
      <div className="page-head">
        <h2>Activity Performance</h2>
        <span className="sub">Sales activity plan vs actual{sales !== "All" ? " · " + sales : ""}</span>
      </div>

      <div className="filters" style={{ marginBottom: 14 }}>
        <span className="filter-label"><Icon name="filter" />Activity Filters</span>
        <div className="select-wrap">
          <select className="fsel" value={paMonth} onChange={(e) => setPaMonth(e.target.value)}>
            {MONTHS.map((o) => <option key={o} value={o}>{o === "All" ? "All Months" : o}</option>)}
          </select>
        </div>
        <div className="select-wrap">
          <select className="fsel" value={paGrade} onChange={(e) => setPaGrade(e.target.value)}>
            {GRADES.map((o) => <option key={o} value={o}>{o === "All" ? "All Grades" : "Grade " + o}</option>)}
          </select>
        </div>
      </div>

      <div className="grid col-7-5">
        <div className="card">
          <div className="card-title">Activity Performance</div>
          <div className="card-sub">Activity count per pipeline stage · Plan (top) → Actual (bottom)</div>
          <div className="chart-h h380" style={{ marginTop: 6 }}><PlanActualChart pa={pa} /></div>
        </div>
        <div className="card ach-card">
          <div className="card-title" style={{ alignSelf: "flex-start" }}>Achievement Summary</div>
          <div className="card-sub" style={{ alignSelf: "flex-start" }}>
            Overall actual ÷ plan{paMonth !== "All" ? " · " + paMonth : ""}{paGrade !== "All" ? " · Grade " + paGrade : ""}
          </div>
          <div style={{ margin: "14px 0 4px" }}><Gauge pct={pa.achievement} /></div>
          <h4>Overall Achievement</h4>
          <div className="ach-foot">
            <div><div className="l">Total Plan</div><div className="v">{pa.totalPlan}</div></div>
            <div><div className="l">Total Actual</div><div className="v">{pa.totalActual}</div></div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-title">Updated &amp; Follow-Up Activity</div>
        <div className="card-sub">Alert status summary per pipeline stage · based on current date</div>
        <div className="grid col-2" style={{ marginTop: 10, gap: 16 }}>
          {[{ title: "Updated Action", m: updMatrix }, { title: "Follow-Up Action", m: folMatrix }].map(({ title, m }) => (
            <div key={title}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 8 }}>{title}</div>
              <div className="tbl-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Stage</th>
                      <th className="c"><span className="adot urgent" />Urgent</th>
                      <th className="c"><span className="adot warning" />Warning</th>
                      <th className="c"><span className="adot upcoming" />Upcoming</th>
                      <th className="c"><span className="adot onprogress" />On Progress</th>
                      <th className="c r">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FUNNEL_STAGES.map((st) => {
                      const row = m[st];
                      const total = rowTotal(row);
                      return (
                        <tr key={st}>
                          <td><span className="tag funnel">{st}</span></td>
                          {ALERT_KEYS.map((k) => (
                            <td key={k} className={`c${row[k] ? " fu-cell-" + (k === "Urgent" ? "r" : k === "Warning" ? "y" : k === "Upcoming" ? "b" : "g") : ""}`}>
                              {row[k] || "—"}
                            </td>
                          ))}
                          <td className="c r num">{total || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-title">Activity Breakdown by Stage</div>
        <div className="card-sub">Plan · Actual · Achievement per stage + Updated &amp; Follow-Up summary</div>
        <div className="tbl-wrap" style={{ marginTop: 10 }}>
          <table className="data">
            <thead>
              <tr><th>Stage</th><th className="r">Plan</th><th className="r">Actual</th><th className="r">Gap</th><th className="c">% Achieve</th><th className="c">Updated</th><th className="c">Follow-Up</th></tr>
            </thead>
            <tbody>
              {pa.rows.map((r) => {
                const uTot = stageTotal(updMatrix, r.stage);
                const fTot = stageTotal(folMatrix, r.stage);
                const gap = r.actual - r.plan;
                return (
                  <tr key={r.stage}>
                    <td><span className="tag funnel">{r.stage}</span></td>
                    <td className="r num">{r.plan}</td>
                    <td className="r num">{r.actual}</td>
                    <td className="r num" style={{ color: gap < 0 ? "var(--red)" : "var(--green)" }}>{gap}</td>
                    <td className="c">
                      <span className="chance">
                        <span className={`cdot ${r.pct >= 80 ? "g" : r.pct >= 50 ? "y" : "r"}`} />
                        {r.pct}%
                      </span>
                    </td>
                    <td className="c num">{uTot || "—"}</td>
                    <td className="c num">{fTot || "—"}</td>
                  </tr>
                );
              })}
              <tr style={{ fontWeight: 700, background: "var(--panel-2)" }}>
                <td>Total</td>
                <td className="r num">{pa.totalPlan}</td>
                <td className="r num">{pa.totalActual}</td>
                <td className="r num" style={{ color: pa.totalActual - pa.totalPlan < 0 ? "var(--red)" : "var(--green)" }}>{pa.totalActual - pa.totalPlan}</td>
                <td className="c">{pa.achievement}%</td>
                <td className="c num">{grandTotal(updMatrix) || "—"}</td>
                <td className="c num">{grandTotal(folMatrix) || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="note">
          <b>หมายเหตุ</b> : Plan/Actual จากชีต Plan/Actual · Updated/Follow-Up จาก Tracking · <span className="adot urgent" />Urgent=เลยกำหนด <span className="adot warning" />Warning=1-3วัน <span className="adot upcoming" />Upcoming=4-7วัน <span className="adot onprogress" />On Progress=&gt;7วัน
        </div>
      </div>
    </div>
  );
}
