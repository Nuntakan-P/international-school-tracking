"use client";

// App shell orchestrator — mirrors renderShell()/renderPage() in data/app.js.
import { useDashboard } from "@/context/DashboardContext";
import { Topbar } from "@/components/shell/Topbar";
import { Tabs } from "@/components/shell/Tabs";
import { FilterBar } from "@/components/shell/FilterBar";
import { Toast } from "@/components/shell/Toast";
import { ExecutiveOverview } from "@/components/pages/ExecutiveOverview";
import { CustomerPipeline } from "@/components/pages/CustomerPipeline";
import { CustomerAnalysis } from "@/components/pages/CustomerAnalysis";
import { ScoreAnalysis } from "@/components/pages/ScoreAnalysis";
import { ActivityPipeline } from "@/components/pages/ActivityPipeline";

const PAGES: Record<string, React.ComponentType> = {
  executive: ExecutiveOverview,
  pipeline: CustomerPipeline,
  customer: CustomerAnalysis,
  score: ScoreAnalysis,
  plan: ActivityPipeline,
};

export function Dashboard() {
  const { page } = useDashboard();
  const PageComponent = PAGES[page];

  return (
    <div className="app">
      <Topbar />
      <Tabs />
      <FilterBar />
      <div key={page} className="page">
        <PageComponent />
      </div>
      <Toast />
    </div>
  );
}
