"use client";

// Page 2 — Customer Pipeline. Ported from data/pages2.js pipeline().
import type { FocusEvent, KeyboardEvent } from "react";
import * as A from "@/lib/analytics";
import { alertLevel, chanceClass, followUpAlertClass } from "@/lib/format";
import { useDashboard } from "@/context/DashboardContext";
import { Icon } from "@/components/icons/Icon";
import { GradeTag } from "@/components/shared/Tag";
import type { AlertLevel, PipelineRow } from "@/lib/types";

const PROJ_OPTS = ["All", "1", "2", "3", "4"];
const projLabel = (o: string) => (o === "All" ? "All Projects" : "Project#" + o);
const STAGE_OPTS = ["All", "Call", "Visit", "Demo", "Survey", "Present", "Quotation", "PO", "Install"];
const ALERT_OPTS: (AlertLevel | "All")[] = ["All", "Urgent", "Warning", "Upcoming", "On Progress"];

function dateCell(d: string) {
  return d ? <span className="num" style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{d}</span> : <span style={{ color: "var(--muted)" }}>—</span>;
}

function ActionTag({ action, date }: { action: string; date: string }) {
  if (!action) return <span style={{ color: "var(--muted)" }}>—</span>;
  const cls = followUpAlertClass(date);
  return <span className={`tag funnel ${cls}`}>{action}</span>;
}

function EditableTd({ value, onCommit }: { value: string; onCommit: (text: string) => void }) {
  const handleBlur = (e: FocusEvent<HTMLTableCellElement>) => onCommit(e.currentTarget.textContent || "");
  const handleKeyDown = (e: KeyboardEvent<HTMLTableCellElement>) => {
    if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
  };
  return (
    <td
      className="r num editable"
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      {value}
    </td>
  );
}

function EditableSpan({ value, minWidth, onCommit }: { value: string; minWidth?: number; onCommit: (text: string) => void }) {
  const handleBlur = (e: FocusEvent<HTMLSpanElement>) => onCommit(e.currentTarget.textContent || "");
  const handleKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
  };
  return (
    <span
      className="editable"
      style={minWidth ? { display: "inline-block", minWidth } : undefined}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      {value}
    </span>
  );
}

