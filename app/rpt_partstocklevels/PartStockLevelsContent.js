"use client";

import { useState, useTransition } from "react";
import { VirtualGrid } from "@/components/VirtualGrid";
import { exportPartStockLevelsToExcel } from "@/lib/export-utils";

const RADIO_ALL = "all";
const RADIO_REORDER = "reorder";

const PART_STOCK_LEVELS_COLUMNS = [
  { id: "stockcode", header: "Stock Code", accessorKey: "stockcode" },
  { id: "matcatno", header: "Mat Cat No", accessorKey: "matcatno" },
  { id: "binno", header: "Bin No", accessorKey: "binno" },
  { id: "stocklevel", header: "Stock Level", accessorKey: "stocklevel", numeric: true },
  { id: "reorder", header: "Reorder", accessorKey: "reorder", numeric: true },
  { id: "supplier", header: "Supplier", accessorKey: "supplier" },
];

function normalizeRows(data) {
  return (Array.isArray(data) ? data : []).map((row, i) => ({
    ...row,
    id: row.id ?? i,
  }));
}

export function PartStockLevelsContent({
  fetchPartStockLevels,
  fetchPartStockLevelsToOrder,
}) {
  const [reportType, setReportType] = useState(RADIO_ALL);
  const [gridData, setGridData] = useState([]);
  const [reportError, setReportError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleShowReport = () => {
    const fetchFn =
      reportType === RADIO_ALL ? fetchPartStockLevels : fetchPartStockLevelsToOrder;
    if (typeof fetchFn !== "function") return;
    setReportError(null);
    startTransition(async () => {
      const result = await fetchFn();
      setHasFetched(true);
      if (result?.error) {
        setReportError(result.error);
        setGridData([]);
      } else {
        setGridData(normalizeRows(result?.data ?? []));
      }
    });
  };

  return (
    <>
      <div className="mb-6">
        <fieldset className="flex flex-col gap-2" role="radiogroup" aria-label="Report type">
          <legend className="sr-only">Report type</legend>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
            <input
              type="radio"
              name="partstock-report-type"
              value={RADIO_ALL}
              checked={reportType === RADIO_ALL}
              onChange={() => setReportType(RADIO_ALL)}
              className="h-4 w-4 border-zinc-300 text-zinc-600 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-400"
            />
            All Parts
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
            <input
              type="radio"
              name="partstock-report-type"
              value={RADIO_REORDER}
              checked={reportType === RADIO_REORDER}
              onChange={() => setReportType(RADIO_REORDER)}
              className="h-4 w-4 border-zinc-300 text-zinc-600 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-400"
            />
            Parts to Re-order
          </label>
        </fieldset>
        <div className="mt-3 flex w-full justify-end">
          <button
            type="button"
            onClick={handleShowReport}
            disabled={isPending}
            className="rounded border border-sky-300 bg-sky-200 px-4 py-2 text-sm font-medium text-sky-900 shadow-sm hover:bg-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-70 dark:border-sky-600 dark:bg-sky-700 dark:text-sky-100 dark:hover:bg-sky-600"
          >
            Show Report
          </button>
        </div>
      </div>
      <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
      {gridData.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={async () => {
              const title =
                reportType === RADIO_ALL
                  ? "All Parts Stock Level"
                  : "Stock Level of Parts to Re-order";
              await exportPartStockLevelsToExcel(
                gridData,
                title,
                "part_stock_levels.xlsx",
                "Part Stock Levels"
              );
            }}
            className="rounded border border-green-300 bg-green-200 px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:border-green-600 dark:bg-green-700 dark:text-zinc-100 dark:hover:bg-green-600"
          >
            Export to Excel
          </button>
        </div>
      )}
      {isPending && (
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Loading…
        </p>
      )}
      {!isPending && reportError && (
        <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
          {reportError}
        </p>
      )}
      {!isPending && !reportError && hasFetched && gridData.length === 0 && (
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          No data.
        </p>
      )}
      {!isPending && !reportError && gridData.length > 0 && (
        <div className="w-full">
          <VirtualGrid
            columns={PART_STOCK_LEVELS_COLUMNS}
            data={gridData}
            height={500}
            className="w-full"
          />
        </div>
      )}
    </>
  );
}
