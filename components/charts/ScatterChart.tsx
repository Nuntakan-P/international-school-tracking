"use client";

// Initial vs Re-Score scatter — ported from data/charts.js scatter().
import { Scatter } from "react-chartjs-2";
import { C, ensureChartSetup } from "@/lib/chartSetup";
import type { Grade, ScatterPoint } from "@/lib/types";

ensureChartSetup();

const GRADES: Grade[] = ["A", "B", "C", "D"];

export function ScatterChart({ data }: { data: ScatterPoint[] }) {
  const byGrade: Record<string, { x: number; y: number; name: string }[]> = { A: [], B: [], C: [], D: [] };
  data.forEach((d) => byGrade[d.grade]?.push({ x: d.x, y: d.y, name: d.name }));

  return (
    <Scatter
      data={{
        datasets: GRADES.map((g) => ({
          label: "Grade " + g,
          data: byGrade[g],
          backgroundColor: C.grades[g],
          pointRadius: 4.5, pointHoverRadius: 7, borderColor: "#fff", borderWidth: 0.6,
        })),
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: "right", labels: { boxWidth: 9, boxHeight: 9, usePointStyle: true, pointStyle: "circle", padding: 12 } },
          tooltip: {
            callbacks: {
              title: (items) => (items[0].raw as { name: string }).name,
              label: (c) => {
                const raw = c.raw as { x: number; y: number };
                return ` Initial ${raw.x} → Re-Score ${raw.y}`;
              },
            },
          },
        },
        scales: {
          x: { min: 0, max: 100, title: { display: true, text: "Initial Score", color: C.axis }, grid: { color: C.grid }, border: { display: false } },
          y: { min: 0, max: 100, title: { display: true, text: "Re-Score", color: C.axis }, grid: { color: C.grid }, border: { display: false } },
        },
      }}
    />
  );
}
