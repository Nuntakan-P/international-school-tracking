"use client";

// Achievement gauge (SVG ring) — ported from data/charts.js gauge().
// Keyed by `pct` in the wrapper so each value change remounts the ring
// (starting fresh at offset=circ) and animates in, matching the prototype's
// full re-render-on-change behaviour without a synchronous reset inside an effect.
import { useEffect, useState } from "react";
import { C } from "@/lib/chartSetup";

function GaugeRing({ pct }: { pct: number }) {
  const r = 70, cx = 90, cy = 90;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setOffset(circ * (1 - pct / 100)));
    return () => cancelAnimationFrame(raf);
  }, [circ, pct]);

  return (
    <svg viewBox="0 0 180 180" width={180} height={180}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef2f7" strokeWidth={16} />
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke={C.blue} strokeWidth={16}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.7,.3,1)" }}
      />
      <text x={90} y={98} textAnchor="middle" fontSize={34} fontWeight={700} fill={C.navy} fontFamily="'Sora',sans-serif">
        {pct}%
      </text>
    </svg>
  );
}

export function Gauge({ pct }: { pct: number }) {
  return <GaugeRing key={pct} pct={pct} />;
}
