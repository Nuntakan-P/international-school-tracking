// parser.ts — maps an uploaded .xlsx workbook into the app schema.
// Ported 1:1 from data/parser.js (Master_Database + Tracking + Plan/Actual sheets).
import * as XLSX from "xlsx";
import { FUNNEL_STAGES } from "./seedData";
import type { Grade, PlanActualData, PlanActualGranular, Project, School, Tier } from "./types";

const gradeToScore: Record<string, number> = { A: 92, B: 77, C: 64, D: 45 };
const num = (v: unknown): number => {
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
};
const gradeOf = (s: number): Grade => (s >= 85 ? "A" : s >= 70 ? "B" : s >= 60 ? "C" : "D");

type SheetRow = (string | number)[];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function serialToDate(s: unknown): string {
  const n = typeof s === "number" ? s : parseFloat(String(s).replace(/[^0-9.\-]/g, ""));
  if (!n || isNaN(n) || n < 1000) return "";
  const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000);
  return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + String(d.getUTCFullYear()).slice(2);
}

interface ActionRecord { serial: number; action: string }

/* ---- Latest Updated / Follow-Up actions per (School + Project No) ---- */
function readLatestActions(wb: XLSX.WorkBook) {
  const up: Record<string, ActionRecord> = {};
  const fol: Record<string, ActionRecord> = {};
  wb.SheetNames.forEach((sheet) => {
    if (!/_Tracking$/i.test(sheet)) return;
    const rows = XLSX.utils.sheet_to_json<SheetRow>(wb.Sheets[sheet], { header: 1, defval: "" });
    let hr = -1;
    const c = { name: 0, proj: 1, ud: 6, ua: 7, fd: 12, fa: 13 };
    for (let i = 0; i < Math.min(rows.length, 8); i++) {
      const row = (rows[i] || []).map((x) => String(x).trim().toLowerCase());
      const nc = row.findIndex((x) => /school name/.test(x));
      if (nc === -1) continue;
      hr = i;
      const find = (re: RegExp, def: number) => {
        const j = row.findIndex((x) => re.test(x));
        return j === -1 ? def : j;
      };
      c.name = nc;
      c.proj = find(/project no/, 1);
      c.ud = find(/updated date/, 6);
      c.ua = find(/updated action/, 7);
      c.fd = find(/follow.?up date/, 12);
      c.fa = find(/follow.?up action/, 13);
      break;
    }
    const startRow = hr === -1 ? 4 : hr + 1;
    const isDate = (v: unknown) => num(v) >= 1000;
    const isWord = (v: unknown) => /[a-zA-Zก-๙]/.test(String(v));
    for (let i = startRow; i < rows.length; i++) {
      const r = rows[i];
      const nm = String(r[c.name] || "").trim();
      if (!nm) continue;
      const projNo = String(r[c.proj] || "").trim() || "Project#1";
      const key = nm.toLowerCase() + "||" + projNo.toLowerCase();

      const udSerial = isDate(r[c.ud]) ? num(r[c.ud]) : (isDate(r[c.ua]) ? num(r[c.ua]) : 0);
      const uaWord = isWord(r[c.ua]) && !isDate(r[c.ua]) ? String(r[c.ua]).trim()
        : (isWord(r[c.ud]) && !isDate(r[c.ud]) ? String(r[c.ud]).trim() : "");
      if (udSerial || uaWord) {
        if (!up[key] || udSerial > up[key].serial) up[key] = { serial: udSerial, action: uaWord };
      }
      const fdSerial = isDate(r[c.fd]) ? num(r[c.fd]) : (isDate(r[c.fa]) ? num(r[c.fa]) : 0);
      const faWord = isWord(r[c.fa]) && !isDate(r[c.fa]) ? String(r[c.fa]).trim()
        : (isWord(r[c.fd]) && !isDate(r[c.fd]) ? String(r[c.fd]).trim() : "");
      if (fdSerial || faWord) {
        if (!fol[key] || fdSerial > fol[key].serial) fol[key] = { serial: fdSerial, action: faWord };
      }
    }
  });
  return { up, fol };
}

const STATUS_TO_STAGE: Record<string, number> = {
  lead: 0, consider: 2, "consider#1": 3, "consider#2": 4,
  "consider#3": 5, quotation: 5, po: 6, win: 7, won: 7, install: 7, lost: 2,
};
function stageFromStatus(status: string, fallbackIdx?: number): number {
  const k = String(status || "").trim().toLowerCase();
  if (STATUS_TO_STAGE[k] !== undefined) return STATUS_TO_STAGE[k];
  return fallbackIdx || 0;
}
function normStatus(s: string): string {
  const k = String(s || "").trim();
  if (/^win/i.test(k)) return "Won";
  return k;
}

