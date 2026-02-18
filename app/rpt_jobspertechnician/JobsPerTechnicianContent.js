"use client";

import { useState, useTransition } from "react";

const inputClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";
const gridThClass =
  "border-b border-zinc-200 bg-zinc-100 px-4 py-3 font-semibold text-left text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
const gridTdClass = "px-4 py-3 text-xs text-zinc-800 dark:text-zinc-200";
const gridRowClass =
  "border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50";
const gridSubtotalRowClass =
  "border-b border-zinc-200 bg-zinc-200 font-medium dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-100";

const gridColumnHeaders = {
  jobcount: "Job Count",
};

function getGridColumnHeader(key) {
  const normalized = key.toLowerCase().replace(/_/g, "");
  return gridColumnHeaders[normalized] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function findJobCountKey(orderedKeys) {
  const normalized = orderedKeys.map((k) => [k.toLowerCase().replace(/_/g, ""), k]);
  const match = normalized.find(([n]) => n === "jobcount");
  return match ? match[1] : orderedKeys.find((k) => /jobcount/.test(k.toLowerCase())) ?? null;
}

function findTechnicianKey(orderedKeys) {
  const normalized = orderedKeys.map((k) => [k.toLowerCase().replace(/_/g, ""), k]);
  const match = normalized.find(([n]) => n === "technician" || n.includes("technician"));
  return match ? match[1] : orderedKeys.find((k) => /technician/.test(k.toLowerCase())) ?? null;
}

function findTotalKey(orderedKeys) {
  const normalized = orderedKeys.map((k) => [k.toLowerCase().replace(/_/g, ""), k]);
  const match = normalized.find(([n]) => n === "cost" || n === "total" || n === "count");
  return match ? match[1] : orderedKeys.find((k) => /total|cost|count/.test(k.toLowerCase().replace(/_/g, ""))) ?? null;
}

function numericTotal(row, totalKey) {
  if (!totalKey || row[totalKey] == null) return 0;
  const n = Number(row[totalKey]);
  return Number.isNaN(n) ? 0 : n;
}

const sortGroupKeys = (a, b) => {
  if (a === "__null") return 1;
  if (b === "__null") return -1;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
};

/** Group rows by technician; technician shown once per group; add subtotal row per technician. */
function rowsWithTechnicianGrouping(rows, orderedKeys) {
  const technicianKey = findTechnicianKey(orderedKeys);
  const totalKey = findTotalKey(orderedKeys);
  const jobCountKey = findJobCountKey(orderedKeys);
  if (!technicianKey || rows.length === 0) {
    return rows.map((r, i) => ({ ...r, __index: i, __showTechnician: true, __groupKey: null }));
  }
  const byTech = new Map();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const val = row[technicianKey] != null ? row[technicianKey] : "__null";
    const k = String(val);
    if (!byTech.has(k)) byTech.set(k, []);
    byTech.get(k).push({ ...row, __index: i });
  }
  const result = [];
  const keysSorted = Array.from(byTech.keys()).sort(sortGroupKeys);
  for (const techVal of keysSorted) {
    const techRows = byTech.get(techVal);
    const groupKey = `technician:${techVal}`;
    let first = true;
    for (const row of techRows) {
      result.push({ ...row, __showTechnician: first, __groupKey: groupKey });
      first = false;
    }
    result.push({
      __subtotal: true,
      level: "technician",
      technicianKey,
      technicianValue: techVal === "__null" ? null : techVal,
      totalSum: totalKey ? techRows.reduce((acc, r) => acc + numericTotal(r, totalKey), 0) : null,
      jobCountSum: jobCountKey ? techRows.reduce((acc, r) => acc + numericTotal(r, jobCountKey), 0) : null,
      count: techRows.length,
      totalKey,
      jobCountKey,
      __groupKey: groupKey,
    });
  }
  return result;
}

