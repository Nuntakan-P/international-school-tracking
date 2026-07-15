# Handoff: International School Tracking — CRM Dashboard

## Overview
ระบบ Web App สำหรับติดตาม Sales Pipeline ของโรงเรียนนานาชาติในไทย ประกอบด้วย 5 dashboard pages ที่เชื่อมต่อกับข้อมูลจาก Excel workbook (.xlsx) โดยตรง รองรับการ upload ไฟล์ใหม่เพื่อ refresh ข้อมูลทั้งหมดอัตโนมัติ

## About the Design Files
ไฟล์ในโฟลเดอร์นี้เป็น **design references** ที่สร้างใน HTML prototype — ไม่ใช่ production code ที่จะ copy ตรง ๆ งานของ developer คือ **recreate** ระบบนี้ในโปรเจกต์จริง โดยใช้ framework/environment ที่เหมาะสม (React, Vue, Next.js ฯลฯ) และปรับ pattern ตาม codebase ที่มีอยู่

## Fidelity
**High-fidelity** — prototype นี้มีสี typography spacing และ interaction ที่ final แล้ว developer ควร recreate UI ให้ pixel-perfect ตาม prototype ที่แนบมา

---

## Tech Stack (ใน prototype)
- **Chart.js 4.4.1** — bar, line, scatter, doughnut, radar charts
- **SheetJS (xlsx 0.18.5)** — อ่านไฟล์ Excel .xlsx ใน browser
- **IBM Plex Sans Thai + Sora** — Google Fonts
- ไม่มี framework (Vanilla JS) — แต่ recommend ใช้ React + TypeScript ใน production

---

## Design Tokens

### Colors
```css
--bg:       #eef2f8   /* Page background */
--panel:    #ffffff   /* Card background */
--panel-2:  #f7f9fc   /* Alternate row / input background */
--ink:      #16223a   /* Primary text */
--ink-soft: #38445c   /* Secondary text */
--muted:    #74809a   /* Placeholder / labels */
--line:     #e6ecf4   /* Borders */
--blue:     #2f6fe0   /* Primary brand */
--blue-d:   #1b4f9c   /* Dark blue */
--navy:     #13315c   /* Dark navy (KPI numbers) */
--green:    #2e9e5b   /* Success / Grade A */
--amber:    #f0a431   /* Warning */
--red:      #e8554e   /* Danger / Urgent */

/* Grade colors */
Grade A: #2e9e5b (green)
Grade B: #2f6fe0 (blue)
Grade C: #7a6ad0 (purple)
Grade D: #e8554e (red)

/* Alert status colors */
Urgent:      #e8554e (red circle)
Warning:     #f0a431 (yellow circle)
Upcoming:    #2f6fe0 (blue circle)
On Progress: #2e9e5b (green circle)
```

### Typography
```
Display/numbers: "Sora" 500/600/700
Body/UI:         "IBM Plex Sans Thai", "IBM Plex Sans"
Mono:            "IBM Plex Mono"

Base size: 14px
KPI values: 24-28px Sora 700
Card titles: 13.5px weight 700
Table headers: 11.5px weight 700
Notes: 11.5px color --muted
```

### Spacing / Radius
```
Card padding:    18px
Card radius:     16px (--r-lg)
Input radius:    9-12px (--r-md)
Tag radius:      999px (pill)
Grid gap:        16px
Card gap:        13px (KPI row)
Max width:       1520px
```

### Shadows
```
--sh-sm: 0 1px 2px rgba(20,40,80,.05), 0 1px 3px rgba(20,40,80,.04)
--sh-md: 0 2px 6px rgba(20,40,80,.06), 0 8px 24px rgba(20,40,80,.05)
```

---

## Application Architecture

### Data Flow
```
Excel Upload (.xlsx)
    → SheetJS parse
    → parser.js (parseWorkbook)
    → State.schools[] + State.planActual{}
    → analytics.js (aggregation)
    → pages.js / pages2.js / pages3.js (render)
    → Chart.js charts + HTML tables
```