function findMasterSheet(wb: XLSX.WorkBook): string {
  const exact = wb.SheetNames.find((n) => /master/i.test(n));
  if (exact) return exact;
  let best = wb.SheetNames[0], bestW = 0;
  wb.SheetNames.forEach((n) => {
    const ws = wb.Sheets[n];
    const ref = ws["!ref"];
    if (!ref) return;
    const w = XLSX.utils.decode_range(ref).e.c;
    if (w > bestW) { bestW = w; best = n; }
  });
  return best;
}

/* ---- Plan / Actual totals from the dedicated salesperson sheets ---- */
function readPlanActual(wb: XLSX.WorkBook): { stages: string[]; persons: string[]; granular: PlanActualGranular[] } {
  const MONTHS12 = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const granular: PlanActualGranular[] = [];
  const persons = new Set<string>();

  wb.SheetNames.forEach((sheet) => {
    const mPlan = sheet.match(/^(.+)_Plan$/i);
    const mAct = sheet.match(/^(.+)_Actual$/i);
    if (!mPlan && !mAct) return;
    const isPlan = !!mPlan;
    const who = (mPlan ? mPlan[1] : mAct![1]).trim();
    persons.add(who);
    const rows = XLSX.utils.sheet_to_json<SheetRow>(wb.Sheets[sheet], { header: 1, defval: "" });
    const monthStart = isPlan ? 50 : 91;

    for (let i = 4; i < rows.length; i++) {
      const r = rows[i];
      const school = String(r[1] || "").trim();
      if (!school) continue;
      const gradeRaw = String(r[4] || "").trim().toUpperCase();
      const grade = /^[ABCD]$/.test(gradeRaw) ? gradeRaw : "D";

      for (let m = 0; m < 12; m++) {
        const base = monthStart + m * 8;
        const monthArr = new Array(8).fill(0);
        for (let s = 0; s < 8; s++) monthArr[s] = num(r[base + s]);

        const existing = granular.find((g) =>
          g.person === who && g.school.toLowerCase() === school.toLowerCase() && g.month === MONTHS12[m]);
        if (existing) {
          if (isPlan) existing.plan = monthArr; else existing.actual = monthArr;
        } else {
          granular.push({
            person: who, school, grade, month: MONTHS12[m],
            plan: isPlan ? monthArr : new Array(8).fill(0),
            actual: isPlan ? new Array(8).fill(0) : monthArr,
          });
        }
      }
    }
  });

  return { stages: FUNNEL_STAGES, persons: [...persons], granular };
}

/* ---- Active Schools from the Tracking sheets ---- */
function readActivity(wb: XLSX.WorkBook) {
  const schoolsSet = new Set<string>();
  const projectsBySchool = new Map<string, Set<string>>();
  wb.SheetNames.forEach((sheet) => {
    if (!/_Tracking$/i.test(sheet)) return;
    const rows = XLSX.utils.sheet_to_json<SheetRow>(wb.Sheets[sheet], { header: 1, defval: "" });
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
      projectsBySchool.get(key)!.add(projNo);
    }
  });
  return { schools: schoolsSet, projectsBySchool };
}

