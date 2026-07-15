/* ============================================================
   Seed dataset — ~102 international schools (Thailand)
   Deterministic generation so figures stay stable across loads.
   Mirrors the Master_Database schema from the source workbook.
   ============================================================ */
(function () {
  // --- deterministic PRNG (mulberry32) ---
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry32(20260608);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const between = (lo, hi) => lo + rnd() * (hi - lo);
  const intBetween = (lo, hi) => Math.floor(between(lo, hi + 1));

  // --- vocab ---
  const FUNNEL = ["Call", "Visit", "Demo", "Survey", "Present", "Quotation", "PO", "Install"];
  const CURRICULA = ["British", "American", "IB", "Cambridge", "Hybrid", "Singapore", "Indian/IB"];
  const SALES = ["Somjit", "Wassana"];
  const STATUS = ["Lead", "Qualified", "Negotiation", "Proposal", "Won", "Lost", "On-Hold"];
  const PRODUCTS = [
    "Running Track & Sport Surface", "Artificial Turf & Playground",
    "Sport Equipment & Flooring", "Gymnasium Flooring", "Tennis & Multi-court",
    "Swimming Facility", "Playground & Play-Equipment", "Fitness & Wellness Center",
    "Athletics Field Renovation", "Indoor Sports Hall",
  ];
  const TUITION = ["High (>500K/yr)", "Mid (200-500K/yr)", "Low (<200K/yr)"];
  const CLASSLVL = ["Early-Nursery & Primary & Secondary", "Primary & Secondary", "Early-Nursery", "Primary", "Secondary"];
  const STUDENTS = ["≥801", "400-800", "399≤"];
  const FACILITY = ["Old & Deteriorated", "Insufficient", "New & Modern", "Good Condition"];
  const READYLAND = ["New Area & Ready to Develop", "Old Area & Ready to Develop", "Old Area & Waiting a Budget", "No Land Available"];
  const REPUTATION = ["Advertise & Low Competition", "No Advertise & Low Competition", "Advertise & High Competition", "No Advertise & High Competition"];
  const RELATIONSHIP = ["Reach to Owner", "Reach to Principal", "Reach to Procurement", "No Contact"];

  // Province weighting (approx real distribution of intl schools)
  const PROVINCES = [
    ["Bangkok", 46], ["Chonburi", 13], ["Chiang Mai", 11], ["Phuket", 9],
    ["Nonthaburi", 7], ["Rayong", 5], ["Samut Prakan", 4], ["Pathum Thani", 3], ["Others", 4],
  ];
  function weightedProvince() {
    const total = PROVINCES.reduce((s, p) => s + p[1], 0);
    let r = rnd() * total;
    for (const [name, w] of PROVINCES) { if ((r -= w) <= 0) return name; }
    return "Bangkok";
  }

  // Real international-school name pool (public institutions, used as data rows)
  const NAMES = [
    "Bangkok Patana School", "International School Bangkok (ISB)", "Shrewsbury International School",
    "NIST International School", "Harrow International School Bangkok", "Bangkok Prep International",
    "KIS International School", "St. Andrews International School", "Regents International School Pattaya",
    "British International School Phuket", "Brighton College Bangkok", "Concordian International School",
    "Wells International School", "Ruamrudee International School", "Garden International School",
    "Berkeley International School", "Traill International School", "Ekamai International School",
    "The American School of Bangkok", "Anglo Singapore International School", "Australian International School",
    "Bromsgrove International School", "Charter International School", "Denla British School",
    "International Community School", "Modern International School Bangkok", "Pan-Asia International School",
    "Rasami British International School", "Singapore International School Bangkok", "St. Stephen's International School",
    "Trinity International School", "VERSO International School", "Wellington College Bangkok",
    "Heathfield International School", "ICS International School", "King's College International School",
    "Newton Sixth Form School", "Prem Tinsulanonda International", "Lanna International School",
    "Chiang Mai International School", "Grace International School", "Nakornpayap International School",
    "American Pacific International", "UWC Thailand", "HeadStart International School",
    "QSI International School Phuket", "Oakmeadow International School", "Rugby School Thailand",
    "Satit International School", "Niva International School", "Ascot International School",
    "Bangkok Christian International", "St. John's International School", "Thai-Chinese International",
    "Mooltripakdee International", "RBAC International School", "Crescent International School",
    "GIS Garden International Rayong", "Phuket International Academy", "Kajonkietsuksa International",
    "Sunshine International School", " Amnuaysilpa International", "EIS International Pattaya",
    "Tara Pattana International", "The Regent's School Pattaya", "Mooi International Kindergarten",
    "Saint Mark's International School", "Wattana Wittaya International", "Harbour International School",
    "Berkeley Pattaya International", "Bangkok Grace International", "St. Mark's Phuket",
    "Greenfield International School", "Ashton International Academy", "Verita International School",
    "BCIS International School", "Lighthouse International", "Magic Years International",
    "Storybook International", "Little Pearl International", "Tridhos International",
    "Acacia International School", "First Steps International", "Panyaden International School",
    "Unison International School", "Wisdom Tree International", "American School Sriracha",
    "Regents Rayong International", "Lakeside International School", "Bluebells International",
    "St. Gabriel's International", "Maliwan International School", "Patana East International",
    "Riverside International School", "Highgate International School", "Cornerstone International",
    "Montessori Academy Bangkok", "Sukhumvit International School", "Thonburi International",
    "Ivy Bound International", "Crestwood International School", "Bangkok International Prep",
    "Northbridge International", "Silverdale International", "Evergreen International School",
  ];

  // pick tier by score & potential; tier grid: HH/HL/LH/LL
  function gradeOf(score) {
    if (score >= 85) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    return "D";
  }

  const schools = [];
  const n = Math.min(101, NAMES.length);
  let somjitN = 0, wassanaN = 0;        // enforce exact 52 / 49 split like the real file
  for (let i = 0; i < n; i++) {
    const province = weightedProvince();
    // deterministic, distributed split: 52 Somjit / 49 Wassana
    let salesperson;
    if (somjitN < 52 && (wassanaN >= 49 || rnd() < 0.515)) { salesperson = "Somjit"; somjitN++; }
    else { salesperson = "Wassana"; wassanaN++; }
    const curriculum = pick(CURRICULA);

    // tier first → drives score & value bands
    const tier = pick(["HH", "HH", "HL", "HL", "LH", "LH", "LH", "LL", "LL", "LL", "LL"]);
    // initial score
    let base;
    if (tier === "HH") base = between(84, 100);
    else if (tier === "HL") base = between(74, 96);
    else if (tier === "LH") base = between(66, 92);
    else base = between(40, 82);
    const initialScore = Math.round(base);
    // re-score drifts up mostly (improvement), sometimes flat/down
    const drift = pick([8, 7, 5, 4, 3, 0, 0, -3, -4, -6, 10, 6]);
    let reScore = Math.max(15, Math.min(100, initialScore + drift));
    reScore = Math.round(reScore);

    // furthest funnel stage reached (8 stages now incl. Quotation)
    const fIdx = (function () {
      const r = rnd();
      if (r < 0.14) return 0; if (r < 0.27) return 1; if (r < 0.40) return 2;
      if (r < 0.53) return 3; if (r < 0.66) return 4; if (r < 0.77) return 5;
      if (r < 0.88) return 6; return 7;
    })();
    const funnel = FUNNEL[fIdx];

    // project value (THB) — a few big deals dominate, long tail of small ones
    const tuition = tier[0] === "H" ? pick(["High (>500K/yr)", "High (>500K/yr)", "Mid (200-500K/yr)"]) : pick(TUITION);
    const sizeRoll = rnd();
    let pv;
    if (sizeRoll < 0.07) pv = between(5e6, 25e6);        // big deal
    else if (sizeRoll < 0.35) pv = between(1e6, 4.5e6);   // mid deal
    else pv = between(1.5e5, 1.2e6);                       // small deal
    if (tier === "HH" && pv < 4e6) pv += between(2e6, 9e6); // HH skews larger
    const projectValue = Math.round(pv / 1e5) * 1e5;

    // chance (%) tied to funnel progress
    const chanceByStage = [20, 30, 40, 50, 60, 70, 80, 95];
    let chance = chanceByStage[fIdx] + intBetween(-10, 10);
    chance = Math.max(10, Math.min(95, Math.round(chance / 5) * 5));
    const weightedValue = Math.round(projectValue * chance / 100);

    // status from funnel — matches the workbook's deal vocabulary
    // (Lead / Consider / Consider#1-3 / Win / Lost)
    let status;
    if (funnel === "Install") status = "Win";
    else if (funnel === "PO") status = "Win";
    else if (funnel === "Quotation") status = "Consider#3";
    else if (funnel === "Present") status = "Consider#2";
    else if (funnel === "Survey") status = "Consider#1";
    else if (funnel === "Demo") status = "Consider";
    else if (rnd() < 0.07) status = "Lost";
    else if (funnel === "Visit") status = pick(["Consider", "Lead"]);
    else status = "Lead";

    // dates — spread across both years (2026 weighted) and all months
    const yr = rnd() < 0.7 ? 2026 : 2027;
    const mo = intBetween(1, 12);
    const upDay = intBetween(1, 28);
    const folMo = mo === 12 ? 1 : mo + 1;
    const folYr = mo === 12 ? yr + 1 : yr;
    const folDay = intBetween(1, 28);
    const updatedDate = `${yr}-${String(mo).padStart(2, "0")}-${String(upDay).padStart(2, "0")}`;
    const followUpDate = `${folYr}-${String(folMo).padStart(2, "0")}-${String(folDay).padStart(2, "0")}`;

    // Active School = Status is Lead or Consider (incl. Consider#1-3)
    const active = /^(lead|consider)/i.test(status);

    // ---- per-school projects (1-4) ----
    // Project#1 mirrors the school's headline deal; #2-#4 are smaller add-ons.
    const numProjects = (function () {
      const r = rnd();
      if (tier === "HH") { if (r < 0.18) return 4; if (r < 0.5) return 3; if (r < 0.85) return 2; return 1; }
      if (tier === "HL") { if (r < 0.08) return 4; if (r < 0.32) return 3; if (r < 0.72) return 2; return 1; }
      if (tier === "LH") { if (r < 0.2) return 3; if (r < 0.58) return 2; return 1; }
      if (r < 0.1) return 3; if (r < 0.4) return 2; return 1;
    })();
    const PRODUCTS_LIST = PRODUCTS;
    // map a funnel stage index → deal status (same vocabulary as the tracking sheets)
    const statusForIdx = (idx) => {
      if (idx >= 7) return "Win";
      if (idx === 6) return "Win";
      if (idx === 5) return "Consider#3";
      if (idx === 4) return "Consider#2";
      if (idx === 3) return "Consider#1";
      if (idx === 2) return "Consider";
      if (idx === 1) return "Consider";
      return "Lead";
    };
    const projects = [];
    for (let p = 0; p < numProjects; p++) {
      let pVal, pIdx, pChance;
      if (p === 0) { pVal = projectValue; pIdx = fIdx; pChance = chance; }
      else {
        pVal = Math.round((projectValue * between(0.18, 0.6)) / 1e5) * 1e5 || 100000;
        pIdx = Math.max(0, Math.min(7, fIdx - intBetween(0, 3)));
        pChance = Math.max(10, Math.min(95, Math.round(([20,30,40,50,60,70,80,95][pIdx] + intBetween(-10,10)) / 5) * 5));
      }
      // headline project inherits the school status; add-ons get their own
      const pStatus = p === 0 ? status : (rnd() < 0.08 ? "Lost" : statusForIdx(pIdx));
      // tracking: latest Updated Action ≈ current stage; Follow-Up ≈ next stage
      const upAction = FUNNEL[pIdx];
      const folAction = FUNNEL[Math.min(7, pIdx + 1)];
      const upDay = intBetween(1, 28), upMon = intBetween(1, 5);
      const folDay = intBetween(1, 28), folMon = intBetween(6, 8);
      const MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      projects.push({
        projectNo: p + 1,
        product: p === 0 ? pick(PRODUCTS_LIST) : pick(PRODUCTS_LIST),
        funnel: FUNNEL[pIdx], funnelIdx: pIdx,
        projectValue: pVal, chance: pChance,
        weightedValue: Math.round(pVal * pChance / 100),
        status: pStatus,
        updatedAction: upAction, updatedDate: upDay + " " + MN[upMon - 1] + " 26",
        followUpAction: folAction, followUpDate: folDay + " " + MN[folMon - 1] + " 26",
      });
    }
    // Active Projects = projects whose Status is Lead or Consider (no duplicates by design)
    const activeProjects = projects.filter((pr) => /^(lead|consider)/i.test(pr.status)).length;
    // Win & Conversion analogues for the demo
    const winProjectsN = projects.filter((pr) => /^win/i.test(pr.status)).length;
    const lostProjectsN = projects.filter((pr) => /^lost/i.test(pr.status)).length;
    const winValueN = projects.filter((pr) => /^win/i.test(pr.status)).reduce((a, pr) => a + pr.projectValue, 0);
    const lostValueN = projects.filter((pr) => /^lost/i.test(pr.status)).reduce((a, pr) => a + pr.projectValue, 0);
    const considerProjectsN = projects.filter((pr) => /^(lead|consider)/i.test(pr.status)).length;
    const considerValueN = projects.filter((pr) => /^(lead|consider)/i.test(pr.status)).reduce((a, pr) => a + pr.projectValue, 0);
    const quotationActionsN = projects.filter((pr) => pr.funnel === "Quotation").length;
    const poInstallActionsN = projects.filter((pr) => pr.funnel === "PO" || pr.funnel === "Install").length;

    schools.push({
      no: i + 1,
      name: NAMES[i],
      province,
      funnel,
      funnelIdx: fIdx,
      tier,
      salesperson,
      curriculum,
      initialScore,
      reScore,
      grade: gradeOf(reScore),
      initialGrade: gradeOf(initialScore),
      projectValue,
      chance,
      weightedValue,
      numProjects,
      projects,
      activeProjects,
      updatedAction: projects[0].updatedAction, updatedDate: projects[0].updatedDate,
      followUpAction: projects[0].followUpAction, followUpDate: projects[0].followUpDate,
      winProjects: winProjectsN,
      lostProjects: lostProjectsN,
      winValue: winValueN,
      lostValue: lostValueN,
      isWinSchool: winProjectsN > 0,
      isLostSchool: lostProjectsN > 0,
      isConsiderSchool: considerProjectsN > 0,
      considerProjects: considerProjectsN,
      considerValue: considerValueN,
      quotationActions: quotationActionsN,
      poInstallActions: poInstallActionsN,
      status,
      active: activeProjects > 0,
      mainProduct: pick(PRODUCTS),
      tuition,
      classLevel: pick(CLASSLVL),
      students: pick(STUDENTS),
      facilityStatus: pick(tier[0]==="H" ? ["New & Modern","Good Condition","Old & Deteriorated"] : FACILITY),
      readyLand: pick(READYLAND),
      reputation: pick(REPUTATION),
      relationship: tier==="HH"||tier==="HL" ? pick(["Reach to Owner","Reach to Principal"]) : pick(RELATIONSHIP),
      updatedThisMonth: rnd() < 0.15,
    });
  }

  // ---- Plan vs Actual (by salesperson, per funnel stage) ----
  // Global plan/actual roughly matching reference (Plan 450 / Actual 327)
  const planActual = {
    stages: FUNNEL,
    Somjit: { plan: [62, 52, 42, 32, 22, 20, 17, 11], actual: [60, 45, 28, 22, 12, 8, 6, 3] },
    Wassana: { plan: [58, 48, 38, 28, 20, 18, 15, 9], actual: [54, 40, 24, 20, 10, 7, 6, 2] },
  };

  window.SEED_SCHOOLS = schools;
  window.SEED_PLAN_ACTUAL = planActual;
  window.FUNNEL_STAGES = FUNNEL;
})();
