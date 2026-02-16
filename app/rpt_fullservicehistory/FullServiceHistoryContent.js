"use client";

import { useState, useTransition } from "react";
import { DateRangeEquipmentTypeFilter } from "@/components/DateRangeEquipmentTypeFilter";

const gridRowClass =
  "border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50";
const gridThClass =
  "border-b border-zinc-200 bg-zinc-100 px-4 py-3 font-semibold text-left text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
const gridTdClass = "px-4 py-3 text-xs text-zinc-800 dark:text-zinc-200";

const gridColumnHeaders = {
  mine: "Mine",
  shaft: "Shaft",
  section: "Section",
  gang: "Gang",
  type: "Type",
  serialno: "Serial No",
  jobno: "Job No",
  stockcode: "Stock Code",
  part: "Part",
  qty: "Qty",
  unitcost: "Unit Cost",
  isdamaged: "Abuse",
  cost: "Total",
};

function getGridColumnHeader(key) {
  return gridColumnHeaders[key] ?? key;
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

export function FullServiceHistoryContent({
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
        {!isPending && !reportError && gridData.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full min-w-[32rem] table-fixed text-left text-xs">
              <thead>
                <tr>
                  {Object.keys(gridData[0]).map((key) => (
                    <th key={key} className={gridThClass}>
                      {getGridColumnHeader(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridData.map((row, index) => (
                  <tr key={row.id ?? index} className={gridRowClass}>
                    {Object.keys(gridData[0]).map((key) => (
                      <td key={key} className={gridTdClass}>
                        {formatGridValue(row[key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
