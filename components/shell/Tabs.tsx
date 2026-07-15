"use client";

import { useDashboard } from "@/context/DashboardContext";
import type { PageId } from "@/lib/types";

const TABS: { id: PageId; label: string }[] = [
  { id: "executive", label: "Executive Overview" },
  { id: "pipeline", label: "Customer Pipeline" },
  { id: "customer", label: "Customer Analysis" },
  { id: "score", label: "Score Analysis" },
  { id: "plan", label: "Activity Pipeline" },
];

export function Tabs() {
  const { page, setPage } = useDashboard();
  return (
    <div className="tabs">
      {TABS.map((t, i) => (
        <button
          key={t.id}
          className={`tab ${t.id === page ? "active" : ""}`}
          onClick={() => setPage(t.id)}
        >
          <span className="tab-n">{i + 1}</span>
          <span>{t.label}</span>
          <span className="underline" />
        </button>
      ))}
    </div>
  );
}
