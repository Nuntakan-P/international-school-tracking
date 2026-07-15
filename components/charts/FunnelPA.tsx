// Plan vs Actual funnel bars (HTML) — ported from data/charts.js funnelPA().
import { C } from "@/lib/chartSetup";
import type { PlanVsActualRow } from "@/lib/types";

export function FunnelPA({ rows }: { rows: PlanVsActualRow[] }) {
  const max = Math.max(...rows.map((r) => Math.max(r.plan, r.actual)), 1);
  return (
    <div className="fpa">
      {rows.map((r, i) => {
        const diff = r.plan ? Math.round(((r.actual - r.plan) / r.plan) * 100) : 0;
        const dCls = diff >= 0 ? "up" : diff <= -15 ? "down" : "warn";
        const planW = (r.plan / max) * 100;
        const actW = (r.actual / max) * 100;
        const color = C.funnel[i] || C.blue;
        return (
          <div className="fpa-row" key={r.stage}>
            <div className="fpa-label">{r.stage}</div>
            <div className="fpa-bars">
              <div className="fpa-bar plan">
                <i style={{ width: `${planW}%` }} />
                <b>Plan</b>
                <span>{r.plan}</span>
              </div>
              <div className="fpa-bar actual">
                <i style={{ width: `${actW}%`, background: `linear-gradient(90deg,${color}cc,${color})` }} />
                <b>Actual</b>
                <span>{r.actual}</span>
              </div>
            </div>
            <div className={`fpa-diff ${dCls}`}>
              <span className="d-arr">{diff >= 0 ? "▲" : "▼"}</span>
              {diff >= 0 ? "+" : ""}{diff}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