export function parseWorkbook(wb: XLSX.WorkBook): { schools: School[]; planActual: PlanActualData | null } {
  const ws = wb.Sheets[findMasterSheet(wb)];
  const rows = XLSX.utils.sheet_to_json<SheetRow>(ws, { header: 1, defval: "" });

  let start = 4;
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const r = rows[i];
    if (/^(HH|HL|LH|LL)$/.test(String(r[4] || "").trim()) ||
      (/^\d+$/.test(String(r[0]).trim()) && r[1])) { start = i; break; }
  }

  const schools: School[] = [];
  let lastName = "", lastProv = "";

  const activity = readActivity(wb);
  const latest = readLatestActions(wb);
  const activeSet = activity.schools;
  const hasTracking = activeSet.size > 0 || wb.SheetNames.some((n) => /_Tracking$/i.test(n));

  const projBases: number[] = [];
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
    const salespersonName = String(r[6] || "").trim();
    if (!/^(HH|HL|LH|LL)$/.test(tier) && !salespersonName && !r[1]) continue;

    let name = String(r[1] || "").trim();
    if (name) lastName = name; else name = lastName;
    if (!name) continue;
    let province = String(r[2] || "").trim();
    if (province) lastProv = province; else province = lastProv || "Bangkok";

    const sales = salespersonName || "Unknown";
    const curriculum = String(r[7] || "").trim() || "Other";
    const tierClean = (/^(HH|HL|LH|LL)$/.test(tier) ? tier : "LL") as Tier;

    let initialScore = num(r[9]);
    if (initialScore <= 0 || initialScore > 100) initialScore = gradeToScore[String(r[8]).trim().toUpperCase()] || 0;
    let reScore = num(r[18]);
    if (reScore <= 0 || reScore > 100) reScore = gradeToScore[String(r[17]).trim().toUpperCase()] || initialScore;
    initialScore = Math.round(initialScore); reScore = Math.round(reScore);
    const reGradeLetter = String(r[17] || "").trim().toUpperCase();
    const grade = (/^[ABCD]$/.test(reGradeLetter) ? reGradeLetter : gradeOf(reScore)) as Grade;

    const projects: Project[] = [];
    let headlineStatus = "";
    for (let pi = 0; pi < projBases.length; pi++) {
      const base = projBases[pi];
      const pVal = num(r[base + 15]);
      let pChance = num(r[base + 7]);
      if (pChance > 0 && pChance <= 1) pChance *= 100;
      pChance = Math.round(pChance);
      const pStatus = String(r[base + 8] || "").trim();
      if (pVal <= 0 && pChance <= 0 && !pStatus) continue;
      if (pi === 0) headlineStatus = pStatus;
      const pIdx = stageFromStatus(pStatus, 0);
      const trackKey = name.toLowerCase() + "||project#" + (projects.length + 1);
      const upRec = latest.up[trackKey], folRec = latest.fol[trackKey];
      projects.push({
        projectNo: projects.length + 1,
        product: String(r[base + 9] || "").trim(),
        funnel: FUNNEL_STAGES[pIdx], funnelIdx: pIdx,
        projectValue: Math.round(pVal),
        chance: pChance || 50,
        weightedValue: Math.round((pVal * (pChance || 50)) / 100),
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

    let winProjects = 0, lostProjects = 0, winValue = 0, lostValue = 0, considerProjectsN = 0, considerValueN = 0,
      quotationActions = 0, poInstallActions = 0;
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

    const status = normStatus(headlineStatus || String(r[34] || r[50] || r[66] || ""));
    const funnelIdx = stageFromStatus(status, projects[0] ? projects[0].funnelIdx : 0);
    const funnelStage = FUNNEL_STAGES[funnelIdx];

    if (!projects.length) {
      const tk = latest.up[name.toLowerCase() + "||project#1"];
      const fk = latest.fol[name.toLowerCase() + "||project#1"];
      projects.push({
        projectNo: 1, product: String(r[35] || "").trim(),
        funnel: funnelStage, funnelIdx, projectValue: Math.round(projectValue),
        chance, weightedValue: Math.round((projectValue * chance) / 100), status,
        updatedAction: tk ? tk.action : "", updatedDate: tk ? serialToDate(tk.serial) : "", updatedSerial: tk ? tk.serial : 0,
        followUpAction: fk ? fk.action : "", followUpDate: fk ? serialToDate(fk.serial) : "", followUpSerial: fk ? fk.serial : 0,
      });
    }

    const head = projects[0];
    schools.push({
      no: schools.length + 1, name, province, funnel: funnelStage, funnelIdx,
      tier: tierClean, salesperson: sales, curriculum,
      initialScore, reScore, grade, initialGrade: gradeOf(initialScore),
      projectValue: Math.round(projectValue),
      chance,
      weightedValue: Math.round((projectValue * chance) / 100),
      numProjects: projects.length, projects,
      status,
      updatedAction: head.updatedAction || "", updatedDate: head.updatedDate || "",
      followUpAction: head.followUpAction || "", followUpDate: head.followUpDate || "",
      active: hasTracking
        ? activeSet.has(name.toLowerCase())
        : /^(lead|consider)/i.test(status),
      activeProjects: hasTracking
        ? (activity.projectsBySchool.get(name.toLowerCase()) || new Set()).size
        : (/^(lead|consider)/i.test(status) ? projects.length : 0),
      winProjects, lostProjects, winValue, lostValue,
      isWinSchool: winProjects > 0,
      isLostSchool: lostProjects > 0,
      isConsiderSchool: considerProjectsN > 0,
      considerProjects: considerProjectsN,
      considerValue: considerValueN,
      quotationActions, poInstallActions,
      mainProduct: String(r[35] || "").trim(),
      tuition: String(r[19] || r[10] || "").trim(),
      classLevel: String(r[20] || r[11] || "").trim(),
      students: String(r[21] || r[12] || "").trim(),
      facilityStatus: String(r[22] || r[13] || "").trim(),
      readyLand: String(r[23] || r[14] || "").trim(),
      reputation: String(r[24] || r[15] || "").trim(),
      relationship: String(r[25] || r[16] || "").trim(),
      customerType: String(r[3] || "").trim(),
      updatedThisMonth: false,
    });
  }

  const pa = readPlanActual(wb);
  const planActual: PlanActualData | null = pa.granular.length
    ? { stages: pa.stages, persons: pa.persons, granular: pa.granular }
    : null;

  return { schools, planActual };
}
