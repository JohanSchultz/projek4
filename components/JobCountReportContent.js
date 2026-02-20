"use client";

import { useState, useTransition } from "react";
import { VirtualGrid } from "@/components/VirtualGrid";
import { exportJobCountPerEquipmentItemToExcel } from "@/lib/export-utils";

const inputClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";

const JOBCOUNT_COLUMNS = [
  { id: "type", header: "Type" },
  { id: "serialno", header: "Serial No" },
  { id: "pistonno", header: "Piston No" },
  { id: "mine", header: "Mine" },
  { id: "shaft", header: "Shaft" },
  { id: "section", header: "Section" },
  { id: "gang", header: "Gang" },
  { id: "jobcount", header: "Job Count", numeric: true },
];

const ORDERED_KEYS = JOBCOUNT_COLUMNS.map((c) => c.id);
const JOBCOUNT_KEY = "jobcount";
const TYPE_KEY = "type";

function numericJobCount(row) {
  const v = row[JOBCOUNT_KEY];
  if (v == null) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function formatJobCountValue(value) {
  if (value == null || value === "") return "0";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  const intPart = Math.floor(Math.abs(n)).toString();
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return n < 0 ? `-${withSpaces}` : withSpaces;
}

function formatCellValue(value) {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number" && !Number.isNaN(value)) return String(value);
  return String(value);
}

const sortGroupKeys = (a, b) => {
  if (a === "__null") return 1;
  if (b === "__null") return -1;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
};

/** Group rows by type; type shown once per group; add subtotal row with jobcount sum. */
function rowsWithTypeGrouping(rows) {
  if (rows.length === 0) return [];
  const byType = new Map();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const val = row[TYPE_KEY] != null ? row[TYPE_KEY] : "__null";
    const k = String(val);
    if (!byType.has(k)) byType.set(k, []);
    byType.get(k).push({ ...row, __index: i });
  }
  const result = [];
  const keysSorted = Array.from(byType.keys()).sort(sortGroupKeys);
  for (const typeVal of keysSorted) {
    const typeRows = byType.get(typeVal);
    const groupKey = `type:${typeVal}`;
    let first = true;
    for (const row of typeRows) {
      result.push({ ...row, __showType: first, __groupKey: groupKey });
      first = false;
    }
    result.push({
      __subtotal: true,
      typeValue: typeVal === "__null" ? null : typeVal,
      jobCountSum: typeRows.reduce((acc, r) => acc + numericJobCount(r), 0),
      count: typeRows.length,
      __groupKey: groupKey,
    });
  }
  return result;
}

/**
 * Report content: From/To datepickers, Show Report, then virtualized grid or loading/no-data.
 * @param {{ getJobCountPerItem: (from: string | null, to: string | null) => Promise<{ data: unknown[] | null, error: string | null }> }} props
 */
const gridThClass =
  "border-b border-zinc-200 bg-zinc-100 px-4 py-3 text-left text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
const gridTdClass = "border-b border-zinc-200 px-4 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:text-zinc-200";
const gridRowClass = "bg-zinc-50/80 dark:bg-zinc-800/30";
const gridRowAltClass = "bg-white dark:bg-zinc-900";
const gridSubtotalRowClass =
  "border-b border-zinc-200 bg-zinc-200 font-medium dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-100";