export function CustomerPipeline() {
  const {
    filteredSchools: data, projectFilter, setProjectFilter, activityFilter, setActivityFilter,
    followUpFilter, setFollowUpFilter, updatedAlertFilter, setUpdatedAlertFilter,
    followUpAlertFilter, setFollowUpAlertFilter, updateSchoolField, showToast,
  } = useDashboard();

  let rows: PipelineRow[] = A.pipelineRows(data, projectFilter);
  if (activityFilter !== "All") {
    rows = rows.filter((r) => (r.updatedAction || "").toLowerCase() === activityFilter.toLowerCase());
  }
  if (followUpFilter !== "All") {
    rows = rows.filter((r) => (r.followUpAction || "").toLowerCase() === followUpFilter.toLowerCase());
  }
  if (updatedAlertFilter !== "All") {
    rows = rows.filter((r) => alertLevel(r.updatedDate) === updatedAlertFilter);
  }
  if (followUpAlertFilter !== "All") {
    rows = rows.filter((r) => alertLevel(r.followUpDate) === followUpAlertFilter);
  }

  function commit(row: PipelineRow, field: "projectValue" | "chance", raw: string) {
    let val = parseFloat(raw.replace(/[^0-9.]/g, ""));
    if (isNaN(val)) val = 0;
    if (field === "chance") val = Math.max(0, Math.min(100, Math.round(val)));
    const projectNo = projectFilter !== "All" ? parseInt(projectFilter, 10) : null;
    updateSchoolField(row.no, projectNo, field, val);
    const weighted = field === "chance"
      ? Math.round(row.projectValue * val / 100)
      : Math.round(val * row.chance / 100);
    showToast(row.name + " updated · Weighted ฿" + weighted.toLocaleString());
  }

  return (
    <div>
      <div className="page-head">
        <h2>Customer Pipeline</h2>
        <span className="sub">Ranked by Point-Re-Score · editable — values recompute live</span>
      </div>
      <div className="card">
        <div className="card-hd">
          <div>
            <div className="card-title">Customer Pipeline</div>
            <div className="card-sub">{data.length} schools in view · {rows.length} rows</div>
          </div>
        </div>
        <div className="pipe-filters">
          <div className="pf-group">
            <span className="filter-label" style={{ margin: 0 }}><Icon name="filter" />Project</span>
            <div className="select-wrap">
              <select className="fsel" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
                {PROJ_OPTS.map((o) => <option key={o} value={o}>{projLabel(o)}</option>)}
              </select>
            </div>
          </div>
          <div className="pf-divider" />
          <div className="pf-group">
            <span className="filter-label" style={{ margin: 0 }}>Updated Action</span>
            <div className="select-wrap">
              <select className="fsel" value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)}>
                {STAGE_OPTS.map((o) => <option key={o} value={o}>{o === "All" ? "All" : o}</option>)}
              </select>
            </div>
            <div className="select-wrap">
              <select className="fsel fsel-alert" value={updatedAlertFilter} onChange={(e) => setUpdatedAlertFilter(e.target.value)}>
                {ALERT_OPTS.map((o) => <option key={o} value={o}>{o === "All" ? "All Status" : o}</option>)}
              </select>
            </div>
          </div>
          <div className="pf-divider" />
          <div className="pf-group">
            <span className="filter-label" style={{ margin: 0 }}>Follow-Up Action</span>
            <div className="select-wrap">
              <select className="fsel" value={followUpFilter} onChange={(e) => setFollowUpFilter(e.target.value)}>
                {STAGE_OPTS.map((o) => <option key={o} value={o}>{o === "All" ? "All" : o}</option>)}
              </select>
            </div>
            <div className="select-wrap">
              <select className="fsel fsel-alert" value={followUpAlertFilter} onChange={(e) => setFollowUpAlertFilter(e.target.value)}>
                {ALERT_OPTS.map((o) => <option key={o} value={o}>{o === "All" ? "All Status" : o}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="data">
            <thead>
              <tr>
                <th className="c">No</th><th>School Name</th><th>Province</th>
                <th>Updated Date</th><th>Updated Action</th><th>Follow-Up Date</th><th>Follow-Up Action</th>
                <th className="r">Project Value (THB)</th><th className="c">Chance (%)</th>
                <th>Salesperson</th><th className="c">Re-Score</th><th className="c">Point-Re-Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={12} className="empty">No projects match this filter</td></tr>
              ) : rows.map((r, i) => (
                <tr key={r.no}>
                  <td className="c rank">{i + 1}</td>
                  <td className="school-cell">{r.name}</td>
                  <td>{r.province}</td>
                  <td>{dateCell(r.updatedDate)}</td>
                  <td><ActionTag action={r.updatedAction} date={r.updatedDate} /></td>
                  <td>{dateCell(r.followUpDate)}</td>
                  <td><ActionTag action={r.followUpAction} date={r.followUpDate} /></td>
                  <EditableTd value={r.projectValue.toLocaleString()} onCommit={(t) => commit(r, "projectValue", t)} />
                  <td className="c">
                    <span className="chance">
                      <span className={`cdot ${chanceClass(r.chance)}`} />
                      <EditableSpan value={String(r.chance)} minWidth={24} onCommit={(t) => commit(r, "chance", t)} />
                    </span>
                  </td>
                  <td>{r.salesperson}</td>
                  <td className="c"><GradeTag grade={r.grade} /></td>
                  <td className="c"><b className="num" style={{ color: "var(--navy)" }}>{r.reScore}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="note">
          <b>หมายเหตุ</b> : <span className="adot urgent" />Urgent=เลยกำหนด · <span className="adot warning" />Warning=1-3วัน · <span className="adot upcoming" />Upcoming=4-7วัน · <span className="adot onprogress" />On Progress=&gt;7วัน · เรียงลำดับ Re-Score (A→D) → Point-Re-Score → Chance (%)
        </div>
      </div>
    </div>
  );
}