### State Object (app.js)
```js
State = {
  schools: [],         // Array of school records (101 items)
  planActual: {},      // Granular plan/actual data by person+month+grade
  filters: {
    sales: "All",      // Salesperson filter
    year: "All",       // Year filter (2026, 2027)
    month: "All",      // Month filter (01-12)
    grade: "All"       // Re-Score grade filter (A/B/C/D)
  },
  page: "executive",   // Current active tab
  mapMode: "map",      // Province view: "map" or "bar"
  dataLabel: "...",    // Shows filename after upload
  projectFilter: "All",     // Pipeline page: All/1/2/3/4
  activityFilter: "All",    // Pipeline page: Updated Action filter
  followUpFilter: "All",    // Pipeline page: Follow-Up Action filter
  updatedAlertFilter: "All",  // Alert level filter
  followUpAlertFilter: "All",
  paMonth: "All",      // Activity Pipeline month filter
  paGrade: "All"       // Activity Pipeline grade filter
}
```

### School Record Schema
```js
{
  no: Number,            // Sequential ID
  name: String,          // School name
  province: String,      // Province (Bangkok, Chiang Mai, etc.)
  funnel: String,        // Current funnel stage
  funnelIdx: Number,     // 0-7 (Call→Install)
  tier: String,          // HH/HL/LH/LL (internal, not shown in UI)
  salesperson: String,   // "Somjit" | "Wassana"
  curriculum: String,    // British/American/IB/Cambridge/etc.
  initialScore: Number,  // Initial of Year 2026 score (0-100)
  reScore: Number,       // End of Year 2026 score (0-100)
  grade: String,         // "A"/"B"/"C"/"D" from reScore
  projectValue: Number,  // Total project value (THB)
  chance: Number,        // Win probability (0-100)
  numProjects: Number,   // Number of projects (1-4)
  projects: [{           // Per-project details
    projectNo: Number,
    product: String,
    funnel: String,
    funnelIdx: Number,
    projectValue: Number,
    chance: Number,
    status: String,        // Lead/Consider/Consider#1-3/Win/Lost
    updatedAction: String, // Latest updated action from Tracking sheet
    updatedDate: String,   // "23 Jan 26" format
    followUpAction: String,
    followUpDate: String,
  }],
  // Win/Loss aggregates (across all projects)
  winProjects: Number,
  lostProjects: Number,
  winValue: Number,
  isWinSchool: Boolean,
  quotationActions: Number,
  poInstallActions: Number,
  activeProjects: Number,  // Projects with Status = Lead/Consider
  active: Boolean,
  // 7-dimension End of Year 2026 assessment
  tuition: String,         // "High (>500K/yr)" | "Mid" | "Low"
  classLevel: String,
  students: String,        // "≥801" | "400-800" | "399≤"
  facilityStatus: String,
  readyLand: String,
  reputation: String,
  relationship: String,
  // Tracking fields (latest from Tracking sheets)
  updatedAction: String,
  updatedDate: String,
  followUpAction: String,
  followUpDate: String,
  updatedThisMonth: Boolean,
}
```

---

## Pages & Screens

### Page 1: Executive Overview (`executive`)
**Purpose:** Summary dashboard สำหรับ management — ภาพรวมทั้งหมด

**Layout:** Topbar → Tabs → Filter bar → KPI rows → Charts grid → Top 10 table

#### KPI Row 1 (7 cards, grid 7-col)
| Card | Value | Formula |
|------|-------|---------|
| Total Schools | count(schools) | นับจาก Master_Database |
| Total Projects | Σ numProjects | รวมทุก project |
| >70% Chance | Σ projects where chance≥70 | |
| Total Project Value | Σ projectValue | THB |
| Avg Re-Score | mean(reScore) | 0-100 |
| Open Follow-ups | count(status ≠ Win/Lost) | + project count ใน footer |
| Updated This Month | count(updatedThisMonth) | + project count ใน footer |

#### KPI Row 2 — "Win & Conversion Performance" (5 cards, green accent)
| Card | Formula |
|------|---------|
| Win Rate | ΣWin / Σ(Win+Lost) จาก Status column |
| Win Schools | นับโรงเรียนที่มี ≥1 project Win |
| Win Projects | ΣWin status |
| Win Project Value | Σ Value Toal ของ Win projects |
| Win Conversion Rate | ΣQuotation / Σ(PO+Install) จาก Updated Action |

