// Chart.js registration + shared color palette — ported from data/charts.js.
import {
  ArcElement, BarController, BarElement, CategoryScale, Chart, DoughnutController,
  Filler, Legend, LinearScale, LineController, LineElement, PointElement,
  RadarController, RadialLinearScale, ScatterController, Tooltip,
} from "chart.js";

let registered = false;
export function ensureChartSetup() {
  if (registered) return;
  registered = true;
  Chart.register(
    ArcElement, BarController, BarElement, CategoryScale, DoughnutController,
    Filler, Legend, LinearScale, LineController, LineElement, PointElement,
    RadarController, RadialLinearScale, ScatterController, Tooltip
  );
  Chart.defaults.font.family = "'IBM Plex Sans Thai','IBM Plex Sans',sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = C.text;
  Chart.defaults.animation = { duration: 850, easing: "easeOutQuart" };
  Chart.defaults.plugins.tooltip.backgroundColor = "#16233a";
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.titleFont = { weight: 600 };
  Chart.defaults.plugins.tooltip.boxPadding = 4;
}

export const C = {
  blue: "#2f6fe0", blueDark: "#1b4f9c", navy: "#13315c",
  funnel: ["#1b4f9c", "#2f6fe0", "#4f93ef", "#3bb5a3", "#5cc26b", "#a2c723", "#f0a431", "#e8554e"],
  grades: { A: "#2e9e5b", B: "#2f6fe0", C: "#7a6ad0", D: "#e8554e" } as Record<string, string>,
  tiers: { HH: "#2e9e5b", HL: "#9ccc5a", LH: "#f2c43d", LL: "#e8645c" } as Record<string, string>,
  tiersSoft: { HH: "#e6f5ec", HL: "#f0f7e6", LH: "#fdf6df", LL: "#fdeceb" } as Record<string, string>,
  curriculum: ["#2f6fe0", "#4f93ef", "#3bb5a3", "#9ccc5a", "#f0a431", "#e8645c", "#8a7fe0"],
  grid: "#eef2f7", axis: "#9aa7ba", text: "#46536a",
  plan: "#cfdaeb", actual: "#2f6fe0", achieve: "#f0a431",
};
