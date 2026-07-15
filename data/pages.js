/* ============================================================
   pages.js — the four dashboard page renderers
   window.Pages = { executive, pipeline, score, plan }
   ============================================================ */
(function () {
  const A = window.Analytics, CH = window.Charts, I = window.ICONS;
  const fmtM = CH.fmtM;
  function chanceClass(c) { return c >= 60 ? "g" : c >= 40 ? "y" : "r"; }

  function fmtInit(v, fmt, unit) {
    let s;
    if (fmt === "money") s = fmtM(v);
    else if (fmt === "pct") s = v + "%";
    else if (fmt === "decimal") s = v.toFixed(1);
    else s = Math.round(v).toLocaleString("en-US");
    return s + (unit ? `<span class="unit">${unit}</span>` : "");
  }

  function kpiCard(o) {
    return `<div class="kpi" style="--accent:${o.accent};--accent-bg:${o.bg}">
      <div class="kpi-ic">${o.icon}</div>
      <div class="kpi-label">${o.label}</div>
      <div class="kpi-val" data-count="${o.value}" data-fmt="${o.fmt || "int"}" ${o.unit ? `data-unit="${o.unit}"` : ""}>${fmtInit(o.value, o.fmt, o.unit)}</div>
      ${o.foot ? `<div class="kpi-foot ${o.footClass || ""}">${o.foot}</div>` : ""}
    </div>`;
  }

  /* ============ PAGE 1 — Executive Overview ============ */
  function executive(el, data, State) {
    const k = A.kpis(data);
    el.innerHTML = `
      <div class="page-head"><h2>Sales Performance Overview</h2><span class="sub">Master Database Dashboard · ${data.length} schools in view</span></div>
      <div class="kpi-row r-over">
        ${kpiCard({ label: "Total Schools", value: k.totalSchools, icon: I.school, accent: "#2f6fe0", bg: "#eaf1fd", foot: k.activeSchools + " Active (Lead/Consider)" })}
        ${kpiCard({ label: "Total Projects", value: k.totalProjects, icon: I.opp, accent: "#3bb5a3", bg: "#e4f6f2", foot: k.activeProjects + " Active Projects" })}
        ${kpiCard({ label: ">70% Chance", value: k.highChanceProjects, icon: I.weight, accent: "#2f8fae", bg: "#e2f2f7", foot: "Projects with Chance ≥70%" })}
        ${kpiCard({ label: "Total Project Value", value: k.totalProjectValue, fmt: "money", icon: I.money, accent: "#1b4f9c", bg: "#e7eefb", foot: "THB" })}
        ${kpiCard({ label: "Avg Re-Score", value: k.avgReScore, icon: I.score, accent: "#7a6ad0", bg: "#eeebfa", foot: "Score" })}
        ${kpiCard({ label: "Open Follow-ups", value: k.openFollowUps, icon: I.bell, accent: "#f0a431", bg: "#fdf2e0", foot: k.openFollowUpsProjects + " Projects · " + k.openFollowUps + " Schools" })}
        ${kpiCard({ label: "Updated This Month", value: k.updatedThisMonth, icon: I.refresh, accent: "#2e9e5b", bg: "#e6f5ec", foot: k.updatedThisMonthProjects + " Projects · " + k.updatedThisMonth + " Schools" })}
      </div>

      <div class="kpi-band-label">Win &amp; Conversion Performance</div>
      <div class="kpi-row r-win">
        ${kpiCard({ label: "Win Rate", value: k.winRate, fmt: "pct", icon: I.trophy, accent: "#2e9e5b", bg: "#e6f5ec", foot: k.winProjects + " Win / " + (k.winProjects + k.lostProjects) + " (Win+Lost)" })}
        ${kpiCard({ label: "Win Schools", value: k.winSchools, icon: I.school, accent: "#1b9c6b", bg: "#e3f6ee", foot: "≥1 Project Win" })}
        ${kpiCard({ label: "Win Projects", value: k.winProjects, icon: I.check, accent: "#2f8f5e", bg: "#e6f5ec", foot: "Status = Win" })}
        ${kpiCard({ label: "Win Project Value", value: k.winValue, fmt: "money", icon: I.money, accent: "#1b4f9c", bg: "#e7eefb", foot: "THB · Won deals" })}
        ${kpiCard({ label: "Win Conversion Rate", value: k.winConversionRate, fmt: "pct", icon: I.percent, accent: "#f0a431", bg: "#fdf2e0", foot: k.quotationActions + " Quot / " + k.poInstallActions + " (PO+Inst)" })}
      </div>

      <div class="kpi-band-label">Lost Performance</div>
      <div class="kpi-row r-win">
        ${kpiCard({ label: "Lost Rate", value: k.lostRate, fmt: "pct", icon: I.lost, accent: "#e8554e", bg: "#fdeceb", foot: k.lostProjects + " Lost / " + (k.winProjects + k.lostProjects) + " (Win+Lost)" })}
        ${kpiCard({ label: "Lost Schools", value: k.lostSchools, icon: I.school, accent: "#c43a34", bg: "#fdeceb", foot: "≥1 Project Lost" })}
        ${kpiCard({ label: "Lost Projects", value: k.lostProjects, icon: I.lost, accent: "#b53b34", bg: "#fde2e0", foot: "Status = Lost" })}
        ${kpiCard({ label: "Lost Project Value", value: k.lostValue, fmt: "money", icon: I.money, accent: "#c43a34", bg: "#fdeceb", foot: "THB · Lost deals" })}
        ${kpiCard({ label: "Lost Conversion Rate", value: k.lostConversionRate, fmt: "pct", icon: I.percent, accent: "#e8554e", bg: "#fdeceb", foot: "(PO+Inst-Quot) / (PO+Inst)" })}
      </div>

      <div class="kpi-band-label">Consider &amp; Lead Pipeline</div>
      <div class="kpi-row r-consider">
        ${kpiCard({ label: "Consider Schools", value: k.considerSchools, icon: I.school, accent: "#f0a431", bg: "#fdf6e6", foot: `Lead: ${k.leadSchools} · Consider: ${k.considerOnlySchools}` })}
        ${kpiCard({ label: "Consider Projects", value: k.considerProjects, icon: I.opp, accent: "#d49220", bg: "#fdf6e6", foot: `Lead: ${k.leadProjects} · Consider: ${k.considerOnlyProjects}` })}
        ${kpiCard({ label: "Consider Project Value", value: k.considerValue, fmt: "money", icon: I.money, accent: "#c48418", bg: "#fdf2e0", foot: `Lead: ${CH.fmtM(k.leadValue)} · Consider: ${CH.fmtM(k.considerOnlyValue)}` })}
        ${kpiCard({ label: "Consider Chance (%)", value: k.considerChance, fmt: "pct", icon: I.percent, accent: "#f0a431", bg: "#fdf6e6", foot: "Avg %โอกาส (Lead+Consider)" })}
      </div>

      <div class="grid col-12-8" style="margin-bottom:16px">
        <div class="card">
          <div class="card-title">Activity Pipeline · Plan vs Actual</div>
          <div class="card-sub">Activity plan vs actual per stage · % difference</div>
          <div class="fpa" id="funnel-pa" style="margin-top:14px"></div>
        </div>
        <div class="card">
          <div class="card-title">Salesperson Performance</div>
          <div class="card-sub">By weighted pipeline value · PO &amp; Install counts</div>
          <div class="chart-h h300"><canvas id="c-sales"></canvas></div>
        </div>
      </div>

      <div class="grid col-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-hd"><div><div class="card-title">Pipeline by Province</div><div class="card-sub">Project value distribution</div></div>
            <div class="seg" id="map-seg"><button data-m="map" class="${State.mapMode === "map" ? "on" : ""}">Map</button><button data-m="bar" class="${State.mapMode === "bar" ? "on" : ""}">Bars</button></div>
          </div>
          <div id="province-view"></div>
        </div>
        <div class="card">
          <div class="card-title">School Grade Matrix</div>
          <div class="card-sub">By Re-Score grade · pipeline value</div>
          <div id="grade-matrix" style="margin-top:12px"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-hd">
          <div>
            <div class="card-title">Top 10 Pipeline</div>
            <div class="card-sub">Best opportunities from Customer Pipeline (All Projects)</div>
          </div>
          <div class="seg" id="top-seg">
            <button data-m="score" class="on">By Score</button>
            <button data-m="value" class="">By Value</button>
            <button data-m="chance" class="">By Chance (%)</button>
          </div>
        </div>
        <div class="tbl-wrap" style="margin-top:10px">
          <table class="data"><thead><tr>
            <th class="c">No</th><th>School Name</th><th>Province</th>
            <th class="r">Project Value (THB)</th><th class="c">Chance (%)</th>
            <th>Salesperson</th><th class="c">Re-Score</th><th class="c">Point</th>
          </tr></thead><tbody id="top10-body"></tbody></table>
        </div>
        <div class="note"><b>หมายเหตุ</b> : By Score = เรียง Re-Score→Point→Chance · By Value = มูลค่าสูงสุด · By Chance = %โอกาสสูงสุด (ถ้าเท่ากัน เลือก Value สูงกว่า)</div>
      </div>
    `;

    // top-10 rendering
    if (!State.topMode) State.topMode = "score";
    function renderTop10() {
      const allRows = A.pipelineRows(data, "All");
      let sorted;
      if (State.topMode === "value") {
        sorted = [...allRows].sort((a, b) => b.projectValue - a.projectValue);
      } else if (State.topMode === "chance") {
        sorted = [...allRows].sort((a, b) => (b.chance - a.chance) || (b.projectValue - a.projectValue));
      } else {
        sorted = allRows; // already sorted by grade→point→chance
      }
      const top = sorted.slice(0, 10);
      const gradeTag = (g) => '<span class="tag g' + g + '">' + g + '</span>';
      document.getElementById("top10-body").innerHTML = top.map((r, i) => `<tr>
        <td class="c rank">${i + 1}</td>
        <td class="school-cell">${r.name}</td><td>${r.province}</td>
        <td class="r num">${r.projectValue.toLocaleString()}</td>
        <td class="c"><span class="chance"><span class="cdot ${chanceClass(r.chance)}"></span>${r.chance}%</span></td>
        <td>${r.salesperson}</td><td class="c">${gradeTag(r.grade)}</td>
        <td class="c"><b class="num" style="color:var(--navy)">${r.reScore}</b></td>
      </tr>`).join("");
    }
    renderTop10();

    // funnel · plan vs actual
    const fpa = A.planVsActual(State.planActual, State.filters.sales);
    CH.funnelPA(document.getElementById("funnel-pa"), fpa.rows);
    // sales chart
    CH.salesperson(document.getElementById("c-sales"), A.salesperson(data));
    // grade matrix
    renderGradeMatrix(document.getElementById("grade-matrix"), A.gradeMatrix(data));
    // province view
    renderProvince(data, State);
    document.getElementById("map-seg").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      State.mapMode = b.dataset.m;
      document.querySelectorAll("#map-seg button").forEach((x) => x.classList.toggle("on", x.dataset.m === State.mapMode));
      renderProvince(data, State);
    });
    // top-10 toggle
    document.getElementById("top-seg").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      State.topMode = b.dataset.m;
      document.querySelectorAll("#top-seg button").forEach((x) => x.classList.toggle("on", x.dataset.m === State.topMode));
      renderTop10();
    });
  }

  function renderProvince(data, State) {
    const host = document.getElementById("province-view");
    const pdata = A.byProvince(data);
    if (State.mapMode === "bar") {
      host.innerHTML = `<div style="margin-top:6px" id="prov-bars"></div>`;
      CH.provinceBars(document.getElementById("prov-bars"), pdata);
    } else {
      host.innerHTML = `<div class="map-box"><div class="map-svg map-loading" id="map-svg">Loading map…</div>
        <div class="map-legend" id="map-legend"></div></div>`;
      document.getElementById("map-legend").innerHTML = pdata.slice(0, 7).map((d) => `
        <div class="prov-row" style="grid-template-columns:80px 28px 1fr 56px"><div class="prov-name">${d.province}</div>
        <div class="prov-proj">${d.totalProjects || "—"}</div>
        <div class="prov-track"><div class="prov-fill" style="width:${(d.value / pdata[0].value) * 100}%"></div></div>
        <div class="prov-val">${fmtM(d.value)}</div></div>`).join("");
      CH.map(document.getElementById("map-svg"), pdata).then(() => {
        const m = document.getElementById("map-svg");
        if (m && m.dataset.ok === "0") { State.mapMode = "bar"; renderProvince(data, State);
          document.querySelectorAll("#map-seg button").forEach((x) => x.classList.toggle("on", x.dataset.m === "bar")); }
      });
    }
    // province detail table below the chart
    const detailHTML = pdata.map((d) => `
      <div class="prov-detail">
        <div class="prov-detail-hd">
          <b>${d.province}</b>
          <span style="color:var(--muted);font-size:10px">${d.schoolCount} Schools · ${d.totalProjects} Projects · ${fmtM(d.value)}</span>
        </div>
        <div class="prov-detail-list">${d.schools.map((s) => `<span class="prov-school-chip g${s.grade || "D"}">${s.name}</span>`).join("")}</div>
      </div>`).join("");
    const wrap = document.createElement("div");
    wrap.className = "prov-details-wrap";
    wrap.innerHTML = `<div class="prov-details-toggle" id="prov-toggle">▼ รายชื่อโรงเรียนแยกตาม Province</div><div class="prov-details" id="prov-details" style="display:none">${detailHTML}</div>`;
    host.appendChild(wrap);
    document.getElementById("prov-toggle").addEventListener("click", () => {
      const det = document.getElementById("prov-details");
      const open = det.style.display !== "none";
      det.style.display = open ? "none" : "block";
      document.getElementById("prov-toggle").textContent = (open ? "▼" : "▲") + " รายชื่อโรงเรียนแยกตาม Province";
    });
  }

  function renderGradeMatrix(host, gm) {
    const G = {
      A: { accent: "#2e9e5b", bg: "#e6f5ec", label: "Grade A", sub: "Re-Score 85-100" },
      B: { accent: "#2f6fe0", bg: "#eaf1fd", label: "Grade B", sub: "Re-Score 70-84" },
      C: { accent: "#7a6ad0", bg: "#eeebfa", label: "Grade C", sub: "Re-Score 60-69" },
      D: { accent: "#e8554e", bg: "#fdeceb", label: "Grade D", sub: "Re-Score ≤59" },
    };
    const cell = (g, c, d) => `
      <div style="background:${c.bg};border:1.5px solid ${c.accent}33;border-radius:12px;padding:13px;text-align:center;transition:.18s" onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform=''">
        <div style="font-family:var(--display);font-size:19px;font-weight:800;color:${c.accent}">${c.label}</div>
        <div style="font-size:11px;color:var(--muted);margin:2px 0 8px">${c.sub}</div>
        <div style="font-family:var(--display);font-size:24px;font-weight:700;color:var(--navy)">${d.count}</div>
        <div style="font-size:11px;color:var(--ink-soft);font-weight:600">Schools</div>
        <div style="font-family:var(--display);font-size:16px;font-weight:700;color:var(--navy);margin-top:4px">${d.projects}</div>
        <div style="font-size:11px;color:var(--ink-soft);font-weight:600">Projects</div>
        <div style="font-size:12px;color:${c.accent};font-weight:700;margin-top:4px">${CH.fmtM(d.value)}</div>
        <div style="font-size:10px;color:var(--muted)">Project Value</div>
      </div>`;
    const hcCell = (g, c, d) => `
      <div style="background:${c.bg};border:1.5px dashed ${c.accent}66;border-radius:12px;padding:13px;text-align:center;transition:.18s" onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform=''">
        <div style="font-family:var(--display);font-size:14px;font-weight:700;color:${c.accent}">${c.label}</div>
        <div style="font-size:10px;color:var(--muted);margin:1px 0 6px">Chance ≥ 70%</div>
        <div style="font-family:var(--display);font-size:20px;font-weight:700;color:var(--navy)">${d.hcSchools}</div>
        <div style="font-size:10px;color:var(--ink-soft);font-weight:600">Schools</div>
        <div style="font-family:var(--display);font-size:14px;font-weight:700;color:var(--navy);margin-top:3px">${d.hcProjects}</div>
        <div style="font-size:10px;color:var(--ink-soft);font-weight:600">Projects</div>
        <div style="font-size:11px;color:${c.accent};font-weight:700;margin-top:3px">${CH.fmtM(d.hcValue)}</div>
        <div style="font-size:10px;color:var(--muted)">Value</div>
      </div>`;
    host.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px">
        ${["A","B","C","D"].map(g => cell(g, G[g], gm[g])).join("")}
      </div>
      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin:8px 0 6px">High Chance (≥70%)</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        ${["A","B","C","D"].map(g => hcCell(g, G[g], gm[g])).join("")}
      </div>`;
  }

  function chanceClass(c) { return c >= 60 ? "g" : c >= 40 ? "y" : "r"; }
  function topRows(rows) {
    return rows.map((r) => `<tr>
      <td class="school-cell">${r.name}</td><td>${r.province}</td><td><span class="tag funnel">${r.funnel}</span></td>
      <td class="r num">${r.projectValue.toLocaleString()}</td>
      <td class="c"><span class="chance"><span class="cdot ${chanceClass(r.chance)}"></span>${r.chance}%</span></td>
      <td class="r num">${r.weightedValue.toLocaleString()}</td><td>${r.salesperson}</td><td>${fmtDate(r.followUpDate)}</td>
    </tr>`).join("");
  }
  function fmtDate(d) {
    if (!d) return "—";
    const [y, m, day] = d.split("-"); const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${parseInt(day)} ${names[parseInt(m) - 1]} ${y.slice(2)}`;
  }

  window.Pages = { executive };
  window._pageHelpers = { kpiCard, chanceClass, fmtDate, topRows, fmtInit };
})();
