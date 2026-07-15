/* ============================================================
   parser.js — map an uploaded .xlsx workbook into the app schema.
   Re-linked to the R.1 template headers (Master_Database + the
   dedicated Plan / Actual sheets). Tolerant of sparse data.

   ── Master_Database column map (0-indexed) ──────────────────
   [1] School Name      [2] Province        [3] Customer Funnel (type)
   [4] HH-HL-LH-LL      [5] Number of Project   [6] Salesperson
   [7] Curriculum
   Initial of Year 2026 : [8] Score  [9] Point-Score
       [10] Tuition [11] Class Level [12] No. of Student
       [13] Facility Status [14] Ready Land [15] Reputation&Competition [16] Relationship
   End of Year 2026     : [17] Re-Score [18] Point-Re-Score
       [19] Tuition [20] Class Level [21] No. of Student
       [22] Facility Status [23] Ready Land [24] Reputation&Competition [25] Relationship
   Project#1 [26..41]  Project#2 [42..57]  Project#3 [58..73]  (stride 16)
       within a block: +7 %โอกาส, +8 Status, +9 Main-Product, +15 Value Toal
   ── Plan/Actual sheets (per salesperson) ────────────────────
   <Name>_Plan   : P-Total Call..Install at cols [42..49] (8 stages)
   <Name>_Actual : A-Total Call..Install at cols [83..90] (8 stages)
   ============================================================ */