#### KPI Row 3 — "Lost & Consider" (8 cards)
| Card | Formula |
|------|---------|
| Lost Rate | ΣLost / Σ(Win+Lost) |
| Lost Schools | โรงเรียนที่มี ≥1 Lost |
| Lost Projects | ΣLost status |
| Lost Project Value | Σ Value ของ Lost |
| Lost Conversion Rate | Σ(PO+Install-Quotation) / Σ(PO+Install) |
| Consider Schools | โรงเรียนที่มี Consider/Lead |
| Consider Projects | Σ Consider+Lead |
| Consider Project Value | Σ Value ของ Consider+Lead |

#### Charts Section
1. **Activity Pipeline · Plan vs Actual** (left, 5/12)
   - FPA bar chart: แต่ละ stage มี Plan bar + Actual bar + %diff badge
   - Stage labels: Call/Visit/Demo/Survey/Present/Quotation/PO/Install

2. **School Grade Matrix** (right, 7/12) — 2 panels side-by-side:
   - Panel 1: Grade A/B/C/D showing Schools / Projects / Value
   - Panel 2: Grade A/B/C/D showing Schools/Projects/Value ที่ Chance ≥70%

3. **Pipeline by Province** (1/3 width) — Tab: Map | Bars
   - Map: SVG choropleth ของไทย (apisit/thailand.json)
   - Bars: horizontal bars แต่ละจังหวัด มีชื่อโรงเรียน + จำนวน project
   - สีตาม Grade A(เขียว)/B(น้ำเงิน)/C(ม่วง)/D(แดง)

4. **Top 10 Schools** (2/3 width) — Sub-filter: "By Score" | "By Value" | "By Chance"
   - Sort: By Score = Grade→Point→Chance / By Value = projectValue desc / By Chance = chance desc (tiebreak value)
   - Columns: Rank, School, Province, Updated Date, Updated Action, Follow-Up Date, Follow-Up Action, Value, Chance, Salesperson, Re-Score, Point

### Page 2: Customer Pipeline (`pipeline`)
**Purpose:** ตาราง pipeline ทุกโรงเรียน เรียงตาม Re-Score → Point → Chance

**Sub-filters (page-specific):**
- Project: All / Project#1 / Project#2 / Project#3 / Project#4
- Updated Action: All / Call / Visit / Demo / Survey / Present / Quotation / PO / Install + Alert level (All/Urgent/Warning/Upcoming/On Progress)
- Follow-Up Action: same stages + Alert level

**Table columns:** No | School Name | Province | Updated Date | Updated Action | Follow-Up Date | Follow-Up Action | Project Value (THB) | Chance (%) | Salesperson | Re-Score | Point-Re-Score

**Alert coloring on action tags:**
- 🔴 Urgent = date passed (overdue)
- 🟡 Warning = 1-3 days ahead
- 🔵 Upcoming = 4-7 days ahead
- 🟢 On Progress = >7 days ahead

**Sort order:** Re-Score A→D, then Point-Re-Score desc, then Chance desc

**Inline editing:** Project Value + Chance columns are contenteditable — blur triggers recompute

### Page 3: Customer Analysis (`customer`)
**Purpose:** Heat map ของโรงเรียนทั้งหมด จัดกลุ่มตาม Grade A/B/C/D

**Features:**
- Search box — พิมพ์ชื่อ → scroll + highlight tile
- Heat map tiles grouped by grade (A=green, B=blue, C=purple, D=red)
- Bold+underline = Score ลดลง; Regular = Score เพิ่ม
- Click tile → Modal พร้อม Radar Chart 7 มิติ

**Radar Chart 7 Axes** (score 0-100 based on text value mapping):
1. Tuition
2. Class Level
3. No. of Students
4. Facility Status
5. Ready Land
6. Reputation & Competition
7. Relationship

### Page 4: Score Analysis (`score`)
**Purpose:** วิเคราะห์คะแนน Initial vs Re-Score

