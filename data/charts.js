/* ============================================================
   charts.js — rendering layer.
   Chart.js for bar / line / scatter / donut.
   Hand-built SVG for funnel + Thailand choropleth.
   All builders register their instance so a re-render can
   cleanly destroy + redraw (used on filter / data change).
   ============================================================ */
(function () {
  const C = {
    blue: "#2f6fe0", blueDark: "#1b4f9c", navy: "#13315c",
    funnel: ["#1b4f9c", "#2f6fe0", "#4f93ef", "#3bb5a3", "#5cc26b", "#a2c723", "#f0a431", "#e8554e"],
    grades: { A: "#2e9e5b", B: "#2f6fe0", C: "#7a6ad0", D: "#e8554e" },
    tiers: { HH: "#2e9e5b", HL: "#9ccc5a", LH: "#f2c43d", LL: "#e8645c" },
    tiersSoft: { HH: "#e6f5ec", HL: "#f0f7e6", LH: "#fdf6df", LL: "#fdeceb" },
    curriculum: ["#2f6fe0", "#4f93ef", "#3bb5a3", "#9ccc5a", "#f0a431", "#e8645c", "#8a7fe0"],
    grid: "#eef2f7", axis: "#9aa7ba", text: "#46536a",
    plan: "#cfdaeb", actual: "#2f6fe0", achieve: "#f0a431",
  };

  const registry = {};
  function destroy(key) { if (registry[key]) { registry[key].destroy(); delete registry[key]; } }
  function setup() {
    if (!window.Chart) return;
    Chart.defaults.font.family = "'IBM Plex Sans Thai','IBM Plex Sans',sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = C.text;
    Chart.defaults.animation.duration = 850;
    Chart.defaults.animation.easing = "easeOutQuart";
    Chart.defaults.plugins.tooltip.backgroundColor = "#16233a";
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.titleFont = { weight: "600" };
    Chart.defaults.plugins.tooltip.boxPadding = 4;
  }

  const fmtM = (v) => (v >= 1e6 ? (v / 1e6).toFixed(2) + "M" : v >= 1e3 ? (v / 1e3).toFixed(0) + "K" : "" + v);
  const fmtTHB = (v) => "฿" + v.toLocaleString("en-US");

  /* ---------- Funnel (SVG) ---------- */
  function funnel(el, data) {
    const W = el.clientWidth || 360, rowH = 34, gap = 8, topW = 1, botW = 0.34;
    const H = data.length * (rowH + gap);
    const maxPct = 1;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="xMidYMid meet" font-family="inherit">`;
    data.forEach((d, i) => {
      const t = i / (data.length - 1);
      const wTop = (topW - (topW - botW) * (i / data.length)) * W;
      const wBot = (topW - (topW - botW) * ((i + 1) / data.length)) * W;
      const y = i * (rowH + gap);
      const x1 = (W - wTop) / 2, x2 = (W - wBot) / 2;
      const color = C.funnel[i] || C.blue;
      svg += `<polygon points="${x1},${y} ${x1 + wTop},${y} ${x2 + wBot},${y + rowH} ${x2},${y + rowH}"
        fill="${color}" opacity="0.97" class="fn-poly" style="animation-delay:${i * 70}ms"/>`;
      svg += `<text x="${W / 2}" y="${y + rowH / 2 + 4}" text-anchor="middle" fill="#fff" font-size="12.5" font-weight="600">${d.count} (${(d.pct * 100).toFixed(1)}%)</text>`;
    });
    svg += `</svg>`;
    // labels column rendered separately by app; here we include left labels
    el.innerHTML = svg;
  }

  /* ---------- Province horizontal bars (HTML) ---------- */
  function provinceBars(el, data) {
    const max = Math.max(...data.map((d) => d.value), 1);
    el.innerHTML = data.map((d) => `
      <div class="prov-row">
        <div class="prov-name">${d.province}</div>
        <div class="prov-proj">${d.totalProjects || "—"}</div>
        <div class="prov-track"><div class="prov-fill" style="width:${(d.value / max) * 100}%"></div></div>
        <div class="prov-val">${fmtM(d.value)}</div>
      </div>`).join("");
  }

  /* ---------- Salesperson combo (grouped bar pipeline + PO/Install) ---------- */
  function salesperson(canvas, data) {
    destroy("sales");
    const ctx = canvas.getContext("2d");
    registry.sales = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map((d) => d.name),
        datasets: [
          { label: "Pipeline (THB)", data: data.map((d) => d.pipeline), backgroundColor: C.blue, borderRadius: 5, yAxisID: "y", barPercentage: 0.55, categoryPercentage: 0.6 },
          { label: "PO (Count)", data: data.map((d) => d.poCount), backgroundColor: "#5cc26b", borderRadius: 5, yAxisID: "y1", barPercentage: 0.55, categoryPercentage: 0.6 },
          { label: "Install (Count)", data: data.map((d) => d.installCount), backgroundColor: C.achieve, borderRadius: 5, yAxisID: "y1", barPercentage: 0.55, categoryPercentage: 0.6 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "top", labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: "rectRounded" } },
          tooltip: { callbacks: { label: (c) => c.datasetIndex === 0 ? " " + fmtTHB(c.raw) : ` ${c.dataset.label}: ${c.raw}` } } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { weight: "600", size: 13 } } },
          y: { position: "left", grid: { color: C.grid }, ticks: { callback: (v) => fmtM(v) }, border: { display: false } },
          y1: { position: "right", grid: { display: false }, beginAtZero: true, suggestedMax: 50, border: { display: false } },
        },
      },
    });
  }

  /* ---------- Curriculum donut ---------- */
  function curriculum(canvas, data) {
    destroy("curr");
    registry.curr = new Chart(canvas.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: data.map((d) => d.name),
        datasets: [{ data: data.map((d) => d.count), backgroundColor: data.map((_, i) => C.curriculum[i % C.curriculum.length]), borderWidth: 2, borderColor: "#fff", hoverOffset: 6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: "62%",
        plugins: { legend: { position: "right", labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: "circle", padding: 10,
          generateLabels: (chart) => {
            const ds = chart.data.datasets[0]; const total = ds.data.reduce((a, b) => a + b, 0);
            return chart.data.labels.map((l, i) => ({ text: `${l}  ${ds.data[i]} (${Math.round(ds.data[i] / total * 100)}%)`, fillStyle: ds.backgroundColor[i], strokeStyle: ds.backgroundColor[i], index: i }));
          } } },
          tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.raw}` } } },
      },
    });
  }

  /* ---------- Score scatter (initial vs re-score), coloured by Re-Score grade ---------- */
  function scatter(canvas, data) {
    destroy("scatter");
    const byGrade = {};
    ["A", "B", "C", "D"].forEach((g) => (byGrade[g] = []));
    data.forEach((d) => byGrade[d.grade] && byGrade[d.grade].push({ x: d.x, y: d.y, name: d.name }));
    registry.scatter = new Chart(canvas.getContext("2d"), {
      type: "scatter",
      data: {
        datasets: ["A", "B", "C", "D"].map((g) => ({
          label: "Grade " + g, data: byGrade[g], backgroundColor: C.grades[g],
          pointRadius: 4.5, pointHoverRadius: 7, borderColor: "#fff", borderWidth: 0.6,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "right", labels: { boxWidth: 9, boxHeight: 9, usePointStyle: true, pointStyle: "circle", padding: 12 } },
          tooltip: { callbacks: { title: (items) => items[0].raw.name, label: (c) => ` Initial ${c.raw.x} → Re-Score ${c.raw.y}` } } },
        scales: {
          x: { min: 0, max: 100, title: { display: true, text: "Initial Score", color: C.axis }, grid: { color: C.grid }, border: { display: false } },
          y: { min: 0, max: 100, title: { display: true, text: "Re-Score", color: C.axis }, grid: { color: C.grid }, border: { display: false } },
        },
      },
    });
  }

  /* ---------- Score distribution bars ---------- */
  function scoreDist(canvas, data) {
    destroy("dist");
    registry.dist = new Chart(canvas.getContext("2d"), {
      type: "bar",
      data: { labels: data.map((d) => d.label), datasets: [{ data: data.map((d) => d.pct), backgroundColor: C.funnel.map((_, i) => "#7fb0f2"), hoverBackgroundColor: C.blue, borderRadius: 6, barPercentage: 0.7 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.raw}% of schools` } },
          datalabels: false },
        scales: { x: { grid: { display: false }, ticks: { font: { weight: "600" } }, border: { display: false } },
          y: { display: false, max: Math.max(...data.map((d) => d.pct)) * 1.25 } },
      },
      plugins: [{
        id: "topLabels", afterDatasetsDraw(chart) {
          const { ctx } = chart; ctx.save(); ctx.font = "600 12px 'IBM Plex Sans Thai'"; ctx.fillStyle = C.text; ctx.textAlign = "center";
          chart.getDatasetMeta(0).data.forEach((bar, i) => { ctx.fillText(data[i].pct + "%", bar.x, bar.y - 6); });
          ctx.restore();
        },
      }],
    });
  }

  /* ---------- Plan vs Actual (horizontal bars + achievement line + data labels) ---------- */
  function planActual(canvas, pa) {
    destroy("pa");
    registry.pa = new Chart(canvas.getContext("2d"), {
      data: {
        labels: pa.rows.map((r) => r.stage),
        datasets: [
          { type: "bar", label: "Plan", data: pa.rows.map((r) => r.plan), backgroundColor: C.plan, borderRadius: 4, barPercentage: 0.8, categoryPercentage: 0.7, order: 3 },
          { type: "bar", label: "Actual", data: pa.rows.map((r) => r.actual), backgroundColor: C.actual, borderRadius: 4, barPercentage: 0.8, categoryPercentage: 0.7, order: 2 },
          { type: "line", label: "% Achievement", data: pa.rows.map((r) => r.pct), borderColor: C.achieve, backgroundColor: C.achieve, yAxisID: "y1", tension: 0.3, pointRadius: 4, pointBackgroundColor: "#fff", pointBorderColor: C.achieve, pointBorderWidth: 2, order: 1 },
        ],
      },
      options: {
        indexAxis: "y", responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: "top", labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: "rectRounded" } },
          tooltip: { callbacks: { label: (c) => c.dataset.type === "line" ? ` Achievement: ${c.raw}%` : ` ${c.dataset.label}: ${c.raw}` } },
        },
        scales: {
          x: { grid: { color: C.grid }, beginAtZero: true, border: { display: false } },
          y: { grid: { display: false }, ticks: { font: { weight: "600" } }, border: { display: false } },
          y1: { display: false, min: 0, max: 100 },
        },
      },
      plugins: [{
        id: "barLabels",
        afterDatasetsDraw(chart) {
          const { ctx } = chart;
          ctx.save();
          // Plan labels (dataset 0)
          ctx.font = "600 10px 'IBM Plex Sans Thai'";
          chart.getDatasetMeta(0).data.forEach((bar, i) => {
            const v = pa.rows[i].plan;
            ctx.fillStyle = "#5b6b85";
            ctx.textAlign = "left";
            ctx.fillText(v, bar.x + 4, bar.y + 4);
          });
          // Actual labels (dataset 1)
          chart.getDatasetMeta(1).data.forEach((bar, i) => {
            const v = pa.rows[i].actual;
            ctx.fillStyle = "#fff";
            ctx.textAlign = "left";
            ctx.fillText(v, Math.max(bar.base + 4, bar.x - 24), bar.y + 4);
          });
          // Achievement % labels (dataset 2 - line)
          ctx.font = "700 10px 'Sora'";
          chart.getDatasetMeta(2).data.forEach((pt, i) => {
            ctx.fillStyle = C.achieve;
            ctx.textAlign = "center";
            ctx.fillText(pa.rows[i].pct + "%", pt.x, pt.y - 8);
          });
          ctx.restore();
        },
      }],
    });
  }

  /* ---------- Achievement gauge (SVG ring) ---------- */
  function gauge(el, pct) {
    const r = 70, cx = 90, cy = 90, circ = 2 * Math.PI * r;
    const off = circ * (1 - pct / 100);
    el.innerHTML = `
      <svg viewBox="0 0 180 180" width="180" height="180">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#eef2f7" stroke-width="16"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.blue}" stroke-width="16"
          stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ}"
          transform="rotate(-90 ${cx} ${cy})" style="transition:stroke-dashoffset 1.1s cubic-bezier(.2,.7,.3,1)">
          <animate attributeName="stroke-dashoffset" from="${circ}" to="${off}" dur="1.1s" fill="freeze" calcMode="spline" keySplines="0.2 0.7 0.3 1" keyTimes="0;1"/>
        </circle>
        <text x="90" y="98" text-anchor="middle" font-size="34" font-weight="700" fill="${C.navy}" font-family="'Sora',sans-serif">${pct}%</text>
      </svg>`;
  }

  /* ---------- Thailand choropleth map ----------
     Loads simplified provinces GeoJSON from CDN at runtime,
     renders SVG paths with manual equirectangular projection,
     colours by pipeline value. Falls back silently on error. */
  let GEO_CACHE = null;
  const PROV_ALIAS = {
    "Bangkok": ["Bangkok", "Krung Thep Maha Nakhon", "Bangkok Metropolis"],
    "Chonburi": ["Chon Buri", "Chonburi"], "Chiang Mai": ["Chiang Mai"],
    "Phuket": ["Phuket"], "Nonthaburi": ["Nonthaburi", "Nonthaburi "],
    "Rayong": ["Rayong"], "Samut Prakan": ["Samut Prakan", "Samut Prakarn"],
    "Pathum Thani": ["Pathum Thani"],
  };
  function provColorScale(provData) {
    const max = Math.max(...provData.map((d) => d.value), 1);
    const lookup = {};
    provData.forEach((d) => (lookup[d.province] = d.value));
    return { lookup, max };
  }
  async function map(el, provData) {
    el.classList.add("map-loading");
    try {
      if (!GEO_CACHE) {
        const res = await fetch("https://cdn.jsdelivr.net/gh/apisit/thailand.json@master/thailandWithName.json");
        GEO_CACHE = await res.json();
      }
      const geo = GEO_CACHE;
      const feats = geo.features;
      // bbox
      let minX = 999, minY = 999, maxX = -999, maxY = -999;
      const eachCoord = (coords, cb) => {
        if (typeof coords[0] === "number") cb(coords);
        else coords.forEach((c) => eachCoord(c, cb));
      };
      feats.forEach((f) => eachCoord(f.geometry.coordinates, ([x, y]) => {
        if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      }));
      const W = 240, H = 420, pad = 8;
      const sx = (W - pad * 2) / (maxX - minX), sy = (H - pad * 2) / (maxY - minY);
      const s = Math.min(sx, sy);
      const ox = pad + (W - pad * 2 - (maxX - minX) * s) / 2;
      const oy = pad + (H - pad * 2 - (maxY - minY) * s) / 2;
      const px = (x) => ox + (x - minX) * s;
      const py = (y) => oy + (maxY - y) * s;
      const { lookup, max } = provColorScale(provData);
      const nameKeys = Object.keys(PROV_ALIAS);
      const valueFor = (provName) => {
        for (const key of nameKeys) {
          if (PROV_ALIAS[key].some((a) => a.toLowerCase() === (provName || "").toLowerCase().trim())) return lookup[key] || 0;
        }
        return 0;
      };
      const color = (v) => {
        if (!v) return "#eef2f7";
        const t = Math.pow(v / max, 0.6);
        // light blue -> deep blue
        const lerp = (a, b) => Math.round(a + (b - a) * t);
        return `rgb(${lerp(207, 27)},${lerp(223, 79)},${lerp(243, 156)})`;
      };
      const pathFor = (geom) => {
        const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
        let d = "";
        polys.forEach((poly) => poly.forEach((ring) => {
          ring.forEach(([x, y], i) => { d += (i === 0 ? "M" : "L") + px(x).toFixed(1) + " " + py(y).toFixed(1); });
          d += "Z";
        }));
        return d;
      };
      let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`;
      feats.forEach((f) => {
        const nm = f.properties && (f.properties.CHA_NE || f.properties.name || f.properties.NAME_1 || f.properties.CHANGWAT_E || "");
        const v = valueFor(nm);
        svg += `<path d="${pathFor(f.geometry)}" fill="${color(v)}" stroke="#fff" stroke-width="0.4">
          <title>${nm}${v ? " — " + fmtM(v) : ""}</title></path>`;
      });
      svg += `</svg>`;
      el.innerHTML = svg;
      el.classList.remove("map-loading");
      el.dataset.ok = "1";
    } catch (e) {
      el.classList.remove("map-loading");
      el.dataset.ok = "0";
    }
  }

  /* ---------- Funnel · Plan vs Actual by stage (HTML bars) ----------
     Each stage shows a Plan bar + Actual bar (scaled to the max plan so
     the silhouette still tapers like a funnel) plus a % difference badge. */
  function funnelPA(el, rows) {
    const max = Math.max(...rows.map((r) => Math.max(r.plan, r.actual)), 1);
    el.innerHTML = rows.map((r, i) => {
      const diff = r.plan ? Math.round((r.actual - r.plan) / r.plan * 100) : 0;
      const dCls = diff >= 0 ? "up" : diff <= -15 ? "down" : "warn";
      const planW = (r.plan / max) * 100, actW = (r.actual / max) * 100;
      const color = C.funnel[i] || C.blue;
      return `<div class="fpa-row">
        <div class="fpa-label">${r.stage}</div>
        <div class="fpa-bars">
          <div class="fpa-bar plan"><i style="width:${planW}%"></i><b>Plan</b><span>${r.plan}</span></div>
          <div class="fpa-bar actual"><i style="width:${actW}%;background:linear-gradient(90deg,${color}cc,${color})"></i><b>Actual</b><span>${r.actual}</span></div>
        </div>
        <div class="fpa-diff ${dCls}"><span class="d-arr">${diff >= 0 ? "▲" : "▼"}</span>${diff >= 0 ? "+" : ""}${diff}%</div>
      </div>`;
    }).join("");
  }

  window.Charts = {
    setup, destroy, C, fmtM, fmtTHB,
    funnel, provinceBars, salesperson, curriculum, scatter,
    scoreDist, planActual, gauge, map, funnelPA,
  };
})();
