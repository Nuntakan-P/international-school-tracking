"use client";

// Salesperson performance combo bar chart — ported from data/charts.js salesperson().
import { Bar } from "react-chartjs-2";
import { C, ensureChartSetup } from "@/lib/chartSetup";
import { fmtM, fmtTHB } from "@/lib/format";
import type { SalespersonRow } from "@/lib/types";

ensureChartSetup();

export function SalespersonChart({ data }: { data: SalespersonRow[] }) {
  return (
    <Bar
      data={{
        labels: data.map((d) => d.name),
        datasets: [
          { label: "Pipeline (THB)", data: data.map((d) => d.pipeline), backgroundColor: C.blue, borderRadius: 5, yAxisID: "y", barPercentage: 0.55, categoryPercentage: 0.6 },
          { label: "PO (Count)", data: data.map((d) => d.poCount), backgroundColor: "#5cc26b", borderRadius: 5, yAxisID: "y1", barPercentage: 0.55, categoryPercentage: 0.6 },
          { label: "Install (Count)", data: data.map((d) => d.installCount), backgroundColor: C.achieve, borderRadius: 5, yAxisID: "y1", barPercentage: 0.55, categoryPercentage: 0.6 },
        ],
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: "top", labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: "rectRounded" } },
          tooltip: { callbacks: { label: (c) => c.datasetIndex === 0 ? " " + fmtTHB(c.raw as number) : ` ${c.dataset.label}: ${c.raw}` } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { weight: 600, size: 13 } } },
          y: { position: "left", grid: { color: C.grid }, ticks: { callback: (v) => fmtM(v as number) }, border: { display: false } },
          y1: { position: "right", grid: { display: false }, beginAtZero: true, suggestedMax: 50, border: { display: false } },
        },
      }}
    />
  );
}
