"use client";

import { Icon } from "@/components/icons/Icon";
import { useDashboard } from "@/context/DashboardContext";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_VALUES = ["All", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

function monthLabel(k: string) {
  if (k === "All") return "All Months";
  return MONTH_NAMES[parseInt(k, 10) - 1] || k;
}

function uniq(arr: string[]) {
  return [...new Set(arr)].filter(Boolean);
}

function Select({
  label, options, value, labeler, onChange,
}: {
  label: string;
  options: string[];
  value: string;
  labeler?: (o: string) => string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="select-wrap">
      <select className="fsel" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>{labeler ? labeler(o) : o}</option>
        ))}
      </select>
    </div>
  );
}

export function FilterBar() {
  const { schools, filters, setFilter, resetFilters } = useDashboard();
  const salesOptions = ["All", ...uniq(schools.map((s) => s.salesperson)).sort()];

  return (
    <div className="filters">
      <span className="filter-label"><Icon name="filter" />Filters</span>
      <Select
        label="Salesperson"
        options={salesOptions}
        value={filters.sales}
        labeler={(o) => (o === "All" ? "All Salesperson" : o)}
        onChange={(v) => setFilter("sales", v)}
      />
      <Select
        label="Year"
        options={["All", "2026", "2027"]}
        value={filters.year}
        labeler={(o) => (o === "All" ? "All Years" : o)}
        onChange={(v) => setFilter("year", v)}
      />
      <Select
        label="Month"
        options={MONTH_VALUES}
        value={filters.month}
        labeler={monthLabel}
        onChange={(v) => setFilter("month", v)}
      />
      <Select
        label="Re-Score"
        options={["All", "A", "B", "C", "D"]}
        value={filters.grade}
        labeler={(o) => (o === "All" ? "All Re-Score" : "Re-Score " + o)}
        onChange={(v) => setFilter("grade", v)}
      />
      <div className="filters-spacer" />
      <button className="reset-link" onClick={resetFilters}>Reset filters</button>
    </div>
  );
}
