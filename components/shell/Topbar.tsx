"use client";

import { useRef } from "react";
import { Icon } from "@/components/icons/Icon";
import { useDashboard } from "@/context/DashboardContext";

export function Topbar() {
  const { dataLabel, exportCSV, uploadWorkbook } = useDashboard();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">IS</div>
        <div className="brand-txt">
          <h1>International School Tracking</h1>
          <p>Sales Performance &amp; Customer Pipeline · CRM Dashboard</p>
        </div>
      </div>
      <div className="topbar-spacer" />
      <div className="asof">
        <span className="dot" />
        <span>{dataLabel}</span>
      </div>
      <button className="btn" onClick={exportCSV}>
        <Icon name="download" />
        <span>Export CSV</span>
      </button>
      <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
        <Icon name="upload" />
        <span>Upload Excel</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadWorkbook(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