**Charts:**
1. Scatter plot: x=Initial Score, y=Re-Score, colored by grade
2. Score Improvement chips: Improved / No Change / Decreased
3. Average Score by Grade table (A/B/C/D + Total)
4. Score Distribution histogram (bands: 0-20, 21-40, 41-60, 61-80, 81-100)

### Page 5: Activity Pipeline (`plan`)
**Purpose:** Plan vs Actual + Updated/Follow-Up activity summary

**Sub-filters:**
- Month: All / JAN / FEB / ... / DEC
- Grade: All / A / B / C / D

**Charts:**
1. Activity Performance — horizontal bar chart, Plan row + Actual row per stage + % achievement line
2. Achievement Summary — radial gauge + total Plan/Actual
3. Updated & Follow-Up Activity — horizontal bar chart:
   - For each stage: 5 rows (Total / Urgent / Warning / Upcoming / On Progress)
   - Two side-by-side: Updated Action | Follow-Up Action
4. Activity Breakdown by Stage table

---

## Excel Data Source Mapping

### Master_Database sheet
```
[0]  No
[1]  School Name
[2]  Province
[3]  Customer Funnel (Old-Yearly/Monthly/New-Monthly)
[4]  HH-HL-LH-LL (tier)
[5]  Number of Projects
[6]  Salesperson
[7]  Curriculum
--- Initial of Year 2026 ---
[8]  Score (grade letter A/B/C/D)
[9]  Point-Score (0-100)
[10] Tuition
[11] Class Level
[12] No. of Student
[13] Facility Status
[14] Ready Land
[15] Reputation & Competition
[16] Relationship
--- End of Year 2026 ---
[17] Re-Score (grade letter)
[18] Point-Re-Score (0-100)
[19] Tuition (End)
[20] Class Level (End)
[21] No. of Student (End)
[22] Facility Status (End)
[23] Ready Land (End)
[24] Reputation & Competition (End)
[25] Relationship (End)
--- Project Blocks (stride 16) ---
Project#1: base=26
Project#2: base=42
Project#3: base=58
  base+1:  Updated Action
  base+7:  % โอกาส (chance)
  base+8:  Status (Lead/Consider/Win/Lost)
  base+9:  Main-Product
  base+15: Value Toal (project value THB)
--- TKT Activity Pipeline ---
[74] P-Total Call  [75] P-Total Visit  ...  [81] P-Total Install
[83] A-Total Call  [84] A-Total Visit  ...  [90] A-Total Install
```

### Tracking Sheets (Somjit_Tracking, Wassana_Tracking)
```
[0]  School Name
[1]  Project No (Project#1..#4)
[3]  Status
[6]  Updated Date (Excel serial)
[7]  Updated Action
[12] Follow-Up Date (Excel serial)
[13] Follow-Up Action
Rule: latest by date wins (per School + Project No key)
```

### Plan/Actual Sheets (Somjit_Plan, Wassana_Plan, Somjit_Actual, Wassana_Actual)
```
Plan:   P-Total [42..49], Monthly JAN=[50] stride 8 per month
Actual: A-Total [83..90], Monthly JAN=[91] stride 8 per month
[4] Score (Plan) / Re-Score (Actual) — grade letter for filtering
```

### Active Schools / Active Projects
Source: Tracking sheets, Status column = "Lead" or "Consider"
- Active Schools: distinct School Name
- Active Projects: distinct (School Name + Project No) pairs

---

## Interactions & Behavior

### Filters
- Global: Salesperson / Year / Month / Re-Score (A/B/C/D)
- All filters are additive (AND logic)
- Reset button clears all to "All"
- Charts + tables re-render on every filter change

### Upload Excel
```
btn-upload → file input → FileReader.readAsArrayBuffer
→ XLSX.read → parseWorkbook(wb)
→ State.schools = parsed.schools
→ State.planActual = parsed.planActual
→ renderShell() + renderPage()
→ showToast("Loaded N schools from filename")
```

### Inline Edit (Customer Pipeline)
```
contenteditable td → blur → commitEdit(cell)
→ update school.projectValue or .chance
→ recompute weightedValue = projectValue × chance / 100
→ update DOM in place (no full re-render)
→ showToast("School updated · Weighted ฿...")
```

