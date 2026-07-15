"use client";

import { DashboardProvider } from "@/context/DashboardContext";
import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <DashboardProvider>
      <Dashboard />
    </DashboardProvider>
  );
}