(function () {
  const STAGES = window.FUNNEL_STAGES ||
    ["Call", "Visit", "Demo", "Survey", "Present", "Quotation", "PO", "Install"];
  const gradeToScore = { A: 92, B: 77, C: 64, D: 45 };
  const num = (v) => { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, "")); return isNaN(n) ? 0 : n; };
  const gradeOf = (s) => (s >= 85 ? "A" : s >= 70 ? "B" : s >= 60 ? "C" : "D");

  // Excel serial date → "23 Jan 26" (returns "" for blank / non-numeric)
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  function serialToDate(s) {
    const n = typeof s === "number" ? s : parseFloat(String(s).replace(/[^0-9.\-]/g, ""));
    if (!n || isNaN(n) || n < 1000) return "";
    const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000);
    return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + String(d.getUTCFullYear()).slice(2);
  }

  /* ---- Latest Updated / Follow-Up actions per (School + Project No) ----
     Tracking sheet data layout (labels in header may be swapped, data is):
       [0] School Name  [1] Project No  [3] Status
       [6] Updated Date (serial)   [7] Updated Action
       [12] Follow-Up Date (serial)[13] Follow-Up Action
     For each School+Project key, keep the row with the greatest Updated Date
     for the updated pair, and greatest Follow-Up Date for the follow-up pair. */
  function readLatestActions(wb) {
    const up = {};   // key -> { serial, action }
    const fol = {};  // key -> { serial, action }
    wb.SheetNames.forEach((sheet) => {
      if (!/_Tracking$/i.test(sheet)) return;
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: "" });
      // locate header row + columns (robust to small layout shifts)
      let hr = -1, c = { name: 0, proj: 1, ud: 6, ua: 7, fd: 12, fa: 13 };
      for (let i = 0; i < Math.min(rows.length, 8); i++) {
        const row = (rows[i] || []).map((x) => String(x).trim().toLowerCase());
        const nc = row.findIndex((x) => /school name/.test(x));
        if (nc === -1) continue;
        hr = i;
        const find = (re, def) => { const j = row.findIndex((x) => re.test(x)); return j === -1 ? def : j; };
        c.name = nc;
        c.proj = find(/project no/, 1);
        c.ud = find(/updated date/, 6);
        c.ua = find(/updated action/, 7);
        c.fd = find(/follow.?up date/, 12);
        c.fa = find(/follow.?up action/, 13);
        break;
      }
      const startRow = hr === -1 ? 4 : hr + 1;
      const num = (v) => { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, "")); return isNaN(n) ? 0 : n; };
      const isDate = (v) => num(v) >= 1000;
      const isWord = (v) => /[a-zA-Zก-๙]/.test(String(v));
      for (let i = startRow; i < rows.length; i++) {
        const r = rows[i];
        const nm = String(r[c.name] || "").trim(); if (!nm) continue;
        let projNo = String(r[c.proj] || "").trim() || "Project#1";
        const key = nm.toLowerCase() + "||" + projNo.toLowerCase();

        // updated: pick the date cell among the two candidate columns
        let udSerial = isDate(r[c.ud]) ? num(r[c.ud]) : (isDate(r[c.ua]) ? num(r[c.ua]) : 0);
        let uaWord = isWord(r[c.ua]) && !isDate(r[c.ua]) ? String(r[c.ua]).trim()
                    : (isWord(r[c.ud]) && !isDate(r[c.ud]) ? String(r[c.ud]).trim() : "");
        if (udSerial || uaWord) {
          if (!up[key] || udSerial > up[key].serial) up[key] = { serial: udSerial, action: uaWord };
        }
        // follow-up
        let fdSerial = isDate(r[c.fd]) ? num(r[c.fd]) : (isDate(r[c.fa]) ? num(r[c.fa]) : 0);
        let faWord = isWord(r[c.fa]) && !isDate(r[c.fa]) ? String(r[c.fa]).trim()
                    : (isWord(r[c.fd]) && !isDate(r[c.fd]) ? String(r[c.fd]).trim() : "");
        if (fdSerial || faWord) {
          if (!fol[key] || fdSerial > fol[key].serial) fol[key] = { serial: fdSerial, action: faWord };
        }
      }
    });
    return { up, fol };
  }

  // Status (this file's deal vocabulary) → activity-funnel stage index
  const STATUS_TO_STAGE = {
    "lead": 0, "consider": 2, "consider#1": 3, "consider#2": 4,
    "consider#3": 5, "quotation": 5, "po": 6, "win": 7, "won": 7, "install": 7, "lost": 2,
  };
  function stageFromStatus(status, fallbackIdx) {
    const k = String(status || "").trim().toLowerCase();
    if (STATUS_TO_STAGE[k] !== undefined) return STATUS_TO_STAGE[k];
    return fallbackIdx || 0;
  }
  function normStatus(s) {
    const k = String(s || "").trim();
    if (/^win/i.test(k)) return "Won";
    return k;
  }

  function findMasterSheet(wb) {
    const exact = wb.SheetNames.find((n) => /master/i.test(n));
    if (exact) return exact;
    let best = wb.SheetNames[0], bestW = 0;
    wb.SheetNames.forEach((n) => {
      const ws = wb.Sheets[n]; const ref = ws["!ref"]; if (!ref) return;
      const w = XLSX.utils.decode_range(ref).e.c;
      if (w > bestW) { bestW = w; best = n; }
    });
    return best;
  }

  /* ---- Plan / Actual totals from the dedicated salesperson sheets ----
     Plan   : P-Total [42..49], Monthly JAN=[50] stride 8
     Actual : A-Total [83..90], Monthly JAN=[91] stride 8
     Plan uses Score[4] for grade, Actual uses Re-Score[4] for grade.
     Returns { stages, persons[], granular[] } where granular is per-person-per-school-per-month. */
  function readPlanActual(wb) {
    const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    const granular = [];  // { person, school, grade, month, plan[8], actual[8] }
    const persons = new Set();

    wb.SheetNames.forEach((sheet) => {
      const mPlan = sheet.match(/^(.+)_Plan$/i);
      const mAct = sheet.match(/^(.+)_Actual$/i);
      if (!mPlan && !mAct) return;
      const isPlan = !!mPlan;
      const who = (mPlan ? mPlan[1] : mAct[1]).trim();
      persons.add(who);
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: "" });
      const totalBase = isPlan ? 42 : 83;     // P-Total Call / A-Total Call
      const monthStart = isPlan ? 50 : 91;    // JAN Call

      for (let i = 4; i < rows.length; i++) {
        const r = rows[i];
        const school = String(r[1] || "").trim(); if (!school) continue;
        const gradeRaw = String(r[4] || "").trim().toUpperCase();
        const grade = /^[ABCD]$/.test(gradeRaw) ? gradeRaw : "D";

        // Total (annual) row
        const totalArr = new Array(8).fill(0);
        for (let s = 0; s < 8; s++) totalArr[s] = num(r[totalBase + s]);

        // Per-month rows
        for (let m = 0; m < 12; m++) {
          const base = monthStart + m * 8;
          const monthArr = new Array(8).fill(0);
          let hasData = false;
          for (let s = 0; s < 8; s++) {
            monthArr[s] = num(r[base + s]);
            if (monthArr[s]) hasData = true;
          }
          // Store even if empty (so filters on empty months return zero, not missing)
          const existing = granular.find((g) =>
            g.person === who && g.school.toLowerCase() === school.toLowerCase() && g.month === MONTHS[m]);
          if (existing) {
            // merge plan/actual into existing record
            if (isPlan) existing.plan = monthArr;
            else existing.actual = monthArr;
          } else {
            granular.push({
              person: who, school, grade, month: MONTHS[m],
              plan: isPlan ? monthArr : new Array(8).fill(0),
              actual: isPlan ? new Array(8).fill(0) : monthArr,
            });
          }
        }
      }
    });

    return {
      stages: STAGES,
      persons: [...persons],
      granular,
    };
  }

  /* ---- Active Schools from the Tracking sheets ----
     Somjit_Tracking / Wassana_Tracking :
       [0] School Name   [1] Project No   [3] Status
     • Active School  = school with ≥1 activity row whose Status is Lead/Consider
     • Active Project = distinct (School Name + Project No) pair with Lead/Consider
                        (duplicates such as same school + Project#1 are counted once)
     Returns { schools:Set<nameLower>, projectsBySchool:Map<nameLower,Set<projNo>> } */
  function readActivity(wb) {
    const schoolsSet = new Set();
    const projectsBySchool = new Map();
    wb.SheetNames.forEach((sheet) => {
      if (!/_Tracking$/i.test(sheet)) return;
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: "" });
      let hr = -1, nameCol = 0, projCol = 1, statusCol = 3;
      for (let i = 0; i < Math.min(rows.length, 8); i++) {
        const row = rows[i] || [];
        const nc = row.findIndex((c) => /school name/i.test(String(c)));
        const pc = row.findIndex((c) => /project no/i.test(String(c)));
        const sc = row.findIndex((c) => /^status/i.test(String(c).trim()));
        if (nc !== -1 && sc !== -1) { hr = i; nameCol = nc; projCol = pc !== -1 ? pc : 1; statusCol = sc; break; }
      }
      const startRow = hr === -1 ? 4 : hr + 1;
      for (let i = startRow; i < rows.length; i++) {
        const r = rows[i];
        const nm = String(r[nameCol] || "").trim();
        const st = String(r[statusCol] || "").trim();
        if (!nm || !/^(lead|consider)/i.test(st)) continue;
        const key = nm.toLowerCase();
        schoolsSet.add(key);
        let projNo = String(r[projCol] || "").trim().toLowerCase();
        if (!projNo) projNo = "project#1";
        if (!projectsBySchool.has(key)) projectsBySchool.set(key, new Set());
        projectsBySchool.get(key).add(projNo);   // Set dedupes same school+project
      }
    });
    return { schools: schoolsSet, projectsBySchool };
  }

  function parseWorkbook(wb) {
    const ws = wb.Sheets[findMasterSheet(wb)];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    // detect first data row (tier looks like HH/HL/LH/LL, or numeric No + name)
    let start = 4;
    for (let i = 0; i < Math.min(rows.length, 12); i++) {
      const r = rows[i];
      if (/^(HH|HL|LH|LL)$/.test(String(r[4] || "").trim()) ||
          (/^\d+$/.test(String(r[0]).trim()) && r[1])) { start = i; break; }
    }

    const schools = [];
    let lastName = "", lastProv = "";

    // Active Schools & Projects come from the Tracking sheets (Status = Lead / Consider)
    const activity = readActivity(wb);
    // Latest Updated / Follow-Up action per School + Project No
    const latest = readLatestActions(wb);
    const activeSet = activity.schools;
    const hasTracking = activeSet.size > 0 ||
      wb.SheetNames.some((n) => /_Tracking$/i.test(n));

    // Detect Project# block start columns from the group-header rows.
    // Within a block (stride 16): +1 Updated Action, +7 %โอกาส, +8 Status, +15 Value Toal
    const projBases = [];
    for (let hr = 0; hr < Math.min(rows.length, 4); hr++) {
      (rows[hr] || []).forEach((c, j) => {
        if (/^project#\d+/i.test(String(c).trim()) && !projBases.includes(j)) projBases.push(j);
      });
    }
    if (!projBases.length) projBases.push(26, 42, 58);
    projBases.sort((a, b) => a - b);

    for (let i = start; i < rows.length; i++) {
      const r = rows[i];
      const tier = String(r[4] || "").trim().toUpperCase();
      const salesperson = String(r[6] || "").trim();
      if (!/^(HH|HL|LH|LL)$/.test(tier) && !salesperson && !r[1]) continue;

      // fill-down name & province (merged cells leave blanks)
      let name = String(r[1] || "").trim();
      if (name) lastName = name; else name = lastName;
      if (!name) continue;
      let province = String(r[2] || "").trim();
      if (province) lastProv = province; else province = lastProv || "Bangkok";

      const sales = salesperson || "Unknown";
      const curriculum = String(r[7] || "").trim() || "Other";
      const tierClean = /^(HH|HL|LH|LL)$/.test(tier) ? tier : "LL";

      // scores — Point-Score[9] / Point-Re-Score[18]; grade fallback
      let initialScore = num(r[9]);
      if (initialScore <= 0 || initialScore > 100) initialScore = gradeToScore[String(r[8]).trim().toUpperCase()] || 0;
      let reScore = num(r[18]);
      if (reScore <= 0 || reScore > 100) reScore = gradeToScore[String(r[17]).trim().toUpperCase()] || initialScore;
      initialScore = Math.round(initialScore); reScore = Math.round(reScore);
      // prefer the workbook's own Re-Score grade letter when present
      const reGradeLetter = String(r[17] || "").trim().toUpperCase();
      const grade = /^[ABCD]$/.test(reGradeLetter) ? reGradeLetter : gradeOf(reScore);

      // ---- per-project array (blocks detected via projBases, stride 16) ----
      const projects = [];
      let headlineStatus = "";
      for (let pi = 0; pi < projBases.length; pi++) {
        const base = projBases[pi];
        const p = pi;
        const pVal = num(r[base + 15]);              // Value Toal
        let pChance = num(r[base + 7]);              // %โอกาส
        if (pChance > 0 && pChance <= 1) pChance *= 100;
        pChance = Math.round(pChance);
        const pStatus = String(r[base + 8] || "").trim();   // Status
        if (pVal <= 0 && pChance <= 0 && !pStatus) continue;
        if (p === 0) headlineStatus = pStatus;
        const pIdx = stageFromStatus(pStatus, 0);
        const trackKey = name.toLowerCase() + "||project#" + (projects.length + 1);
        const upRec = latest.up[trackKey], folRec = latest.fol[trackKey];
        projects.push({
          projectNo: projects.length + 1,
          product: String(r[base + 9] || "").trim(),          // Main-Product
          funnel: STAGES[pIdx], funnelIdx: pIdx,
          projectValue: Math.round(pVal),
          chance: pChance || 50,
          weightedValue: Math.round(pVal * (pChance || 50) / 100),
          status: normStatus(pStatus),
          updatedAction: upRec ? upRec.action : "",
          updatedDate: upRec ? serialToDate(upRec.serial) : "",
          updatedSerial: upRec ? upRec.serial : 0,
          followUpAction: folRec ? folRec.action : "",
          followUpDate: folRec ? serialToDate(folRec.serial) : "",
          followUpSerial: folRec ? folRec.serial : 0,
        });
      }

      const projectValue = num(r[41]) + num(r[57]) + num(r[73]);
      let chance = Math.max(num(r[33]), num(r[49]), num(r[65]));
      if (chance > 0 && chance <= 1) chance *= 100;
      chance = Math.round(chance) || 50;

      // ---- Win / Conversion aggregates across all project blocks ----
      // Win Rate    = Σ Win / Σ (Win + Lost)            [Status]
      // Win Projects= Σ Win                              [Status]
      // Win Value   = Σ Value Toal where Status = Win    [Value Toal]
      // Conversion  = Σ Quotation / Σ (PO + Install)     [Updated Action]
      let winProjects = 0, lostProjects = 0, winValue = 0, lostValue = 0, considerProjectsN = 0, considerValueN = 0, quotationActions = 0, poInstallActions = 0;
      projBases.forEach((base) => {
        const st = String(r[base + 8] || "").trim();
        const act = String(r[base + 1] || "").trim();
        const val = num(r[base + 15]);
        if (/^win/i.test(st)) { winProjects++; winValue += val; }
        if (/^lost/i.test(st)) { lostProjects++; lostValue += val; }
        if (/^(lead|consider)/i.test(st)) { considerProjectsN++; considerValueN += val; }
        if (/^quotation/i.test(act)) quotationActions++;
        if (/^(po|install)/i.test(act)) poInstallActions++;
      });

      const status = normStatus(headlineStatus || r[34] || r[50] || r[66] || "");
      const funnelIdx = stageFromStatus(status, projects[0] ? projects[0].funnelIdx : 0);
      const funnel = STAGES[funnelIdx];

      if (!projects.length) {
        const tk = latest.up[name.toLowerCase() + "||project#1"];
        const fk = latest.fol[name.toLowerCase() + "||project#1"];
        projects.push({
          projectNo: 1, product: String(r[35] || "").trim(),
          funnel, funnelIdx, projectValue: Math.round(projectValue),
          chance, weightedValue: Math.round(projectValue * chance / 100), status,
          updatedAction: tk ? tk.action : "", updatedDate: tk ? serialToDate(tk.serial) : "", updatedSerial: tk ? tk.serial : 0,
          followUpAction: fk ? fk.action : "", followUpDate: fk ? serialToDate(fk.serial) : "", followUpSerial: fk ? fk.serial : 0,
        });
      }

      const head = projects[0] || {};
      schools.push({
        no: schools.length + 1, name, province, funnel, funnelIdx,
        tier: tierClean, salesperson: sales, curriculum,
        initialScore, reScore, grade, initialGrade: gradeOf(initialScore),
        projectValue: Math.round(projectValue),
        chance,
        weightedValue: Math.round(projectValue * chance / 100),
        numProjects: projects.length, projects,
        status,
        // headline tracking (Project#1) for the All-Projects pipeline view
        updatedAction: head.updatedAction || "", updatedDate: head.updatedDate || "",
        followUpAction: head.followUpAction || "", followUpDate: head.followUpDate || "",
        // Active School = appears in Tracking with Status Lead/Consider.
        // Active Projects = distinct project numbers under that school (Lead/Consider).
        // Fall back to deal status when no Tracking sheet is present.
        active: hasTracking
          ? activeSet.has(name.toLowerCase())
          : /^(lead|consider)/i.test(status),
        activeProjects: hasTracking
          ? (activity.projectsBySchool.get(name.toLowerCase()) || new Set()).size
          : (/^(lead|consider)/i.test(status) ? projects.length : 0),
        // Win & Conversion (from Master_Database project blocks)
        winProjects, lostProjects, winValue, lostValue,
        isWinSchool: winProjects > 0,
        isLostSchool: lostProjects > 0,
        isConsiderSchool: considerProjectsN > 0,
        considerProjects: considerProjectsN,
        considerValue: considerValueN,
        quotationActions, poInstallActions,
        mainProduct: String(r[35] || "").trim(),
        // 7 dimensions — End of Year 2026 [19..25], fall back to Initial [10..16]
        tuition: String(r[19] || r[10] || "").trim(),
        classLevel: String(r[20] || r[11] || "").trim(),
        students: String(r[21] || r[12] || "").trim(),
        facilityStatus: String(r[22] || r[13] || "").trim(),
        readyLand: String(r[23] || r[14] || "").trim(),
        reputation: String(r[24] || r[15] || "").trim(),
        relationship: String(r[25] || r[16] || "").trim(),
        customerType: String(r[3] || "").trim(),   // Old-Yearly / New-Monthly …
        updatedThisMonth: false,
      });
    }

    // ---- Plan vs Actual from dedicated sheets ----
    const pa = readPlanActual(wb);
    let planActual = null;
    if (pa.granular.length) {
      planActual = pa;
    }

    return { schools, planActual };
  }

  window.parseWorkbook = parseWorkbook;
})();