### Customer Analysis Search
```
input → filter tiles by name.includes(query)
→ scrollIntoView match → add .ca-highlight class
→ pulse animation 3× → show "พบ: [name]" hint
Esc → clear search
```

### Radar Chart Modal
```
click .ca-tile → openRadar(school)
→ modal.style.display = "flex"
→ new Chart(radar-canvas) — 7 axes 0-100
Score mapping: text value → numeric score via SCORE_MAP
Close: × button | backdrop click | Esc key
```

### Province Map
```
mapMode = "map" → fetch thailand GeoJSON → SVG choropleth
mapMode = "bar" → HTML horizontal bars
Toggle: seg button → State.mapMode → re-render province section
Fallback: if map fetch fails → auto-switch to "bar"
```

---

## Funnel Stages (8 stages)
```
0: Call
1: Visit
2: Demo
3: Survey
4: Present
5: Quotation
6: PO
7: Install
```

## Status → Stage Mapping
```js
"lead"       → 0 (Call)
"consider"   → 2 (Demo)
"consider#1" → 3 (Survey)
"consider#2" → 4 (Present)
"consider#3" → 5 (Quotation)
"win"        → 7 (Install)
"lost"       → 2 (Demo)
```

---

## Assets / External Dependencies
```
Chart.js 4.4.1   — https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js
SheetJS 0.18.5   — https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js
Thailand GeoJSON — https://cdn.jsdelivr.net/gh/apisit/thailand.json@master/thailandWithName.json
Google Fonts     — Sora (500/600/700) + IBM Plex Sans Thai (400/500/600/700) + IBM Plex Mono
```

---

## Files in This Package

| File | Purpose |
|------|---------|
| `International School Tracking.html` | Entry point — loads all scripts in order |
| `data/styles.css` | Design system + all component CSS |
| `data/icons.js` | SVG icon set (window.ICONS) |
| `data/seed-data.js` | Demo dataset ~101 schools (deterministic RNG) |
| `data/analytics.js` | Pure aggregation functions — KPIs, funnel, matrices |
| `data/charts.js` | Chart.js renderers + SVG funnel + province bars + map |
| `data/parser.js` | Excel workbook → app schema mapper |
| `data/pages.js` | Page 1: Executive Overview |
| `data/pages2.js` | Page 2: Customer Pipeline + Page 5: Activity Pipeline |
| `data/pages3.js` | Page 3: Customer Analysis (heat map + radar modal) |
| `data/app.js` | App shell: state, tabs, filters, upload, count-up, CSV export |

### Script Load Order (critical)
```html
<script src="data/icons.js"></script>
<script src="data/seed-data.js"></script>    <!-- defines window.SEED_SCHOOLS, window.FUNNEL_STAGES -->
<script src="data/analytics.js"></script>    <!-- defines window.Analytics -->
<script src="data/charts.js"></script>       <!-- defines window.Charts, needs Chart.js loaded first -->
<script src="data/parser.js"></script>       <!-- defines window.parseWorkbook -->
<script src="data/pages.js"></script>        <!-- defines window.Pages.executive -->
<script src="data/pages2.js"></script>       <!-- extends window.Pages -->
<script src="data/pages3.js"></script>       <!-- extends window.Pages -->
<script src="data/app.js"></script>          <!-- boots the app -->
```

---

## Known Pending Work (งานค้าง)
1. **Activity Pipeline** — Updated & Follow-Up Activity section: เปลี่ยนจาก table เป็น Chart.js horizontal bars (5 rows per stage: Total/Urgent/Warning/Upcoming/On Progress)
2. **Activity Performance chart** — สลับ Actual(บน) → Plan(ล่าง) ตามที่ต้องการ
3. **Province map** — เพิ่มรายชื่อลูกค้าเมื่อ hover
4. **Page 6** — TKT Activity Pipeline (ยังไม่ได้สร้าง)
5. **Excel validation** — end-to-end test กับไฟล์ R.1 จริงหลัง pending changes

---

*Generated July 2, 2026 — International School Tracking v31*
