import type { ReactNode } from "react";

export function KpiRow({ variant, children }: { variant?: "over" | "win" | "consider"; children: ReactNode }) {
  return <div className={`kpi-row ${variant ? "r-" + variant : ""}`}>{children}</div>;
}

export function KpiBandLabel({ children }: { children: ReactNode }) {
  return <div className="kpi-band-label">{children}</div>;
}
