"use client";

import { useState, useTransition } from "react";
import { DateRangeEquipmentTypeFilter } from "@/components/DateRangeEquipmentTypeFilter";
import { VirtualGrid } from "@/components/VirtualGrid";
import { exportPartUsagePercOfJobsToExcel } from "@/lib/export-utils";

function formatNum(value) {
  if (value == null || value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  const fixed = n.toFixed(2);
  const parts = fixed.split(".");
  const intPart = parts[0] ?? "0";
  const decPart = parts[1] ?? "00";
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${withSpaces}.${decPart}`;
}

function formatNumInt(value) {
  if (value == null || value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  const intVal = Math.round(n);
  const intPart = String(intVal);
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

const PART_USAGE_PERC_COLUMNS = [
  { id: "stockcode", header: "Stock Code", accessorKey: "stockcode" },
  { id: "part", header: "Part", accessorKey: "part" },
  {
    id: "unitcost",
    header: "Unit Cost",
    accessorKey: "unitcost",
    numeric: true,
    accessorFn: (r) => formatNum(r?.unitcost),
  },
  {
    id: "qtyreplaced",
    header: "Qty Replaced",
    accessorKey: "qtyreplaced",
    numeric: true,
    accessorFn: (r) => formatNumInt(r?.qtyreplaced),
  },
  {
    id: "totalcost",
    header: "Total Cost",
    accessorKey: "totalcost",
    numeric: true,
    accessorFn: (r) => formatNum(r?.totalcost),
  },
  {
    id: "qty",
    header: "Qty",
    accessorKey: "qty",
    numeric: true,
    accessorFn: (r) => formatNumInt(r?.qty),
  },
  {
    id: "percperjobs",
    header: "Perc Per Jobs",
    accessorKey: "percperjobs",
    numeric: true,
    accessorFn: (r) => formatNum(r?.percperjobs),
  },
];

function normalizeRows(data) {
  return (Array.isArray(data) ? data : []).map((row, i) => ({
    ...row,
    id: row.id ?? i,
  }));
}

export function PartUsageAsPercOfJobsContent({
  equipmentTypes,
  mines,
  fetchShaftsByMineId,
  fetchSectionsByShaftId,
  fetchGangsBySectionId,
  fetchRptPartUsagePercOfJobs,
}) {
  const [gridData, setGridData] = useState([]);
  const [reportError, setReportError] = useState(null);
  const [reportFilterOptions, setReportFilterOptions] = useState({});
  const [hasFetched, setHasFetched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleShowReport = (params) => {
    if (typeof fetchRptPartUsagePercOfJobs !== "function") return;
    setReportError(null);
    setReportFilterOptions({
      fromDate: params.fromDate ?? null,
      toDate: params.toDate ?? null,
      mine: params.mineLabel ?? "",
      shaft: params.shaftLabel ?? "",
      section: params.sectionLabel ?? "",
      gang: params.gangLabel ?? "",
      equipmentTypeLabels: Array.isArray(params.equipmentTypeLabels) ? params.equipmentTypeLabels : [],
    });
    startTransition(async () => {
      const result = await fetchRptPartUsagePercOfJobs(
        params.selectedMineId ?? 0,
        params.selectedShaftId ?? 0,
        params.selectedSectionId ?? 0,
        params.selectedGangId ?? 0,
        params.selectedIds ?? [],
        params.fromDate || null,
        params.toDate || null
      );
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
        <DateRangeEquipmentTypeFilter
          equipmentTypes={equipmentTypes ?? []}
          mines={mines ?? []}
          fetchShaftsByMineId={fetchShaftsByMineId}
          fetchSectionsByShaftId={fetchSectionsByShaftId}
          fetchGangsBySectionId={fetchGangsBySectionId}
          onShowReport={handleShowReport}
          showReportNextToSelectAll={false}
        />
      </div>
      <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
      {gridData.length > 0 && (
        <div className="mb-4 flex w-full justify-start">
          <button
            type="button"
            onClick={async () => {
              await exportPartUsagePercOfJobsToExcel(
                gridData,
                "part_usage_perc_of_jobs.xlsx",
                "Part Usage As % of Jobs",
                reportFilterOptions
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
            columns={PART_USAGE_PERC_COLUMNS}
            data={gridData}
            height={500}
            className="w-full"
          />
        </div>
      )}
    </>
  );
}