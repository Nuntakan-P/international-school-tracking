"use client";

import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/Icon";
import { useCountUp, type CountFmt } from "@/hooks/useCountUp";

type CSSVarStyle = CSSProperties & Record<`--${string}`, string>;

export interface KpiCardProps {
  label: string;
  value: number;
  icon: IconName;
  accent: string;
  bg: string;
  fmt?: CountFmt;
  unit?: string;
  foot?: ReactNode;
  footClass?: string;
}

export function KpiCard({ label, value, icon, accent, bg, fmt = "int", unit, foot, footClass }: KpiCardProps) {
  const display = useCountUp(value, fmt);
  const style: CSSVarStyle = { "--accent": accent, "--accent-bg": bg };
  return (
    <div className="kpi" style={style}>
      <div className="kpi-ic"><Icon name={icon} /></div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-val">
        {display}
        {unit ? <span className="unit">{unit}</span> : null}
      </div>
      {foot ? <div className={`kpi-foot ${footClass || ""}`}>{foot}</div> : null}
    </div>
  );
}