export function JobCountReportContent({ getJobCountPerItem }) {
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
    if (typeof getJobCountPerItem !== "function") return;
    startTransition(async () => {
      const result = await getJobCountPerItem(fromDate || null, toDate || null);
      if (result?.error) {
        setReportError(result.error);
        setGridData([]);
      } else {
        setGridData(Array.isArray(result?.data) ? result.data : []);
      }
    });
  };

  const hasData = gridData.length > 0;
  const showGrid = !isPending && !reportError && hasData;
  const showNoData = !isPending && !reportError && !hasData;

  const groupedRows = rowsWithTypeGrouping(gridData);
  const rowsToRender = groupedRows.filter((row) => {
    if (row.__subtotal) return true;
    return row.__groupKey == null || !collapsedKeys.has(row.__groupKey);
  });

  const handleExportToExcel = () => {
    const headers = ORDERED_KEYS.map((k) => JOBCOUNT_COLUMNS.find((c) => c.id === k)?.header ?? k);
    const rows = [headers];
    for (const item of rowsToRender) {
      if (item.__subtotal) {
        const label = `Type total (${item.count} ${item.count === 1 ? "row" : "rows"})`;
        rows.push([
          label,
          "",
          "",
          "",
          "",
          "",
          "",
          formatJobCountValue(item.jobCountSum),
        ]);
      } else {
        const typeVal = item[TYPE_KEY] != null && item.__showType ? formatCellValue(item[TYPE_KEY]) : "";
        rows.push([
          typeVal,
          formatCellValue(item.serialno),
          formatCellValue(item.pistonno),
          formatCellValue(item.mine),
          formatCellValue(item.shaft),
          formatCellValue(item.section),
          formatCellValue(item.gang),
          formatJobCountValue(item[JOBCOUNT_KEY]),
        ]);
      }
    }
    exportJobCountPerEquipmentItemToExcel(
      rows,
      "jobcount_per_equipment_item.xlsx",
      "Job Count per Item",
      { fromDate, toDate }
    );
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <label
            htmlFor="jobcount-from"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            From
          </label>
          <input
            id="jobcount-from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={inputClass}
            aria-label="From date"
          />
        </div>
        <div>
          <label
            htmlFor="jobcount-to"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            To
          </label>
          <input
            id="jobcount-to"
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

      {isPending && (
        <p className="py-4 text-sm text-zinc-500 dark:text-zinc-400">
          Loading…
        </p>
      )}
      {reportError && (
        <p className="py-4 text-sm text-amber-600 dark:text-amber-400">
          {reportError}
        </p>
      )}
      {showNoData && (
        <p className="py-4 text-sm text-zinc-500 dark:text-zinc-400">
          No data.
        </p>
      )}
      {showGrid && (
        <>
          <div className="mb-3">
            <button
              type="button"
              onClick={handleExportToExcel}
              className="rounded bg-green-200 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-green-700 dark:text-zinc-100 dark:hover:bg-green-600"
            >
              Export to Excel
            </button>
          </div>
          <div className="w-full overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full min-w-[32rem] table-fixed text-left text-sm">
            <thead>
              <tr>
                {ORDERED_KEYS.map((key) => (
                  <th
                    key={key}
                    className={`${gridThClass} ${key === JOBCOUNT_KEY ? "text-right" : ""}`}
                  >
                    {JOBCOUNT_COLUMNS.find((c) => c.id === key)?.header ?? key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowsToRender.map((item, index) => {
                if (item.__subtotal) {
                  const isCollapsed = collapsedKeys.has(item.__groupKey);
                  const label = `Type total (${item.count} ${item.count === 1 ? "row" : "rows"})`;
                  return (
                    <tr key={`subtotal-${item.__groupKey}-${index}`} className={gridSubtotalRowClass}>
                      <td className={gridTdClass}>
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
                      {ORDERED_KEYS.slice(1, -1).map((key) => (
                        <td key={key} className={gridTdClass} />
                      ))}
                      <td className={`${gridTdClass} text-right tabular-nums`}>
                        {formatJobCountValue(item.jobCountSum)}
                      </td>
                    </tr>
                  );
                }
                const row = item;
                const rowIndex = row.__index ?? index;
                const isEven = rowIndex % 2 === 0;
                return (
                  <tr
                    key={row.id ?? row.__index ?? index}
                    className={isEven ? gridRowClass : gridRowAltClass}
                  >
                    {ORDERED_KEYS.map((key) => (
                      <td
                        key={key}
                        className={`${gridTdClass} ${key === JOBCOUNT_KEY ? "text-right tabular-nums" : ""}`}
                      >
                        {key === TYPE_KEY && !row.__showType
                          ? ""
                          : key === JOBCOUNT_KEY
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
        </>
      )}
    </>
  );
}
