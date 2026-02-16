"use client";

import { useState, useTransition } from "react";
import { DateRangeEquipmentTypeFilter } from "@/components/DateRangeEquipmentTypeFilter";

const gridRowClass =
  "border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50";
const gridSubtotalRowClass =
  "border-b border-zinc-200 bg-zinc-200 font-medium dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-100";
const gridThClass =
  "border-b border-zinc-200 bg-zinc-100 px-4 py-3 font-semibold text-left text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
const gridTdClass = "px-4 py-3 text-xs text-zinc-800 dark:text-zinc-200";

const gridColumnHeaders = {
  serialno: "Serial No",
  jobno: "Job No",
  stockcode: "Stock Code",
  unitcost: "Unit Cost",
  isdamaged: "Abuse",
  cost: "Total",
};

function getGridColumnHeader(key) {
  const normalized = key.toLowerCase().replace(/_/g, "");
  return gridColumnHeaders[normalized] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function findMineKey(orderedKeys) {
  const normalized = orderedKeys.map((k) => [k.toLowerCase().replace(/_/g, ""), k]);
  const match = normalized.find(([n]) => n === "mine");
  return match ? match[1] : orderedKeys.find((k) => /mine/.test(k.toLowerCase())) ?? null;
}

function findTotalKey(orderedKeys) {
  const normalized = orderedKeys.map((k) => [k.toLowerCase().replace(/_/g, ""), k]);
  const match = normalized.find(([n]) => n === "cost" || n === "total");
  return match ? match[1] : orderedKeys.find((k) => /total|cost/.test(k.toLowerCase().replace(/_/g, ""))) ?? null;
}

function numericTotal(row, totalKey) {
  if (!totalKey || row[totalKey] == null) return 0;
  const n = Number(row[totalKey]);
  return Number.isNaN(n) ? 0 : n;
}

/** Group rows by Mine; don't repeat mine value (show only on first row of group); add subtotal row per mine with sum of Total. */
function rowsWithMineGrouping(rows, orderedKeys) {
  const mineKey = findMineKey(orderedKeys);
  const totalKey = findTotalKey(orderedKeys);
  if (!mineKey || rows.length === 0) {
    return rows.map((r, i) => ({ ...r, __index: i, __showMine: true }));
  }
  const groups = new Map();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const mineVal = row[mineKey] != null ? row[mineKey] : "__null";
    const key = String(mineVal);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ ...row, __index: i });
  }
  const result = [];
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (a === "__null") return 1;
    if (b === "__null") return -1;
    return String(a).localeCompare(String(b), undefined, { numeric: true });
  });
  for (const key of sortedKeys) {
    const groupRows = groups.get(key);
    let first = true;
    for (const row of groupRows) {
      result.push({ ...row, __showMine: first });
      first = false;
    }
    const totalSum = totalKey ? groupRows.reduce((acc, r) => acc + numericTotal(r, totalKey), 0) : 0;
    result.push({
      __subtotal: true,
      mineValue: key === "__null" ? null : key,
      totalSum,
      count: groupRows.length,
      mineKey,
      totalKey,
    });
  }
  return result;
}

function formatGridValue(value) {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (
    value instanceof Date ||
    (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))
  ) {
    try {
      return new Date(value).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return String(value);
    }
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function ServicesDoneContent({
  equipmentTypes,
  mines,
  fetchShaftsByMineId,
  fetchSectionsByShaftId,
  fetchGangsBySectionId,
  fetchJobsWithParts,
}) {
  const [gridData, setGridData] = useState([]);
  const [reportError, setReportError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleShowReport = (params) => {
    setReportError(null);
    if (typeof fetchJobsWithParts !== "function") return;
    startTransition(async () => {
      const result = await fetchJobsWithParts(
        params.selectedMineId ?? 0,
        params.selectedShaftId ?? 0,
        params.selectedSectionId ?? 0,
        params.selectedGangId ?? 0,
        params.selectedIds ?? [],
        params.fromDate || null,
        params.toDate || null
      );
      if (result?.error) {
        setReportError(result.error);
        setGridData([]);
      } else {
        setGridData(Array.isArray(result?.data) ? result.data : []);
      }
    });
  };

  return (
    <>
      <div className="mb-6">
        <DateRangeEquipmentTypeFilter
          equipmentTypes={equipmentTypes ?? []}
          mines={mines ?? []}
          fetchShaftsByMineId={fetchShaftsByMineId}
          fetchSectionsByShaftId={fetchSectionsByShaftId}
          fetchGangsBySectionId={fetchGangsBySectionId}
          onShowReport={handleShowReport}
        />
      </div>
      <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
      <div className="w-full overflow-auto">
        {isPending && (
          <p className="py-4 text-sm text-zinc-500 dark:text-zinc-400">
            Loading report…
          </p>
        )}
        {!isPending && reportError && (
          <p className="py-4 text-sm text-amber-600 dark:text-amber-400">
            {reportError}
          </p>
        )}
        {!isPending && !reportError && gridData.length === 0 && (
          <p className="py-4 text-sm text-zinc-500 dark:text-zinc-400">
            No data. Use the filter above and click &quot;Show Report&quot; to load results.
          </p>
        )}
        {!isPending && !reportError && gridData.length > 0 && (() => {
          const orderedKeys = Object.keys(gridData[0]);
          const rowsToRender = rowsWithMineGrouping(gridData, orderedKeys);
          const mineKey = findMineKey(orderedKeys);
          const totalKey = findTotalKey(orderedKeys);
          return (
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
                      return (
                        <tr key={`subtotal-${item.mineValue ?? "null"}-${index}`} className={gridSubtotalRowClass}>
                          {orderedKeys.map((key, i) => {
                            if (i === 0)
                              return (
                                <td key={key} className={gridTdClass}>
                                  Subtotal ({item.count} {item.count === 1 ? "row" : "rows"})
                                </td>
                              );
                            if (key === item.mineKey)
                              return (
                                <td key={key} className={gridTdClass}>
                                  {item.mineValue != null ? String(item.mineValue) : "—"}
                                </td>
                              );
                            if (totalKey && key === totalKey)
                              return (
                                <td key={key} className={gridTdClass}>
                                  {formatGridValue(item.totalSum)}
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
                            {key === mineKey && !row.__showMine ? "" : formatGridValue(row[key])}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </>
  );
}
