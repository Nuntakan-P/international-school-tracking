"use client";

// Plan vs Actual horizontal combo (bar+bar+line) with data-label plugin —
// ported from data/charts.js planActual().
import type { ChartDataset, Plugin } from "chart.js";
import { Chart } from "react-chartjs-2";
import { C, ensureChartSetup } from "@/lib/chartSetup";
import type { PlanVsActualResult } from "@/lib/types";

ensureChartSetup();

export function PlanActualChart({ pa }: { pa: PlanVsActualResult }) {
  const barLabelsPlugin: Plugin<"bar"> = {
    id: "barLabels",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.font = "600 10px 'IBM Plex Sans Thai'";
      chart.getDatasetMeta(0).data.forEach((bar, i) => {
        const v = pa.rows[i].plan;
        ctx.fillStyle = "#5b6b85";
        ctx.textAlign = "left";
        ctx.fillText(String(v), bar.x + 4, bar.y + 4);
      });
      chart.getDatasetMeta(1).data.forEach((bar, i) => {
        const v = pa.rows[i].actual;
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";
        const barAny = bar as unknown as { base: number; x: number; y: number };
        ctx.fillText(String(v), Math.max(barAny.base + 4, barAny.x - 24), barAny.y + 4);
      });
      ctx.font = "700 10px 'Sora'";
      chart.getDatasetMeta(2).data.forEach((pt, i) => {
        ctx.fillStyle = C.achieve;
        ctx.textAlign = "center";
        ctx.fillText(pa.rows[i].pct + "%", pt.x, pt.y - 8);
      });
      ctx.restore();
    },
  };

  return (
    <Chart
      type="bar"
      data={{
        labels: pa.rows.map((r) => r.stage),
        datasets: [
          { type: "bar", label: "Plan", data: pa.rows.map((r) => r.plan), backgroundColor: C.plan, borderRadius: 4, barPercentage: 0.8, categoryPercentage: 0.7, order: 3 },
          { type: "bar", label: "Actual", data: pa.rows.map((r) => r.actual), backgroundColor: C.actual, borderRadius: 4, barPercentage: 0.8, categoryPercentage: 0.7, order: 2 },
          {
            type: "line", label: "% Achievement", data: pa.rows.map((r) => r.pct), borderColor: C.achieve,
            backgroundColor: C.achieve, yAxisID: "y1", tension: 0.3, pointRadius: 4,
            pointBackgroundColor: "#fff", pointBorderColor: C.achieve, pointBorderWidth: 2, order: 1,
          } as ChartDataset<"line", number[]>,
        ],
      }}
      options={{
        indexAxis: "y", responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: "top", labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: "rectRounded" } },
          tooltip: {
            callbacks: {
              label: (c) => (c.dataset.type === "line" ? ` Achievement: ${c.raw}%` : ` ${c.dataset.label}: ${c.raw}`),
            },
          },
        },
        scales: {
          x: { grid: { color: C.grid }, beginAtZero: true, border: { display: false } },
          y: { grid: { display: false }, ticks: { font: { weight: 600 } }, border: { display: false } },
          y1: { display: false, min: 0, max: 100 },
        },
      }}
      plugins={[barLabelsPlugin]}
    />
  );
}
