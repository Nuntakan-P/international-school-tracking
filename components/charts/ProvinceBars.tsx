// Province horizontal bars (HTML) — ported from data/charts.js provinceBars().
import type { CSSProperties } from "react";
import { fmtM } from "@/lib/format";
import type { ProvinceRow } from "@/lib/types";

export function ProvinceBars({ data, gridTemplateColumns }: { data: ProvinceRow[]; gridTemplateColumns?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const style: CSSProperties | undefined = gridTemplateColumns ? { gridTemplateColumns } : undefined;
  return (
    <div>
      {data.map((d) => (
        <div className="prov-row" style={style} key={d.province}>
          <div className="prov-name">{d.province}</div>
          <div className="prov-proj">{d.totalProjects || "—"}</div>
          <div className="prov-track"><div className="prov-fill" style={{ width: `${(d.value / max) * 100}%` }} /></div>
          <div className="prov-val">{fmtM(d.value)}</div>
        </div>
      ))}
    </div>
  );
}
