"use client";

import { useEffect, useState } from "react";
import { fmtM } from "@/lib/format";

export type CountFmt = "int" | "money" | "pct" | "decimal";

function formatValue(v: number, fmt: CountFmt): string {
  if (fmt === "money") return fmtM(v);
  if (fmt === "pct") return v + "%";
  if (fmt === "decimal") return v.toFixed(1);
  return Math.round(v).toLocaleString("en-US");
}

/** Ports animateCounts()'s rAF ease-out count-up (app.js) into a React hook. */
export function useCountUp(target: number, fmt: CountFmt = "int", durationMs = 900): string {
  const [display, setDisplay] = useState(() => formatValue(target, fmt));

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    function step(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(formatValue(target * eased, fmt));
      if (t < 1) raf = requestAnimationFrame(step);
      else setDisplay(formatValue(target, fmt));
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, fmt]);

  return display;
}
