"use client";

// Page 4 — Score Analysis. Ported from data/pages2.js score().
import * as A from "@/lib/analytics";
import { useDashboard } from "@/context/DashboardContext";
import { ScatterChart } from "@/components/charts/ScatterChart";
import { ScoreDistChart } from "@/components/charts/ScoreDistChart";

export function ScoreAnalysis() {
  const { filteredSchools: data } = useDashboard();
  const imp = A.scoreImprovement(data);
  const avg = A.averageScoreByTier(data);
  const scatterData = A.scatter(data);
  const distData = A.scoreDistribution(data);

  return (
    <div>
      <div className="page-head">
        <h2>Score Analysis</h2>
        <span className="sub">Initial Score vs Re-Score · improvement tracking</span>
      </div>

      <div className="grid col-7-5" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Initial Score vs Re-Score</div>
          <div className="card-sub">Scatter plot · colour = Re-Score grade · score out of 100</div>
          <div className="chart-h h340"><ScatterChart data={scatterData} /></div>
        </div>
        <div className="grid" style={{ gap: 16, alignContent: "start" }}>
          <div className="card">
            <div className="card-title">Score Improvement</div>
            <div className="card-sub">Re-Score vs Initial Score</div>
            <div className="chip-row" style={{ marginTop: 6 }}>
              <div className="chip up">
                <div className="chip-t">Improved ▲</div>
                <div className="chip-n">{imp.improved}</div>
                <div className="chip-s">Schools ({imp.improvedPct}%)</div>
              </div>
              <div className="chip flat">
                <div className="chip-t">No Change</div>
                <div className="chip-n">{imp.same}</div>
                <div className="chip-s">Schools ({imp.samePct}%)</div>
              </div>
              <div className="chip down">
                <div className="chip-t">Decreased ▼</div>
                <div className="chip-n">{imp.decreased}</div>
                <div className="chip-s">Schools ({imp.decreasedPct}%)</div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Average Score by Grade</div>
            <div className="card-sub">Initial → Re-Score · mean per grade</div>
            <table className="avg-tbl" style={{ marginTop: 8 }}>
              <thead>
                <tr><th>Grade</th><th className="c">Initial</th><th className="c">Re-Score</th><th className="c">Change</th></tr>
              </thead>
              <tbody>
                {avg.map((a) => (
                  <tr key={a.tier} className={a.tier === "Total" ? "total" : ""}>
                    <td><b>{a.tier}</b></td>
                    <td className="c">{a.initial}</td>
                    <td className="c">{a.reScore}</td>
                    <td className="c">
                      <span className={`delta ${a.change < 0 ? "neg" : ""}`}>
                        {a.change >= 0 ? "▲" : "▼"} {Math.abs(a.change)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Score Distribution (Re-Score)</div>
        <div className="card-sub">Share of schools per score band</div>
        <div className="chart-h h260" style={{ marginTop: 6 }}><ScoreDistChart data={distData} /></div>
        <div className="note"><b>หมายเหตุ</b> : Score เต็ม 100 คะแนน · A: 85-100 · B: 70-84 · C: 60-69 · D: ≤59</div>
      </div>
    </div>
  );
}
