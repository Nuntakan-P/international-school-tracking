// Inline SVG icon set — ported from data/icons.js.
import type { SVGProps } from "react";

export type IconName =
  | "school" | "opp" | "money" | "weight" | "heart" | "score" | "bell"
  | "refresh" | "upload" | "filter" | "check" | "download" | "trophy"
  | "percent" | "lost";

const PATHS: Record<IconName, { d: string[]; circles?: { cx: number; cy: number; r: number }[]; strokeWidth?: number }> = {
  school: { d: ["M3 21h18M5 21V10l7-5 7 5v11M9 21v-5h6v5"] },
  opp: { d: ["M3 17l6-6 4 4 8-8M21 7v5"] },
  money: { d: ["M12 7v10M9.5 9.5a2.5 2 0 0 1 5 0c0 2.5-5 1.5-5 4a2.5 2 0 0 0 5 0"], circles: [{ cx: 12, cy: 12, r: 9 }] },
  weight: { d: ["M4 20h16M6 20l3-9 3 5 3-8 3 12"] },
  heart: { d: ["M20.8 7.6a5 5 0 0 0-8.8-2 5 5 0 0 0-8.8 2c0 4 4.8 7.4 8.8 10.4 4-3 8.8-6.4 8.8-10.4z"] },
  score: { d: ["M12 7v5l3 2"], circles: [{ cx: 12, cy: 12, r: 9 }] },
  bell: { d: ["M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10.5 21a2 2 0 0 0 3 0"] },
  refresh: { d: ["M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"] },
  upload: { d: ["M12 16V4M7 9l5-5 5 5M5 20h14"] },
  filter: { d: ["M3 5h18M6 12h12M10 19h4"] },
  check: { d: ["M20 6L9 17l-5-5"], strokeWidth: 2.2 },
  download: { d: ["M12 4v12M7 11l5 5 5-5M5 20h14"] },
  trophy: { d: ["M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4zM7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3"] },
  percent: { d: ["M19 5L5 19"], circles: [{ cx: 7.5, cy: 7.5, r: 1.5 }, { cx: 19.5, cy: 16.5, r: 1.5 }] },
  lost: { d: ["M15 9l-6 6M9 9l6 6"], circles: [{ cx: 12, cy: 12, r: 9 }] },
};

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  const spec = PATHS[name];
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={spec.strokeWidth ?? 1.8} {...props}>
      {spec.circles?.map((c, i) => <circle key={i} cx={c.cx} cy={c.cy} r={c.r} />)}
      {spec.d.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
