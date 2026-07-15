"use client";

import { Icon } from "@/components/icons/Icon";
import { useDashboard } from "@/context/DashboardContext";

export function Toast() {
  const { toast } = useDashboard();
  return (
    <div className={`toast ${toast ? "show" : ""}`}>
      {toast ? (
        <>
          <Icon name="check" />
          <span>{toast}</span>
        </>
      ) : null}
    </div>
  );
}
