"use client";

// Score distribution bars with top data-labels — ported from data/charts.js scoreDist().
import type { Plugin } from "chart.js";
import { Bar } from "react-chartjs-2";
import { C, ensureChartSetup } from "@/lib/chartSetup";
import type { ScoreDistBucket } from "@/lib/types";

ensureChartSetup();

export function ScoreDistChart({ data }: { data: ScoreDistBucket[] }) {
  const topLabelsPlugin: Plugin<"bar"> = {
    id: "topLabels",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.font = "600 12px 'IBM Plex Sans Thai'";
      ctx.fillStyle = C.text;
      ctx.textAlign = "center";
      chart.getDatasetMeta(0).data.forEach((bar, i) => {
        ctx.fillText(data[i].pct + "%", bar.x, bar.y - 6);
      });
      ctx.restore();
    },
  };

  return (
    <Bar
      data={{
        labels: data.map((d) => d.label),
        datasets: [{
          data: data.map((d) => d.pct),
          backgroundColor: data.map(() => "#7fb0f2"),
          hoverBackgroundColor: C.blue,
          borderRadius: 6, barPercentage: 0.7,
        }],
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => ` ${c.raw}% of schools` } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { weight: 600 } }, border: { display: false } },
          y: { display: false, max: Math.max(...data.map((d) => d.pct)) * 1.25 },
        },
      }}
      plugins={[topLabelsPlugin]}
    />
  );
}
