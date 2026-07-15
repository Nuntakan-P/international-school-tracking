/* ============================================================
   app.js — application core
   state · shell · filters · upload · count-up · orchestration
   ============================================================ */
(function () {
  const A = window.Analytics, CH = window.Charts, I = window.ICONS;

  /* ---------- state ---------- */
  const State = {
    schools: window.SEED_SCHOOLS.slice(),
    planActual: window.SEED_PLAN_ACTUAL,
    filters: { sales: "All", year: "All", month: "All", grade: "All" },
    page: "executive",
    mapMode: "map",
    dataLabel: "Seed dataset (demo)",
  };
  window.State = State;

  /* ---------- filtering ---------- */
  function yearKey(d) { return (d || "").slice(0, 4); }
  function monthNum(d) { return (d || "").slice(5, 7); }
  function getFiltered() {
    const f = State.filters;
    return State.schools.filter((s) =>
      (f.sales === "All" || s.salesperson === f.sales) &&
      (f.year === "All" || yearKey(s.updatedDate) === f.year) &&
      (f.month === "All" || monthNum(s.updatedDate) === f.month) &&
      (f.grade === "All" || s.grade === f.grade)
    );
  }
  window.getFiltered = getFiltered;

  function uniq(arr) { return [...new Set(arr)].filter(Boolean); }
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function monthLabel(k) {
    if (k === "All") return "All Months";
    return MONTH_NAMES[parseInt(k) - 1] || k;
  }

  /* ---------- shell ---------- */
  const TABS = [
    { id: "executive", label: "Executive Overview" },
    { id: "pipeline", label: "Customer Pipeline" },
    { id: "customer", label: "Customer Analysis" },
    { id: "score", label: "Score Analysis" },
    { id: "plan", label: "Activity Pipeline" },
  ];

  function buildSelect(id, label, options, value, labeler) {
    const opts = options.map((o) => `<option value="${o}" ${o === value ? "selected" : ""}>${labeler ? labeler(o) : o}</option>`).join("");
    return `<div class="select-wrap"><select class="fsel" data-filter="${id}" aria-label="${label}">${opts}</select></div>`;
  }

  function renderShell() {
    const root = document.getElementById("app");
    const monthVals = ["All", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    root.innerHTML = `
      <div class="topbar">
        <div class="brand">
          <div class="brand-mark">IS</div>
          <div class="brand-txt">
            <h1>International School Tracking</h1>
            <p>Sales Performance &amp; Customer Pipeline · CRM Dashboard</p>
          </div>
        </div>
        <div class="topbar-spacer"></div>
        <div class="asof"><span class="dot"></span><span id="data-label">${State.dataLabel}</span></div>
        <button class="btn" id="btn-export">${I.download}<span>Export CSV</span></button>
        <button class="btn btn-primary" id="btn-upload">${I.upload}<span>Upload Excel</span></button>
        <input type="file" id="file-input" accept=".xlsx,.xls" style="display:none">
      </div>

      <div class="tabs" id="tabs">
        ${TABS.map((t, i) => `<button class="tab ${t.id === State.page ? "active" : ""}" data-tab="${t.id}">
          <span class="tab-n">${i + 1}</span><span>${t.label}</span><span class="underline"></span></button>`).join("")}
      </div>

      <div class="filters">
        <span class="filter-label">${I.filter}Filters</span>
        ${buildSelect("sales", "Salesperson", ["All", ...uniq(State.schools.map((s) => s.salesperson)).sort()], State.filters.sales, (o) => o === "All" ? "All Salesperson" : o)}
        ${buildSelect("year", "Year", ["All", "2026", "2027"], State.filters.year, (o) => o === "All" ? "All Years" : o)}
        ${buildSelect("month", "Month", monthVals, State.filters.month, monthLabel)}
        ${buildSelect("grade", "Re-Score", ["All", "A", "B", "C", "D"], State.filters.grade, (o) => o === "All" ? "All Re-Score" : "Re-Score " + o)}
        <div class="filters-spacer"></div>
        <button class="reset-link" id="reset-filters">Reset filters</button>
      </div>

      <div id="page-content"></div>
      <div class="toast" id="toast"></div>
    `;

    // events
    document.getElementById("tabs").addEventListener("click", (e) => {
      const btn = e.target.closest(".tab"); if (!btn) return;
      State.page = btn.dataset.tab;
      document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === State.page));
      renderPage();
    });
    root.querySelectorAll("select.fsel").forEach((sel) => sel.addEventListener("change", (e) => {
      State.filters[e.target.dataset.filter] = e.target.value; renderPage();
    }));
    document.getElementById("reset-filters").addEventListener("click", () => {
      State.filters = { sales: "All", year: "All", month: "All", grade: "All" };
      renderShell(); renderPage();
    });
    document.getElementById("btn-upload").addEventListener("click", () => document.getElementById("file-input").click());
    document.getElementById("file-input").addEventListener("change", handleUpload);
    document.getElementById("btn-export").addEventListener("click", exportCSV);
  }

  /* ---------- page orchestration ---------- */
  function renderPage() {
    const data = getFiltered();
    const c = document.getElementById("page-content");
    CH.destroy("sales"); CH.destroy("curr"); CH.destroy("scatter"); CH.destroy("dist"); CH.destroy("pa");
    c.innerHTML = `<div class="page" id="page-inner"></div>`;
    const inner = document.getElementById("page-inner");
    window.Pages[State.page](inner, data, State);
    animateCounts(inner);
  }
  window.renderPage = renderPage;

  /* ---------- count-up ---------- */
  function fmtVal(v, fmt) {
    if (fmt === "money") return CH.fmtM(v);
    if (fmt === "pct") return v + "%";
    if (fmt === "decimal") return v.toFixed(1);
    return Math.round(v).toLocaleString("en-US");
  }
  function animateCounts(scope) {
    scope.querySelectorAll("[data-count]").forEach((el) => {
      const target = parseFloat(el.dataset.count); const fmt = el.dataset.fmt || "int";
      const dur = 900; const start = performance.now();
      const unit = el.dataset.unit ? `<span class="unit">${el.dataset.unit}</span>` : "";
      function step(now) {
        const t = Math.min(1, (now - start) / dur);
        const e = 1 - Math.pow(1 - t, 3);
        el.innerHTML = fmtVal(target * e, fmt) + unit;
        if (t < 1) requestAnimationFrame(step);
        else el.innerHTML = fmtVal(target, fmt) + unit;
      }
      requestAnimationFrame(step);
    });
  }
  window.animateCounts = animateCounts;

  /* ---------- toast ---------- */
  let toastTimer;
  function showToast(msg) {
    const t = document.getElementById("toast");
    t.innerHTML = I.check + "<span>" + msg + "</span>";
    t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
  }
  window.showToast = showToast;

  /* ---------- CSV export ---------- */
  function exportCSV() {
    const rows = getFiltered();
    const cols = ["no", "name", "province", "funnel", "tier", "salesperson", "curriculum", "initialScore", "reScore", "grade", "projectValue", "chance", "weightedValue", "status"];
    const head = cols.join(",");
    const body = rows.map((r) => cols.map((c) => {
      const v = r[c]; return typeof v === "string" && v.includes(",") ? `"${v}"` : v;
    }).join(",")).join("\n");
    const blob = new Blob([head + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "international_school_tracking.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("Exported " + rows.length + " rows to CSV");
  }

  /* ---------- xlsx upload ---------- */
  function handleUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
        const parsed = window.parseWorkbook(wb);
        if (parsed.schools.length) {
          State.schools = parsed.schools;
          if (parsed.planActual) State.planActual = parsed.planActual;
          State.dataLabel = file.name;
          State.filters = { sales: "All", year: "All", month: "All", grade: "All" };
          renderShell(); renderPage();
          showToast("Loaded " + parsed.schools.length + " schools from " + file.name);
        } else {
          showToast("No school rows found — check the Master_Database sheet");
        }
      } catch (err) {
        console.error(err); showToast("Could not read file: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  /* ---------- boot ---------- */
  function boot() {
    CH.setup();
    renderShell();
    renderPage();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