function formatCellValue(value) {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))) {
    try {
      return new Date(value).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
    } catch {
      return String(value);
    }
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatTotalValue(value) {
  if (value == null || value === "") return "0.00";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  const fixed = n.toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return decPart != null ? `${withSpaces}.${decPart}` : withSpaces;
}

/** Format numeric Job Count column as ### ##0 (space-separated thousands, no decimals). */
function formatJobCountValue(value) {
  if (value == null || value === "") return "0";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  const intPart = Math.floor(Math.abs(n)).toString();
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return n < 0 ? `-${withSpaces}` : withSpaces;
}

export function JobsPerTechnicianContent({ getJobsPerTechnician }) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [gridData, setGridData] = useState([]);
  const [reportError, setReportError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [collapsedKeys, setCollapsedKeys] = useState(() => new Set());

  const toggleCollapsed = (key) => {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleShowReport = () => {
    setReportError(null);
    if (typeof getJobsPerTechnician !== "function") return;
    startTransition(async () => {
      const result = await getJobsPerTechnician(fromDate || null, toDate || null);
      if (result?.error) {
        setReportError(result.error);
        setGridData([]);
      } else {
        setGridData(Array.isArray(result?.data) ? result.data : []);
      }
    });
  };

  const orderedKeys = gridData.length > 0 ? Object.keys(gridData[0]) : [];
  const technicianKey = findTechnicianKey(orderedKeys);
  const totalKey = findTotalKey(orderedKeys);
  const jobCountKey = findJobCountKey(orderedKeys);
  const groupedRows = rowsWithTechnicianGrouping(gridData, orderedKeys);
  const rowsToRender = groupedRows.filter((row) => {
    if (row.__subtotal) return true;
    return row.__groupKey == null || !collapsedKeys.has(row.__groupKey);
  });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="jobspertechnician-from" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            From
          </label>
          <input
            id="jobspertechnician-from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={inputClass}
            aria-label="From date"
          />
        </div>
        <div>
          <label htmlFor="jobspertechnician-to" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            To
          </label>
          <input
            id="jobspertechnician-to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={inputClass}
            aria-label="To date"
          />
        </div>
        <button
          type="button"
          onClick={handleShowReport}
          disabled={isPending}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          {isPending ? "Loading…" : "Show Report"}
        </button>
      </div>
      <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
      <div className="w-full overflow-auto">
        {isPending && (
          <p className="py-4 text-sm text-zinc-500 dark:text-zinc-400">Loading report…</p>
        )}
        {!isPending && reportError && (
          <p className="py-4 text-sm text-amber-600 dark:text-amber-400">{reportError}</p>
        )}
        {!isPending && !reportError && gridData.length === 0 && (
          <p className="py-4 text-sm text-zinc-500 dark:text-zinc-400">
            No data. Set From and To dates and click &quot;Show Report&quot; to load results.
          </p>
        )}
        {!isPending && !reportError && gridData.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full min-w-[32rem] table-fixed text-left text-xs">
              <thead>
                <tr>
                  {orderedKeys.map((key) => (
                    <th key={key} className={gridThClass}>
                      {getGridColumnHeader(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowsToRender.map((item, index) => {
                  if (item.__subtotal) {
                    const isCollapsed = collapsedKeys.has(item.__groupKey);
                    const label = `Technician total (${item.count} ${item.count === 1 ? "row" : "rows"})`;
                    return (
                      <tr
                        key={`subtotal-${item.__groupKey}-${index}`}
                        className={gridSubtotalRowClass}
                      >
                        {orderedKeys.map((key, i) => {
                          if (i === 0)
                            return (
                              <td key={key} className={gridTdClass}>
                                <button
                                  type="button"
                                  onClick={() => toggleCollapsed(item.__groupKey)}
                                  className="mr-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                                  aria-label={isCollapsed ? "Expand" : "Collapse"}
                                >
                                  {isCollapsed ? "▶" : "▼"}
                                </button>
                                {label}
                              </td>
                            );
                          if (technicianKey && key === item.technicianKey && item.technicianValue != null)
                            return (
                              <td key={key} className={gridTdClass}>
                                {String(item.technicianValue)}
                              </td>
                            );
                          if (jobCountKey && key === jobCountKey && item.jobCountSum != null)
                            return (
                              <td key={key} className={gridTdClass}>
                                {formatJobCountValue(item.jobCountSum)}
                              </td>
                            );
                          if (totalKey && key === totalKey && item.totalSum != null && key !== jobCountKey)
                            return (
                              <td key={key} className={gridTdClass}>
                                {formatTotalValue(item.totalSum)}
                              </td>
                            );
                          return <td key={key} className={gridTdClass} />;
                        })}
                      </tr>
                    );
                  }
                  const row = item;
                  return (
                    <tr key={row.id ?? row.__index ?? index} className={gridRowClass}>
                      {orderedKeys.map((key) => (
                        <td key={key} className={gridTdClass}>
                          {technicianKey && key === technicianKey && !row.__showTechnician
                            ? ""
                            : jobCountKey && key === jobCountKey
                              ? formatJobCountValue(row[key])
                              : formatCellValue(row[key])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
