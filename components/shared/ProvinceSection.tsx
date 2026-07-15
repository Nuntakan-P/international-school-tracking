"use client";

// Pipeline by Province card body (map/bar toggle + collapsible school list) —
// ported from data/pages.js renderProvince().
import { useState } from "react";
import { ProvinceBars } from "@/components/charts/ProvinceBars";
import { ProvinceMap } from "@/components/charts/ProvinceMap";
import { fmtM } from "@/lib/format";
import type { MapMode, ProvinceRow } from "@/lib/types";

export function ProvinceSection({
  data, mapMode, onMapFallback,
}: {
  data: ProvinceRow[];
  mapMode: MapMode;
  onMapFallback: () => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div>
      {mapMode === "bar" ? (
        <div style={{ marginTop: 6 }}>
          <ProvinceBars data={data} />
        </div>
      ) : (
        <div className="map-box">
          <ProvinceMap data={data} onFallback={onMapFallback} />
          <div className="map-legend">
            <ProvinceBars data={data.slice(0, 7)} gridTemplateColumns="80px 28px 1fr 56px" />
          </div>
        </div>
      )}
      <div className="prov-details-wrap">
        <div className="prov-details-toggle" onClick={() => setDetailsOpen((o) => !o)}>
          {detailsOpen ? "▲" : "▼"} รายชื่อโรงเรียนแยกตาม Province
        </div>
        {detailsOpen && (
          <div className="prov-details">
            {data.map((d) => (
              <div className="prov-detail" key={d.province}>
                <div className="prov-detail-hd">
                  <b>{d.province}</b>
                  <span style={{ color: "var(--muted)", fontSize: 10 }}>
                    {d.schoolCount} Schools · {d.totalProjects} Projects · {fmtM(d.value)}
                  </span>
                </div>
                <div className="prov-detail-list">
                  {d.schools.map((s, i) => (
                    <span className={`prov-school-chip g${s.grade || "D"}`} key={i}>{s.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
