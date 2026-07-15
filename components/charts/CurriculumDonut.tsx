"use client";

// Curriculum donut — ported from data/charts.js curriculum().
import { Doughnut } from "react-chartjs-2";
import { C, ensureChartSetup } from "@/lib/chartSetup";
import type { CurriculumRow } from "@/lib/types";

ensureChartSetup();

export function CurriculumDonut({ data }: { data: CurriculumRow[] }) {
  return (
    <Doughnut
      data={{
        labels: data.map((d) => d.name),
        datasets: [{
          data: data.map((d) => d.count),
          backgroundColor: data.map((_, i) => C.curriculum[i % C.curriculum.length]),
          borderWidth: 2, borderColor: "#fff", hoverOffset: 6,
        }],
      }}
      options={{
        responsive: true, maintainAspectRatio: false, cutout: "62%",
        plugins: {
          legend: {
            position: "right",
            labels: {
              boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: "circle", padding: 10,
              generateLabels: (chart) => {
                const ds = chart.data.datasets[0];
                const values = (ds.data as number[]);
                const total = values.reduce((a, b) => a + b, 0);
                return (chart.data.labels as string[]).map((l, i) => ({
                  text: `${l}  ${values[i]} (${Math.round((values[i] / total) * 100)}%)`,
                  fillStyle: (ds.backgroundColor as string[])[i],
                  strokeStyle: (ds.backgroundColor as string[])[i],
                  index: i,
                }));
              },
            },
          },
          tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.raw}` } },
        },
      }}
    />
  );
}
