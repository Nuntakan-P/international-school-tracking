"use client";

// Page 1 — Executive Overview. Ported from data/pages.js executive().
import * as A from "@/lib/analytics";
import { fmtM } from "@/lib/format";
import { useDashboard } from "@/context/DashboardContext";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiBandLabel, KpiRow } from "@/components/kpi/KpiRow";
import { FunnelPA } from "@/components/charts/FunnelPA";
import { SalespersonChart } from "@/components/charts/SalespersonChart";
import { GradeMatrix } from "@/components/shared/GradeMatrix";
import { ProvinceSection } from "@/components/shared/ProvinceSection";
import { GradeTag } from "@/components/shared/Tag";
import { ChanceCell } from "@/components/shared/ChanceCell";
import type { PipelineRow } from "@/lib/types";

export function ExecutiveOverview() {
  const { filteredSchools: data, planActual, filters, mapMode, setMapMode, topMode, setTopMode } = useDashboard();
  const k = A.kpis(data);
  const fpa = A.planVsActual(planActual, filters.sales);
  const salesRows = A.salesperson(data);
  const gm = A.gradeMatrix(data);
  const provinceData = A.byProvince(data);

  const allRows = A.pipelineRows(data, "All");
  let sortedTop: PipelineRow[];
  if (topMode === "value") {
    sortedTop = [...allRows].sort((a, b) => b.projectValue - a.projectValue);
  } else if (topMode === "chance") {
    sortedTop = [...allRows].sort((a, b) => (b.chance - a.chance) || (b.projectValue - a.projectValue));
  } else {
    sortedTop = allRows;
  }
  const top10 = sortedTop.slice(0, 10);

  return (
    <div>
      <div className="page-head">
        <h2>Sales Performance Overview</h2>
        <span className="sub">Master Database Dashboard · {data.length} schools in view</span>
      </div>

      <KpiRow variant="over">
        <KpiCard label="Total Schools" value={k.totalSchools} icon="school" accent="#2f6fe0" bg="#eaf1fd" foot={`${k.activeSchools} Active (Lead/Consider)`} />
        <KpiCard label="Total Projects" value={k.totalProjects} icon="opp" accent="#3bb5a3" bg="#e4f6f2" foot={`${k.activeProjects} Active Projects`} />
        <KpiCard label=">70% Chance" value={k.highChanceProjects} icon="weight" accent="#2f8fae" bg="#e2f2f7" foot="Projects with Chance ≥70%" />
        <KpiCard label="Total Project Value" value={k.totalProjectValue} fmt="money" icon="money" accent="#1b4f9c" bg="#e7eefb" foot="THB" />
        <KpiCard label="Avg Re-Score" value={k.avgReScore} icon="score" accent="#7a6ad0" bg="#eeebfa" foot="Score" />
        <KpiCard label="Open Follow-ups" value={k.openFollowUps} icon="bell" accent="#f0a431" bg="#fdf2e0" foot={`${k.openFollowUpsProjects} Projects · ${k.openFollowUps} Schools`} />
        <KpiCard label="Updated This Month" value={k.updatedThisMonth} icon="refresh" accent="#2e9e5b" bg="#e6f5ec" foot={`${k.updatedThisMonthProjects} Projects · ${k.updatedThisMonth} Schools`} />
      </KpiRow>

      <KpiBandLabel>Win &amp; Conversion Performance</KpiBandLabel>
      <KpiRow variant="win">
        <KpiCard label="Win Rate" value={k.winRate} fmt="pct" icon="trophy" accent="#2e9e5b" bg="#e6f5ec" foot={`${k.winProjects} Win / ${k.winProjects + k.lostProjects} (Win+Lost)`} />
        <KpiCard label="Win Schools" value={k.winSchools} icon="school" accent="#1b9c6b" bg="#e3f6ee" foot="≥1 Project Win" />
        <KpiCard label="Win Projects" value={k.winProjects} icon="check" accent="#2f8f5e" bg="#e6f5ec" foot="Status = Win" />
        <KpiCard label="Win Project Value" value={k.winValue} fmt="money" icon="money" accent="#1b4f9c" bg="#e7eefb" foot="THB · Won deals" />
        <KpiCard label="Win Conversion Rate" value={k.winConversionRate} fmt="pct" icon="percent" accent="#f0a431" bg="#fdf2e0" foot={`${k.quotationActions} Quot / ${k.poInstallActions} (PO+Inst)`} />
      </KpiRow>

      <KpiBandLabel>Lost Performance</KpiBandLabel>
      <KpiRow variant="win">
        <KpiCard label="Lost Rate" value={k.lostRate} fmt="pct" icon="lost" accent="#e8554e" bg="#fdeceb" foot={`${k.lostProjects} Lost / ${k.winProjects + k.lostProjects} (Win+Lost)`} />
        <KpiCard label="Lost Schools" value={k.lostSchools} icon="school" accent="#c43a34" bg="#fdeceb" foot="≥1 Project Lost" />
        <KpiCard label="Lost Projects" value={k.lostProjects} icon="lost" accent="#b53b34" bg="#fde2e0" foot="Status = Lost" />
        <KpiCard label="Lost Project Value" value={k.lostValue} fmt="money" icon="money" accent="#c43a34" bg="#fdeceb" foot="THB · Lost deals" />
        <KpiCard label="Lost Conversion Rate" value={k.lostConversionRate} fmt="pct" icon="percent" accent="#e8554e" bg="#fdeceb" foot="(PO+Inst-Quot) / (PO+Inst)" />
      </KpiRow>

      <KpiBandLabel>Consider &amp; Lead Pipeline</KpiBandLabel>
      <KpiRow variant="consider">
        <KpiCard label="Consider Schools" value={k.considerSchools} icon="school" accent="#f0a431" bg="#fdf6e6" foot={`Lead: ${k.leadSchools} · Consider: ${k.considerOnlySchools}`} />
        <KpiCard label="Consider Projects" value={k.considerProjects} icon="opp" accent="#d49220" bg="#fdf6e6" foot={`Lead: ${k.leadProjects} · Consider: ${k.considerOnlyProjects}`} />
        <KpiCard label="Consider Project Value" value={k.considerValue} fmt="money" icon="money" accent="#c48418" bg="#fdf2e0" foot={`Lead: ${fmtM(k.leadValue)} · Consider: ${fmtM(k.considerOnlyValue)}`} />
        <KpiCard label="Consider Chance (%)" value={k.considerChance} fmt="pct" icon="percent" accent="#f0a431" bg="#fdf6e6" foot="Avg %โอกาส (Lead+Consider)" />
      </KpiRow>

      <div className="grid col-12-8" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Activity Pipeline · Plan vs Actual</div>
          <div className="card-sub">Activity plan vs actual per stage · % difference</div>
          <div className="fpa" style={{ marginTop: 14 }}><FunnelPA rows={fpa.rows} /></div>
        </div>
        <div className="card">
          <div className="card-title">Salesperson Performance</div>
          <div className="card-sub">By weighted pipeline value · PO &amp; Install counts</div>
          <div className="chart-h h300"><SalespersonChart data={salesRows} /></div>
        </div>
      </div>

      <div className="grid col-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">Pipeline by Province</div>
              <div className="card-sub">Project value distribution</div>
            </div>
            <div className="seg">
              <button className={mapMode === "map" ? "on" : ""} onClick={() => setMapMode("map")}>Map</button>
              <button className={mapMode === "bar" ? "on" : ""} onClick={() => setMapMode("bar")}>Bars</button>
            </div>
          </div>
          <ProvinceSection data={provinceData} mapMode={mapMode} onMapFallback={() => setMapMode("bar")} />
        </div>
        <div className="card">
          <div className="card-title">School Grade Matrix</div>
          <div className="card-sub">By Re-Score grade · pipeline value</div>
          <div style={{ marginTop: 12 }}><GradeMatrix gm={gm} /></div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <div>
            <div className="card-title">Top 10 Pipeline</div>
            <div className="card-sub">Best opportunities from Customer Pipeline (All Projects)</div>
          </div>
          <div className="seg">
            <button className={topMode === "score" ? "on" : ""} onClick={() => setTopMode("score")}>By Score</button>
            <button className={topMode === "value" ? "on" : ""} onClick={() => setTopMode("value")}>By Value</button>
            <button className={topMode === "chance" ? "on" : ""} onClick={() => setTopMode("chance")}>By Chance (%)</button>
          </div>
        </div>
        <div className="tbl-wrap" style={{ marginTop: 10 }}>
          <table className="data">
            <thead>
              <tr>
                <th className="c">No</th><th>School Name</th><th>Province</th>
                <th className="r">Project Value (THB)</th><th className="c">Chance (%)</th>
                <th>Salesperson</th><th className="c">Re-Score</th><th className="c">Point</th>
              </tr>
            </thead>
            <tbody>
              {top10.map((r, i) => (
                <tr key={r.no}>
                  <td className="c rank">{i + 1}</td>
                  <td className="school-cell">{r.name}</td>
                  <td>{r.province}</td>
                  <td className="r num">{r.projectValue.toLocaleString()}</td>
                  <td className="c"><ChanceCell chance={r.chance} /></td>
                  <td>{r.salesperson}</td>
                  <td className="c"><GradeTag grade={r.grade} /></td>
                  <td className="c"><b className="num" style={{ color: "var(--navy)" }}>{r.reScore}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="note">
          <b>หมายเหตุ</b> : By Score = เรียง Re-Score→Point→Chance · By Value = มูลค่าสูงสุด · By Chance = %โอกาสสูงสุด (ถ้าเท่ากัน เลือก Value สูงกว่า)
        </div>
      </div>
    </div>
  );
}
