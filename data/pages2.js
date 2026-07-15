/* ============================================================
   pages2.js — Pipeline, Score, Plan dashboards
   (extends window.Pages defined in pages.js)
   ============================================================ */
(function () {
  const A = window.Analytics, CH = window.Charts, I = window.ICONS;
  const H = window._pageHelpers, fmtM = CH.fmtM;

  /* ============ PAGE 2 — Customer Pipeline ============ */
  function pipeline(el, data, State) {
    if (!State.projectFilter) State.projectFilter = "All";
    if (!State.activityFilter) State.activityFilter = "All";
    if (!State.followUpFilter) State.followUpFilter = "All";
    if (!State.updatedAlertFilter) State.updatedAlertFilter = "All";
    if (!State.followUpAlertFilter) State.followUpAlertFilter = "All";
    let rows = A.pipelineRows(data, State.projectFilter);
    if (State.activityFilter !== "All") {
      rows = rows.filter((r) => (r.updatedAction || "").toLowerCase() === State.activityFilter.toLowerCase());
    }
    if (State.followUpFilter !== "All") {
      rows = rows.filter((r) => (r.followUpAction || "").toLowerCase() === State.followUpFilter.toLowerCase());
    }
    // alert-level filters
    const alertMap = { Urgent: "fu-overdue", Warning: "fu-urgent", Upcoming: "fu-upcoming", "On Progress": "fu-ontrack" };
    if (State.updatedAlertFilter !== "All") {
      const cls = alertMap[State.updatedAlertFilter];
      rows = rows.filter((r) => followUpAlertClass(r.updatedDate) === cls);
    }
    if (State.followUpAlertFilter !== "All") {
      const cls = alertMap[State.followUpAlertFilter];
      rows = rows.filter((r) => followUpAlertClass(r.followUpDate) === cls);
    }
    const projOpts = ["All", "1", "2", "3", "4"];
    const projLabel = (o) => o === "All" ? "All Projects" : "Project#" + o;
    const stageOpts = ["All", "Call", "Visit", "Demo", "Survey", "Present", "Quotation", "PO", "Install"];
    const stageLabel = (o) => o === "All" ? "All" : o;
    const alertOpts = ["All", "Urgent", "Warning", "Upcoming", "On Progress"];
    const alertLabel = (o) => o === "All" ? "All Status" : o;
    const alertDot = { Urgent: "#e8554e", Warning: "#f0a431", Upcoming: "#2f6fe0", "On Progress": "#2e9e5b" };
    const alertOptHtml = (opts, sel) => opts.map((o) => `<option value="${o}" ${o === sel ? "selected" : ""}>${alertLabel(o)}</option>`).join("");
    el.innerHTML = `
      <div class="page-head"><h2>Customer Pipeline</h2><span class="sub">Ranked by Point-Re-Score · editable — values recompute live</span></div>
      <div class="card">
        <div class="card-hd">
          <div><div class="card-title">Customer Pipeline</div><div class="card-sub">${data.length} schools in view · ${rows.length} rows</div></div>
        </div>
        <div class="pipe-filters">
          <div class="pf-group">
            <span class="filter-label" style="margin:0">${I.filter}Project</span>
            <div class="select-wrap"><select class="fsel" id="proj-filter">${projOpts.map((o) => `<option value="${o}" ${o === State.projectFilter ? "selected" : ""}>${projLabel(o)}</option>`).join("")}</select></div>
          </div>
          <div class="pf-divider"></div>
          <div class="pf-group">
            <span class="filter-label" style="margin:0">Updated Action</span>
            <div class="select-wrap"><select class="fsel" id="act-filter">${stageOpts.map((o) => `<option value="${o}" ${o === State.activityFilter ? "selected" : ""}>${stageLabel(o)}</option>`).join("")}</select></div>
            <div class="select-wrap"><select class="fsel fsel-alert" id="upd-alert-filter">${alertOptHtml(alertOpts, State.updatedAlertFilter)}</select></div>
          </div>
          <div class="pf-divider"></div>
          <div class="pf-group">
            <span class="filter-label" style="margin:0">Follow-Up Action</span>
            <div class="select-wrap"><select class="fsel" id="fol-filter">${stageOpts.map((o) => `<option value="${o}" ${o === State.followUpFilter ? "selected" : ""}>${stageLabel(o)}</option>`).join("")}</select></div>
            <div class="select-wrap"><select class="fsel fsel-alert" id="fol-alert-filter">${alertOptHtml(alertOpts, State.followUpAlertFilter)}</select></div>
          </div>
        </div>
        <div class="tbl-wrap">
          <table class="data"><thead><tr>
            <th class="c">No</th><th>School Name</th><th>Province</th>
            <th>Updated Date</th><th>Updated Action</th><th>Follow-Up Date</th><th>Follow-Up Action</th>
            <th class="r">Project Value (THB)</th><th class="c">Chance (%)</th>
            <th>Salesperson</th><th class="c">Re-Score</th><th class="c">Point-Re-Score</th>
          </tr></thead><tbody id="pipe-body">${pipeRows(rows)}</tbody></table>
        </div>
        <div class="note"><b>หมายเหตุ</b> : <span class="adot urgent"></span>Urgent=เลยกำหนด · <span class="adot warning"></span>Warning=1-3วัน · <span class="adot upcoming"></span>Upcoming=4-7วัน · <span class="adot onprogress"></span>On Progress=>7วัน · เรียงลำดับ Re-Score (A→D) → Point-Re-Score → Chance (%)</div>
      </div>`;
    bindEditable();
    document.getElementById("proj-filter").addEventListener("change", (e) => { State.projectFilter = e.target.value; window.renderPage(); });
    document.getElementById("act-filter").addEventListener("change", (e) => { State.activityFilter = e.target.value; window.renderPage(); });
    document.getElementById("fol-filter").addEventListener("change", (e) => { State.followUpFilter = e.target.value; window.renderPage(); });
    document.getElementById("upd-alert-filter").addEventListener("change", (e) => { State.updatedAlertFilter = e.target.value; window.renderPage(); });
    document.getElementById("fol-alert-filter").addEventListener("change", (e) => { State.followUpAlertFilter = e.target.value; window.renderPage(); });
  }

  function gradeClass(g) { return "g" + g; }
  const actionTag = (a) => a ? `<span class="tag funnel">${a}</span>` : `<span style="color:var(--muted)">—</span>`;
  const dateCell = (d) => d ? `<span class="num" style="font-size:11.5px;color:var(--ink-soft)">${d}</span>` : `<span style="color:var(--muted)">—</span>`;

  // Parse "23 Jan 26" → Date object (returns null if unparseable)
  const MON = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
  function parseDisplayDate(s) {
    if (!s) return null;
    const m = String(s).match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})$/);
    if (!m) return null;
    const day = parseInt(m[1]), mon = MON[m[2].toLowerCase()], yr = parseInt(m[3]);
    if (mon === undefined || isNaN(day)) return null;
    return new Date(yr < 100 ? 2000 + yr : yr, mon, day);
  }

  // Follow-Up alert class based on days until Follow-Up Date
  function followUpAlertClass(followUpDateStr) {
    const fd = parseDisplayDate(followUpDateStr);
    if (!fd) return "";
    const today = new Date(); today.setHours(0, 0, 0, 0); fd.setHours(0, 0, 0, 0);
    const diff = Math.round((fd - today) / 86400000); // days until follow-up
    if (diff < 0) return "fu-overdue";      // past due → red
    if (diff <= 3) return "fu-urgent";       // 1-3 days → yellow
    if (diff <= 7) return "fu-upcoming";     // 3-7 days → blue
    return "fu-ontrack";                      // >7 days → green
  }

  // Follow-Up Action tag with alert border
  function followUpTag(action, followUpDate) {
    if (!action) return `<span style="color:var(--muted)">—</span>`;
    const cls = followUpAlertClass(followUpDate);
    return `<span class="tag funnel ${cls}">${action}</span>`;
  }
  // Updated Action tag with alert border (same logic as follow-up)
  function updatedTag(action, updatedDate) {
    if (!action) return `<span style="color:var(--muted)">—</span>`;
    const cls = followUpAlertClass(updatedDate);
    return `<span class="tag funnel ${cls}">${action}</span>`;
  }

  function pipeRows(rows) {
    if (!rows.length) return `<tr><td colspan="12" class="empty">No projects match this filter</td></tr>`;
    return rows.map((r, i) => `<tr data-no="${r.no}">
      <td class="c rank">${i + 1}</td>
      <td class="school-cell">${r.name}</td><td>${r.province}</td>
      <td>${dateCell(r.updatedDate)}</td><td>${updatedTag(r.updatedAction, r.updatedDate)}</td>
      <td>${dateCell(r.followUpDate)}</td><td>${followUpTag(r.followUpAction, r.followUpDate)}</td>
      <td class="r num editable" contenteditable="true" data-field="projectValue">${r.projectValue.toLocaleString()}</td>
      <td class="c"><span class="chance"><span class="cdot ${H.chanceClass(r.chance)}"></span><span class="editable" contenteditable="true" data-field="chance" style="display:inline-block;min-width:24px">${r.chance}</span></span></td>
      <td>${r.salesperson}</td>
      <td class="c"><span class="tag ${gradeClass(r.grade)}">${r.grade}</span></td>
      <td class="c"><b class="num" style="color:var(--navy)">${r.reScore}</b></td>
    </tr>`).join("");
  }

  function bindEditable() {
    const body = document.getElementById("pipe-body");
    body.querySelectorAll("[contenteditable]").forEach((cell) => {
      cell.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); cell.blur(); } });
      cell.addEventListener("blur", () => commitEdit(cell));
    });
  }

  function commitEdit(cell) {
    const tr = cell.closest("tr"); const no = parseInt(tr.dataset.no);
    const rec = window.State.schools.find((s) => s.no === no); if (!rec) return;
    const field = cell.dataset.field;
    let raw = cell.textContent.replace(/[^0-9.]/g, "");
    let val = parseFloat(raw); if (isNaN(val)) val = 0;
    if (field === "chance") val = Math.max(0, Math.min(100, Math.round(val)));

    const pf = window.State.projectFilter;
    let target = rec;
    if (pf && pf !== "All") {
      const pr = (rec.projects || []).find((p) => p.projectNo === parseInt(pf));
      if (pr) target = pr;
    }
    target[field] = val;
    target.weightedValue = Math.round(target.projectValue * target.chance / 100);
    // keep school headline in sync with Project#1
    if (target !== rec && target.projectNo === 1) {
      rec[field] = val; rec.weightedValue = target.weightedValue;
    }
    // refresh row cells in place
    tr.querySelector('[data-field="weightedValue"]').textContent = target.weightedValue.toLocaleString();
    tr.querySelector('[data-field="projectValue"]').textContent = target.projectValue.toLocaleString();
    const chSpan = tr.querySelector('[data-field="chance"]'); chSpan.textContent = target.chance;
    const dot = tr.querySelector(".cdot"); dot.className = "cdot " + H.chanceClass(target.chance);
    window.showToast(rec.name + " updated · Weighted ฿" + target.weightedValue.toLocaleString());
  }

  /* ============ PAGE 3 — Score Analysis ============ */
  function score(el, data, State) {
    const imp = A.scoreImprovement(data);
    const avg = A.averageScoreByTier(data);
    el.innerHTML = `
      <div class="page-head"><h2>Score Analysis</h2><span class="sub">Initial Score vs Re-Score · improvement tracking</span></div>
      <div class="grid col-7-5" style="margin-bottom:16px">
        <div class="card">
          <div class="card-title">Initial Score vs Re-Score</div>
          <div class="card-sub">Scatter plot · colour = Re-Score grade · score out of 100</div>
          <div class="chart-h h340"><canvas id="c-scatter"></canvas></div>
        </div>
        <div class="grid" style="gap:16px;align-content:start">
          <div class="card">
            <div class="card-title">Score Improvement</div>
            <div class="card-sub">Re-Score vs Initial Score</div>
            <div class="chip-row" style="margin-top:6px">
              <div class="chip up"><div class="chip-t">Improved ▲</div><div class="chip-n" data-count="${imp.improved}">${imp.improved}</div><div class="chip-s">Schools (${imp.improvedPct}%)</div></div>
              <div class="chip flat"><div class="chip-t">No Change</div><div class="chip-n" data-count="${imp.same}">${imp.same}</div><div class="chip-s">Schools (${imp.samePct}%)</div></div>
              <div class="chip down"><div class="chip-t">Decreased ▼</div><div class="chip-n" data-count="${imp.decreased}">${imp.decreased}</div><div class="chip-s">Schools (${imp.decreasedPct}%)</div></div>
            </div>
          </div>
          <div class="card">
            <div class="card-title">Average Score by Grade</div>
            <div class="card-sub">Initial → Re-Score · mean per grade</div>
            <table class="avg-tbl" style="margin-top:8px"><thead><tr><th>Grade</th><th class="c">Initial</th><th class="c">Re-Score</th><th class="c">Change</th></tr></thead>
            <tbody>${avg.map((a) => `<tr class="${a.tier === "Total" ? "total" : ""}"><td><b>${a.tier}</b></td><td class="c">${a.initial}</td><td class="c">${a.reScore}</td>
              <td class="c"><span class="delta ${a.change < 0 ? "neg" : ""}">${a.change >= 0 ? "▲" : "▼"} ${Math.abs(a.change)}</span></td></tr>`).join("")}</tbody></table>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Score Distribution (Re-Score)</div>
        <div class="card-sub">Share of schools per score band</div>
        <div class="chart-h h260" style="margin-top:6px"><canvas id="c-dist"></canvas></div>
        <div class="note"><b>หมายเหตุ</b> : Score เต็ม 100 คะแนน · A: 85-100 · B: 70-84 · C: 60-69 · D: ≤59</div>
      </div>`;
    CH.scatter(document.getElementById("c-scatter"), A.scatter(data));
    CH.scoreDist(document.getElementById("c-dist"), A.scoreDistribution(data));
  }

  /* ============ PAGE 4 — Activity Pipeline ============ */
  function plan(el, data, State) {
    const sales = State.filters.sales;
    if (!State.paMonth) State.paMonth = "All";
    if (!State.paGrade) State.paGrade = "All";
    const pa = A.planVsActual(State.planActual, sales, State.paMonth, State.paGrade);
    const MONTHS = ["All","JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    const GRADES = ["All","A","B","C","D"];
    const selOpt = (arr, sel, labeler) => arr.map((o) => `<option value="${o}" ${o === sel ? "selected" : ""}>${labeler ? labeler(o) : o}</option>`).join("");

    // --- Updated & Follow-Up Activity summary from Customer Pipeline data ---
    const STAGE_LIST = window.FUNNEL_STAGES || ["Call","Visit","Demo","Survey","Present","Quotation","PO","Install"];
    const allPipeRows = A.pipelineRows(data, "All");
    const alertCls = (dateStr) => {
      const fd = parseDateStr(dateStr); if (!fd) return "";
      const today = new Date(); today.setHours(0,0,0,0); fd.setHours(0,0,0,0);
      const diff = Math.round((fd - today) / 86400000);
      if (diff < 0) return "Urgent"; if (diff <= 3) return "Warning"; if (diff <= 7) return "Upcoming"; return "On Progress";
    };
    function parseDateStr(s) {
      if (!s) return null;
      const MON2 = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
      const m = String(s).match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})$/);
      if (!m) return null;
      const day = parseInt(m[1]), mon = MON2[m[2].toLowerCase()], yr = parseInt(m[3]);
      if (mon === undefined) return null;
      return new Date(yr < 100 ? 2000 + yr : yr, mon, day);
    }
    // Build stage × alert matrix for Updated & Follow-Up
    const updMatrix = {}, folMatrix = {};
    STAGE_LIST.forEach((st) => { updMatrix[st] = {Urgent:0,Warning:0,Upcoming:0,"On Progress":0}; folMatrix[st] = {Urgent:0,Warning:0,Upcoming:0,"On Progress":0}; });
    allPipeRows.forEach((r) => {
      if (r.updatedAction && updMatrix[r.updatedAction]) {
        const a = alertCls(r.updatedDate); if (a) updMatrix[r.updatedAction][a]++;
      }
      if (r.followUpAction && folMatrix[r.followUpAction]) {
        const a = alertCls(r.followUpDate); if (a) folMatrix[r.followUpAction][a]++;
      }
    });

    el.innerHTML = `
      <div class="page-head"><h2>Activity Performance</h2><span class="sub">Sales activity plan vs actual${sales !== "All" ? " · " + sales : ""}</span></div>

      <div class="filters" style="margin-bottom:14px">
        <span class="filter-label">${I.filter}Activity Filters</span>
        <div class="select-wrap"><select class="fsel" id="pa-month">${selOpt(MONTHS, State.paMonth, (o) => o === "All" ? "All Months" : o)}</select></div>
        <div class="select-wrap"><select class="fsel" id="pa-grade">${selOpt(GRADES, State.paGrade, (o) => o === "All" ? "All Grades" : "Grade " + o)}</select></div>
      </div>

      <div class="grid col-7-5">
        <div class="card">
          <div class="card-title">Activity Performance</div>
          <div class="card-sub">Activity count per pipeline stage · Plan (top) → Actual (bottom)</div>
          <div class="chart-h h380" style="margin-top:6px"><canvas id="c-pa"></canvas></div>
        </div>
        <div class="card ach-card">
          <div class="card-title" style="align-self:flex-start">Achievement Summary</div>
          <div class="card-sub" style="align-self:flex-start">Overall actual ÷ plan${State.paMonth !== "All" ? " · " + State.paMonth : ""}${State.paGrade !== "All" ? " · Grade " + State.paGrade : ""}</div>
          <div id="gauge" style="margin:14px 0 4px"></div>
          <h4>Overall Achievement</h4>
          <div class="ach-foot">
            <div><div class="l">Total Plan</div><div class="v" data-count="${pa.totalPlan}">${pa.totalPlan}</div></div>
            <div><div class="l">Total Actual</div><div class="v" data-count="${pa.totalActual}">${pa.totalActual}</div></div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:14px">
        <div class="card-title">Updated &amp; Follow-Up Activity</div>
        <div class="card-sub">Alert status summary per pipeline stage · based on current date</div>
        <div class="grid col-2" style="margin-top:10px;gap:16px">
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--ink-soft);margin-bottom:8px">Updated Action</div>
            <div class="tbl-wrap">
              <table class="data"><thead><tr><th>Stage</th><th class="c"><span class="adot urgent"></span>Urgent</th><th class="c"><span class="adot warning"></span>Warning</th><th class="c"><span class="adot upcoming"></span>Upcoming</th><th class="c"><span class="adot onprogress"></span>On Progress</th><th class="c r">Total</th></tr></thead>
              <tbody>${STAGE_LIST.map((st) => { const m = updMatrix[st]; const t = m.Urgent+m.Warning+m.Upcoming+m["On Progress"]; return `<tr><td><span class="tag funnel">${st}</span></td><td class="c${m.Urgent?" fu-cell-r":""}">${m.Urgent||"—"}</td><td class="c${m.Warning?" fu-cell-y":""}">${m.Warning||"—"}</td><td class="c${m.Upcoming?" fu-cell-b":""}">${m.Upcoming||"—"}</td><td class="c${m["On Progress"]?" fu-cell-g":""}">${m["On Progress"]||"—"}</td><td class="c r num">${t||"—"}</td></tr>`; }).join("")}</tbody></table>
            </div>
          </div>
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--ink-soft);margin-bottom:8px">Follow-Up Action</div>
            <div class="tbl-wrap">
              <table class="data"><thead><tr><th>Stage</th><th class="c"><span class="adot urgent"></span>Urgent</th><th class="c"><span class="adot warning"></span>Warning</th><th class="c"><span class="adot upcoming"></span>Upcoming</th><th class="c"><span class="adot onprogress"></span>On Progress</th><th class="c r">Total</th></tr></thead>
              <tbody>${STAGE_LIST.map((st) => { const m = folMatrix[st]; const t = m.Urgent+m.Warning+m.Upcoming+m["On Progress"]; return `<tr><td><span class="tag funnel">${st}</span></td><td class="c${m.Urgent?" fu-cell-r":""}">${m.Urgent||"—"}</td><td class="c${m.Warning?" fu-cell-y":""}">${m.Warning||"—"}</td><td class="c${m.Upcoming?" fu-cell-b":""}">${m.Upcoming||"—"}</td><td class="c${m["On Progress"]?" fu-cell-g":""}">${m["On Progress"]||"—"}</td><td class="c r num">${t||"—"}</td></tr>`; }).join("")}</tbody></table>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:14px">
        <div class="card-title">Activity Breakdown by Stage</div>
        <div class="card-sub">Plan · Actual · Achievement per stage + Updated &amp; Follow-Up summary</div>
        <div class="tbl-wrap" style="margin-top:10px">
          <table class="data"><thead><tr><th>Stage</th><th class="r">Plan</th><th class="r">Actual</th><th class="r">Gap</th><th class="c">% Achieve</th><th class="c">Updated</th><th class="c">Follow-Up</th></tr></thead>
          <tbody>${pa.rows.map((r) => {
            const uTot = updMatrix[r.stage] ? updMatrix[r.stage].Urgent+updMatrix[r.stage].Warning+updMatrix[r.stage].Upcoming+updMatrix[r.stage]["On Progress"] : 0;
            const fTot = folMatrix[r.stage] ? folMatrix[r.stage].Urgent+folMatrix[r.stage].Warning+folMatrix[r.stage].Upcoming+folMatrix[r.stage]["On Progress"] : 0;
            return `<tr><td><span class="tag funnel">${r.stage}</span></td><td class="r num">${r.plan}</td><td class="r num">${r.actual}</td>
            <td class="r num" style="color:${r.actual - r.plan < 0 ? "var(--red)" : "var(--green)"}">${r.actual - r.plan}</td>
            <td class="c"><span class="chance"><span class="cdot ${r.pct >= 80 ? "g" : r.pct >= 50 ? "y" : "r"}"></span>${r.pct}%</span></td>
            <td class="c num">${uTot || "—"}</td><td class="c num">${fTot || "—"}</td></tr>`; }).join("")}
          <tr style="font-weight:700;background:var(--panel-2)"><td>Total</td><td class="r num">${pa.totalPlan}</td><td class="r num">${pa.totalActual}</td>
            <td class="r num" style="color:${pa.totalActual - pa.totalPlan < 0 ? "var(--red)" : "var(--green)"}">${pa.totalActual - pa.totalPlan}</td><td class="c">${pa.achievement}%</td>
            <td class="c num">${STAGE_LIST.reduce((s,st) => s+(updMatrix[st]?updMatrix[st].Urgent+updMatrix[st].Warning+updMatrix[st].Upcoming+updMatrix[st]["On Progress"]:0),0) || "—"}</td>
            <td class="c num">${STAGE_LIST.reduce((s,st) => s+(folMatrix[st]?folMatrix[st].Urgent+folMatrix[st].Warning+folMatrix[st].Upcoming+folMatrix[st]["On Progress"]:0),0) || "—"}</td></tr>
          </tbody></table>
        </div>
        <div class="note"><b>หมายเหตุ</b> : Plan/Actual จากชีต Plan/Actual · Updated/Follow-Up จาก Tracking · <span class="adot urgent"></span>Urgent=เลยกำหนด <span class="adot warning"></span>Warning=1-3วัน <span class="adot upcoming"></span>Upcoming=4-7วัน <span class="adot onprogress"></span>On Progress=>7วัน</div>ัน <span class="adot upcoming"></span>Upcoming=4-7วัน <span class="adot onprogress"></span>On Progress=>7วัน</div>
      </div>`;

    CH.planActual(document.getElementById("c-pa"), pa);
    CH.gauge(document.getElementById("gauge"), pa.achievement);

    document.getElementById("pa-month").addEventListener("change", (e) => { State.paMonth = e.target.value; window.renderPage(); });
    document.getElementById("pa-grade").addEventListener("change", (e) => { State.paGrade = e.target.value; window.renderPage(); });
  }

  Object.assign(window.Pages, { pipeline, score, plan });
})();
