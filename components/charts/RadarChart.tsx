"use client";

// 7-dimension radar chart used in the Customer Analysis radar modal —
// ported from data/pages3.js openRadar().
import { Radar } from "react-chartjs-2";
import { ensureChartSetup } from "@/lib/chartSetup";

ensureChartSetup();

export function RadarChart({
  labels, scores, accent, name,
}: {
  labels: (string | string[])[];
  scores: number[];
  accent: string;
  name: string;
}) {
  return (
    <Radar
      width={360}
      height={360}
      data={{
        labels,
        datasets: [{
          label: name, data: scores,
          backgroundColor: accent + "28",
          borderColor: accent, borderWidth: 2.5,
          pointBackgroundColor: accent, pointRadius: 4.5, pointHoverRadius: 7,
        }],
      }}
      options={{
        responsive: false, animation: { duration: 700, easing: "easeOutQuart" },
        scales: {
          r: {
            min: 0, max: 100, ticks: { stepSize: 25, display: false },
            grid: { color: "#e6ecf4" }, angleLines: { color: "#e6ecf4" },
            pointLabels: { font: { size: 11.5, weight: 600, family: "'IBM Plex Sans Thai',sans-serif" }, color: "#46536a" },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => " " + c.raw + "/100" } },
        },
      }}
    />
  );
}
