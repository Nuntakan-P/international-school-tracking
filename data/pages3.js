/* ============================================================
   pages3.js — Customer Analysis (Page 5)
   Heat map + search + CLICK → Radar Chart modal (7 dimensions)
   ============================================================ */
(function () {
  const CH = window.Charts;
  const GRADE = {
    A: { bg:"#e6f5ec", border:"#2e9e5b", text:"#1a6b37", accent:"#2e9e5b", label:"Re-Score A (85-100)", desc:"Top Priority" },
    B: { bg:"#eaf1fd", border:"#2f6fe0", text:"#1b4f9c", accent:"#2f6fe0", label:"Re-Score B (70-84)", desc:"High Potential" },
    C: { bg:"#eeebfa", border:"#7a6ad0", text:"#4a3a9c", accent:"#7a6ad0", label:"Re-Score C (60-69)", desc:"Medium Priority" },
    D: { bg:"#fdeceb", border:"#e8554e", text:"#b53b34", accent:"#e8554e", label:"Re-Score D (≤59)", desc:"Monitor" },
  };

  // Text → numeric score (0-100) for each radar axis
  const SCORE_MAP = {
    tuition:       { "High (>500K/yr)":100, "Mid (200-500K/yr)":55, "Low (<200K/yr)":20, _def:30 },
    classLevel:    { "Early-Nursery & Primary & Secondary":100, "Primary & Secondary":80, "Early-Nursery":60, "Primary":50, "Secondary":40, _def:50 },
    students:      { "≥801":100, "400-800":60, "399≤":25, _def:30 },
    facilityStatus:{ "New & Modern":100, "Good Condition":75, "Old & Deteriorated":40, "Insufficient":20, _def:40 },
    readyLand:     { "New Area & Ready to Develop":100, "Old Area & Ready to Develop":70, "Old Area & Waiting a Budget":35, "No Land Available":10, _def:40 },
    reputation:    { "Advertise & Low Competition":100, "No Advertise & Low Competition":75, "Advertise & High Competition":50, "No Advertise & High Competition":25, _def:50 },
    relationship:  { "Reach to Owner":100, "Reach to Principal":75, "Reach to Procurement":50, "No Contact":20, _def:40 },
  };
  const AXES = [
    { key:"tuition",       label:"Tuition" },
    { key:"classLevel",    label:"Class Level" },
    { key:"students",      label:"No. of Students" },
    { key:"facilityStatus",label:"Facility Status" },
    { key:"readyLand",     label:"Ready Land" },
    { key:"reputation",    label:"Reputation &\nCompetition" },
    { key:"relationship",  label:"Relationship" },
  ];
  function getScore(s, key) {
    const map = SCORE_MAP[key]; if (!map) return 50;
    const v = s[key]; if (!v) return map._def;
    return map[v] !== undefined ? map[v] : map._def;
  }

  let radarInst = null;

  function customer(el, data) {
    const groups = { A:[], B:[], C:[], D:[] };
    [...data].sort((a, b) => {
      if (a.grade !== b.grade) return ["A","B","C","D"].indexOf(a.grade) - ["A","B","C","D"].indexOf(b.grade);
      return b.reScore - a.reScore;
    }).forEach(s => { if (groups[s.grade]) groups[s.grade].push(s); });
    const totalByGrade = Object.fromEntries(["A","B","C","D"].map(g => [g, groups[g].length]));

    el.innerHTML = `
      <div class="page-head">
        <h2>Customer Analysis</h2>
        <span class="sub">Re-Score heat map · ${data.length} schools · hover = ข้อมูล · คลิก = Radar Analysis</span>
      </div>
      <div class="ca-search-wrap">
        <input type="text" id="ca-search" class="ca-search" placeholder="🔍 ค้นหาชื่อโรงเรียน... (Search school name)" autocomplete="off">
        <div class="ca-search-hint" id="ca-search-hint"></div>
      </div>
      <div class="ca-legend card tight" style="margin-bottom:16px">
        <div class="ca-leg-grid">
          ${Object.entries(GRADE).map(([g,c]) => `
            <div class="ca-leg-item">
              <div class="ca-leg-dot" style="background:${c.accent}"></div>
              <div>
                <div class="ca-leg-name" style="color:${c.text}">${c.label} <span style="font-weight:400;color:var(--muted)">${c.desc}</span></div>
                <div class="ca-leg-cnt">${totalByGrade[g]} schools</div>
              </div>
            </div>`).join("")}
          <div class="ca-leg-sep"></div>
          <div class="ca-leg-hint"><u><b>Bold + Underline</b></u> = Score ลดลง ▼ &nbsp;|&nbsp; Regular = Score เพิ่ม / คงที่ ▲ &nbsp;·&nbsp; 🖱 คลิก tile เพื่อดู Radar Analysis</div>
        </div>
      </div>
      <div class="ca-sections" id="ca-sections"></div>
      <div class="ca-tooltip" id="ca-tooltip" role="tooltip"></div>
      <div class="radar-modal" id="radar-modal" style="display:none"><div class="radar-backdrop" id="radar-backdrop"></div><div class="radar-card" id="radar-card"></div></div>`;

    const sections = document.getElementById("ca-sections");
    ["A","B","C","D"].forEach(grade => {
      const schools = groups[grade]; if (!schools.length) return;
      const c = GRADE[grade];
      const sec = document.createElement("div"); sec.className = "ca-section";
      sec.innerHTML = `
        <div class="ca-sec-hd">
          <span class="ca-grade-badge" style="background:${c.accent};color:#fff">Grade ${grade}</span>
          <span class="ca-sec-title" style="color:${c.text}">${c.label}</span>
          <span class="ca-sec-desc">— ${c.desc}</span>
          <span class="ca-sec-count">${schools.length} schools</span>
        </div>
        <div class="ca-grid">
          ${schools.map(s => {
            const dec = s.reScore < s.initialScore, diff = s.reScore - s.initialScore;
            return `<div class="ca-tile" style="--tc:${c.accent};--tb:${c.border};--tbg:${c.bg};--tt:${c.text}" data-no="${s.no}" tabindex="0" title="คลิกเพื่อดู Radar Analysis">
              <div class="ca-name ${dec?"ca-dec":"ca-inc"}">${s.name}</div>
              <div class="ca-tile-foot"><span class="ca-re">${s.reScore}</span><span class="ca-chg ${dec?"neg":"pos"}">${diff>=0?"▲+":"▼"}${Math.abs(diff)}</span></div>
            </div>`;
          }).join("")}
        </div>`;
      sections.appendChild(sec);
    });

    // ---- search ----
    const searchInput = document.getElementById("ca-search");
    const searchHint = document.getElementById("ca-search-hint");
    let lastHL = null;
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();
      if (lastHL) { lastHL.classList.remove("ca-highlight"); lastHL = null; }
      if (!q) { searchHint.textContent = ""; return; }
      const match = [...sections.querySelectorAll(".ca-tile")].find(t => {
        const s = data.find(x => x.no === parseInt(t.dataset.no));
        return s && s.name.toLowerCase().includes(q);
      });
      if (match) {
        match.classList.add("ca-highlight"); lastHL = match;
        const top = window.pageYOffset + match.getBoundingClientRect().top - 120;
        window.scrollTo({ top, behavior:"smooth" });
        const s = data.find(x => x.no === parseInt(match.dataset.no));
        searchHint.innerHTML = `<span class="sh-found">✓ พบ: ${s?s.name:""}</span>`;
      } else {
        searchHint.innerHTML = `<span class="sh-notfound">ไม่พบโรงเรียนที่ค้นหา</span>`;
      }
    });
    searchInput.addEventListener("keydown", e => {
      if (e.key === "Escape") { searchInput.value=""; searchHint.textContent=""; if(lastHL){lastHL.classList.remove("ca-highlight");lastHL=null;} }
    });

    // ---- tooltip ----
    const tip = document.getElementById("ca-tooltip");
    const sbar = v => `<div class="tt-scorebar"><div class="tt-scorefill" style="width:${v}%;background:currentColor"></div></div>`;
    const row = (l,v,c) => `<div class="tt-row"><span class="tt-lbl">${l}</span><span class="tt-val${c?" "+c:""}">${v||"—"}</span></div>`;
    sections.querySelectorAll(".ca-tile").forEach(tile => {
      tile.addEventListener("mouseenter", e => {
        const s = data.find(x => x.no === parseInt(tile.dataset.no)); if (!s) return;
        const c = GRADE[s.grade], diff = s.reScore - s.initialScore;
        tip.innerHTML = `
          <div class="tt-head" style="border-left-color:${c.accent}">
            <div class="tt-school">${s.name}</div>
            <div class="tt-meta">${s.province} · ${s.salesperson}</div>
          </div>
          <div class="tt-body">
            <div class="tt-score-block">
              <div class="tt-grade-big" style="color:${c.accent}">Grade ${s.grade}</div>
              <div class="tt-score-nums"><div style="flex:0 0 auto"><span class="tt-lbl">Re-Score</span><span class="tt-big" style="color:${c.accent}">${s.reScore}</span><span style="font-size:11px;color:var(--muted)">/100</span></div><div style="flex:1;color:${c.accent}">${sbar(s.reScore)}</div></div>
              <div class="tt-change ${diff>=0?"pos":"neg"}">${diff>=0?"▲":"▼"} ${Math.abs(diff)} pts from initial (${s.initialScore})</div>
            </div>
            <div class="tt-divider"></div>
            <div class="tt-rows">${row("Funnel Stage",`<span class="tag funnel">${s.funnel}</span>`)}${row("Project Value","฿"+s.projectValue.toLocaleString("en-US"))}${row("Chance (%)",""+s.chance+"%",s.chance>=60?"pos":s.chance<40?"neg":"")}${row("Curriculum",s.curriculum)}${row("Status",s.status)}</div>
            <div class="tt-divider"></div>
            <div class="tt-sec-hd">End of Year 2026</div>
            <div class="tt-rows">${row("Tuition",s.tuition)}${row("Class Level",s.classLevel)}${row("No. of Student",s.students)}${row("Facility Status",s.facilityStatus)}${row("Ready Land",s.readyLand)}${row("Reputation",s.reputation)}${row("Relationship",s.relationship)}</div>
            <div class="tt-note">📅 ${s.followUpDate||"—"} &nbsp;·&nbsp; 🖱 คลิกเพื่อดู Radar Analysis</div>
          </div>`;
        tip.classList.add("visible");
        anchorTip(tile);
      });
      tile.addEventListener("mouseleave", () => tip.classList.remove("visible"));

      // click → radar modal
      tile.addEventListener("click", () => {
        const s = data.find(x => x.no === parseInt(tile.dataset.no)); if (!s) return;
        tip.classList.remove("visible");
        openRadar(s);
      });
    });

    // Anchor the info card next to the hovered tile (right side, flips left if no room,
    // clamps vertically to stay fully on-screen) — measured AFTER content is set.
    function anchorTip(tile) {
      const r = tile.getBoundingClientRect();
      const tw = tip.offsetWidth || 272, th = tip.offsetHeight || 420;
      const gap = 12, vw = window.innerWidth, vh = window.innerHeight;
      let x = r.right + gap;
      if (x + tw > vw - 8) x = r.left - tw - gap;     // flip to the left
      if (x < 8) x = Math.max(8, vw - tw - 8);         // last-resort clamp
      let y = r.top;                                   // align to tile top
      if (y + th > vh - 8) y = vh - th - 8;            // pull up if overflowing bottom
      if (y < 8) y = 8;
      tip.style.left = x + "px";
      tip.style.top = y + "px";
    }

    document.getElementById("radar-backdrop").addEventListener("click", closeRadar);
    document.addEventListener("keydown", e => { if(e.key==="Escape") closeRadar(); });
  }

  function openRadar(s) {
    const modal = document.getElementById("radar-modal");
    const card = document.getElementById("radar-card");
    const c = GRADE[s.grade];
    const scores = AXES.map(a => getScore(s, a.key));
    card.innerHTML = `
      <button class="radar-close" id="radar-close" aria-label="Close">✕</button>
      <div class="radar-header" style="border-top:4px solid ${c.accent}">
        <span class="radar-grade-badge" style="background:${c.accent}">${s.grade}</span>
        <div>
          <div class="radar-school">${s.name}</div>
          <div class="radar-meta">${s.province} · ${s.salesperson} · Re-Score <b style="color:${c.accent}">${s.reScore}</b>/100</div>
        </div>
      </div>
      <div class="radar-body">
        <div class="radar-chart-wrap"><canvas id="radar-canvas" width="360" height="360"></canvas></div>
        <div class="radar-scores">
          <div class="radar-scores-title">7-Dimension Analysis</div>
          ${AXES.map((a,i) => {
            const sc=scores[i], v=s[a.key]||"—";
            const bar = `<div style="height:5px;background:var(--line-soft);border-radius:4px;overflow:hidden;margin-top:4px"><div style="height:100%;width:${sc}%;background:${c.accent};border-radius:4px"></div></div>`;
            return `<div class="radar-row">
              <div class="radar-row-hd"><span class="radar-dim">${a.label.replace("\\n"," ")}</span><span class="radar-sc" style="color:${c.accent}">${sc}</span></div>
              <div class="radar-val-txt">${v}</div>${bar}
            </div>`;
          }).join("")}
        </div>
      </div>`;
    modal.style.display = "flex";
    document.getElementById("radar-close").addEventListener("click", closeRadar);

    if (radarInst) { radarInst.destroy(); radarInst = null; }
    const ctx = document.getElementById("radar-canvas").getContext("2d");
    radarInst = new Chart(ctx, {
      type: "radar",
      data: {
        labels: AXES.map(a => a.label.replace("\\n","\n")),
        datasets: [{
          label: s.name, data: scores,
          backgroundColor: c.accent + "28",
          borderColor: c.accent, borderWidth: 2.5,
          pointBackgroundColor: c.accent, pointRadius: 4.5,
          pointHoverRadius: 7,
        }],
      },
      options: {
        responsive:false, animation:{duration:700,easing:"easeOutQuart"},
        scales:{r:{min:0,max:100,ticks:{stepSize:25,display:false},grid:{color:"#e6ecf4"},angleLines:{color:"#e6ecf4"},pointLabels:{font:{size:11.5,weight:"600",family:"'IBM Plex Sans Thai',sans-serif"},color:"#46536a"}}},
        plugins:{legend:{display:false},tooltip:{callbacks:{label:c2=>AXES[c2.dataIndex]?.key?" "+c2.raw+"/100":""+c2.raw}}},
      },
    });
  }

  function closeRadar() {
    const modal = document.getElementById("radar-modal");
    if (modal) modal.style.display = "none";
    if (radarInst) { radarInst.destroy(); radarInst = null; }
  }

  Object.assign(window.Pages, { customer });
})();
